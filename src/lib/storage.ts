import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

export interface Session {
  id: string;
  date: number;
  language: string;
  difficulty: string;
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number;
  charactersTyped: number;
  theme: string;
}

export interface ErrorPattern {
  id: string;
  date: number;
  expected: string;
  typed: string;
  position: number;
}

export interface Achievement {
  id: string;
  unlockedAt: number;
  key: string;
}

interface TypingTutorDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: {
      'by-date': number;
      'by-language': string;
      'by-wpm': number;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: string | number | boolean | object;
    };
  };
  errorPatterns: {
    key: string;
    value: ErrorPattern;
    indexes: {
      'by-date': number;
    };
  };
  achievements: {
    key: string;
    value: Achievement;
  };
}

const DB_NAME = 'codekey-typing-tutor';
const DB_VERSION = 2;
const MAX_SESSIONS = 1000;

let dbPromise: Promise<IDBPDatabase<TypingTutorDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<TypingTutorDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TypingTutorDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-date', 'date');
          sessionStore.createIndex('by-language', 'language');
          sessionStore.createIndex('by-wpm', 'wpm');
          
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (oldVersion < 2) {
          const errorStore = db.createObjectStore('errorPatterns', { keyPath: 'id' });
          errorStore.createIndex('by-date', 'date');
          
          db.createObjectStore('achievements', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: Omit<Session, 'id'>): Promise<Session> {
  const db = await getDB();
  
  const newSession: Session = {
    ...session,
    id: uuidv4(),
  };
  
  await db.put('sessions', newSession);
  
  await cleanupOldSessions(db);
  
  return newSession;
}

async function cleanupOldSessions(db: IDBPDatabase<TypingTutorDB>): Promise<void> {
  const count = await db.count('sessions');
  
  if (count > MAX_SESSIONS) {
    const allSessions = await db.getAllFromIndex('sessions', 'by-date');
    const toDelete = allSessions.slice(0, count - MAX_SESSIONS);
    
    for (const session of toDelete) {
      await db.delete('sessions', session.id);
    }
  }
}

export async function getSessions(limit: number = 100): Promise<Session[]> {
  const db = await getDB();
  const sessions = await db.getAllFromIndex('sessions', 'by-date');
  return sessions.reverse().slice(0, limit);
}

export async function getSessionsByLanguage(language: string): Promise<Session[]> {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'by-language', language);
}

export async function getRecentSessions(days: number = 30): Promise<Session[]> {
  const db = await getDB();
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  const allSessions = await db.getAllFromIndex('sessions', 'by-date');
  return allSessions.filter(s => s.date >= cutoff).reverse();
}

export async function getStats(): Promise<{
  totalSessions: number;
  bestWpm: number;
  averageWpm: number;
  averageAccuracy: number;
  totalTime: number;
  currentStreak: number;
}> {
  const db = await getDB();
  const sessions = await db.getAll('sessions');
  
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      bestWpm: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      totalTime: 0,
      currentStreak: 0,
    };
  }
  
  const sortedByDate = [...sessions].sort((a, b) => b.date - a.date);
  
  const bestWpm = Math.max(...sessions.map(s => s.wpm));
  const averageWpm = Math.round(sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length);
  const averageAccuracy = Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length);
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dayStart = checkDate.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    
    const hasSession = sortedByDate.some(s => s.date >= dayStart && s.date < dayEnd);
    
    if (hasSession) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return {
    totalSessions: sessions.length,
    bestWpm,
    averageWpm,
    averageAccuracy,
    totalTime,
    currentStreak: streak,
  };
}

export async function clearHistory(): Promise<void> {
  const db = await getDB();
  await db.clear('sessions');
}

export async function exportData(): Promise<string> {
  const sessions = await getSessions(MAX_SESSIONS);
  return JSON.stringify(sessions, null, 2);
}

export async function importData(jsonData: string): Promise<number> {
  const sessions: Session[] = JSON.parse(jsonData);
  const db = await getDB();
  
  let imported = 0;
  for (const session of sessions) {
    await db.put('sessions', session);
    imported++;
  }
  
  return imported;
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  const setting = await db.get('settings', key);
  return setting ? (setting.value as T) : defaultValue;
}

export async function setSetting<T extends string | number | boolean>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function saveErrorPattern(expected: string, typed: string, position: number): Promise<ErrorPattern> {
  const db = await getDB();
  const pattern: ErrorPattern = {
    id: uuidv4(),
    date: Date.now(),
    expected,
    typed,
    position,
  };
  await db.put('errorPatterns', pattern);
  
  const count = await db.count('errorPatterns');
  if (count > 500) {
    const allPatterns = await db.getAllFromIndex('errorPatterns', 'by-date');
    const toDelete = allPatterns.slice(0, count - 500);
    for (const p of toDelete) {
      await db.delete('errorPatterns', p.id);
    }
  }
  
  return pattern;
}

export async function getErrorPatterns(limit: number = 100): Promise<ErrorPattern[]> {
  const db = await getDB();
  const patterns = await db.getAllFromIndex('errorPatterns', 'by-date');
  return patterns.reverse().slice(0, limit);
}

export async function getTopErrorPatterns(): Promise<{ pattern: string; count: number }[]> {
  const db = await getDB();
  const patterns = await db.getAll('errorPatterns');
  
  const counts: Record<string, number> = {};
  for (const p of patterns) {
    const key = `${p.expected}|${p.typed}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  
  return Object.entries(counts)
    .map(([pattern, count]) => {
      const [expected, typed] = pattern.split('|');
      return { pattern: `Expected "${expected}" but typed "${typed}"`, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export const ACHIEVEMENTS = [
  { key: 'first_session', name: 'First Steps', description: 'Complete your first typing session', icon: '🎯' },
  { key: 'speed_demon', name: 'Speed Demon', description: 'Reach 100 WPM', icon: '⚡' },
  { key: 'perfectionist', name: 'Perfectionist', description: 'Achieve 100% accuracy', icon: '💎' },
  { key: 'week_streak', name: 'Dedicated', description: 'Practice for 7 days in a row', icon: '🔥' },
  { key: 'month_streak', name: 'Committed', description: 'Practice for 30 days in a row', icon: '🏆' },
  { key: 'polyglot', name: 'Polyglot', description: 'Practice all available languages', icon: '🌍' },
  { key: 'marathon', name: 'Marathon', description: 'Complete 100 sessions', icon: '🏃' },
  { key: 'early_bird', name: 'Early Bird', description: 'Practice before 8 AM', icon: '🌅' },
  { key: 'night_owl', name: 'Night Owl', description: 'Practice after 10 PM', icon: '🦉' },
  { key: 'hardcore_master', name: 'Hardcore Master', description: 'Complete 10 hardcore sessions', icon: '💀' },
];

export async function unlockAchievement(key: string): Promise<Achievement | null> {
  const db = await getDB();
  const existing = await db.get('achievements', key);
  if (existing) return null;
  
  const achievement: Achievement = {
    id: key,
    key,
    unlockedAt: Date.now(),
  };
  await db.put('achievements', achievement);
  return achievement;
}

export async function getAchievements(): Promise<Achievement[]> {
  const db = await getDB();
  return db.getAll('achievements');
}

export async function checkAndUnlockAchievements(session: Session, stats: { totalSessions: number; currentStreak: number; languages: string[] }): Promise<Achievement[]> {
  const unlocked: Achievement[] = [];
  
  if (stats.totalSessions === 1) {
    const achievement = await unlockAchievement('first_session');
    if (achievement) unlocked.push(achievement);
  }
  
  if (session.wpm >= 100) {
    const achievement = await unlockAchievement('speed_demon');
    if (achievement) unlocked.push(achievement);
  }
  
  if (session.accuracy === 100) {
    const achievement = await unlockAchievement('perfectionist');
    if (achievement) unlocked.push(achievement);
  }
  
  if (stats.currentStreak >= 7) {
    const achievement = await unlockAchievement('week_streak');
    if (achievement) unlocked.push(achievement);
  }
  
  if (stats.currentStreak >= 30) {
    const achievement = await unlockAchievement('month_streak');
    if (achievement) unlocked.push(achievement);
  }
  
  if (stats.totalSessions >= 100) {
    const achievement = await unlockAchievement('marathon');
    if (achievement) unlocked.push(achievement);
  }
  
  const hour = new Date().getHours();
  if (hour < 8) {
    const achievement = await unlockAchievement('early_bird');
    if (achievement) unlocked.push(achievement);
  }
  
  if (hour >= 22) {
    const achievement = await unlockAchievement('night_owl');
    if (achievement) unlocked.push(achievement);
  }
  
  return unlocked;
}

export interface DailyChallenge {
  date: string;
  type: 'speed' | 'accuracy' | 'language';
  target: number;
  language?: string;
  completed: boolean;
}

export function getDailyChallenge(): DailyChallenge {
  const today = new Date().toISOString().split('T')[0];
  const seed = today.split('-').reduce((acc, part) => acc + parseInt(part), 0);
  const random = (seed * 9301 + 49297) % 233280;
  
  const types: DailyChallenge['type'][] = ['speed', 'accuracy', 'language'];
  const type = types[random % 3];
  
  const challenges: DailyChallenge[] = [
    { date: today, type: 'speed', target: 60 + (random % 40), completed: false },
    { date: today, type: 'accuracy', target: 95 + (random % 5), completed: false },
    { date: today, type: 'language', target: 1, language: ['javascript', 'python', 'typescript', 'rust'][random % 4], completed: false },
  ];
  
  return challenges[random % challenges.length];
}

export async function getTodayChallenge(): Promise<DailyChallenge> {
  const db = await getDB();
  const today = new Date().toISOString().split('T')[0];
  const saved = await db.get('settings', 'dailyChallenge');
  
  if (saved && typeof saved.value === 'object') {
    const challenge = saved.value as DailyChallenge;
    if (challenge.date === today) {
      return challenge;
    }
  }
  
  const newChallenge = getDailyChallenge();
  await db.put('settings', { key: 'dailyChallenge', value: newChallenge });
  return newChallenge;
}

export async function completeDailyChallenge(challenge: DailyChallenge): Promise<DailyChallenge> {
  const db = await getDB();
  const completed = { ...challenge, completed: true };
  await db.put('settings', { key: 'dailyChallenge', value: completed });
  return completed;
}
