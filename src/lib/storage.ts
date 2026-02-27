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
      value: string | number | boolean;
    };
  };
}

const DB_NAME = 'codekey-typing-tutor';
const DB_VERSION = 1;
const MAX_SESSIONS = 1000;

let dbPromise: Promise<IDBPDatabase<TypingTutorDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<TypingTutorDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TypingTutorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-date', 'date');
        sessionStore.createIndex('by-language', 'language');
        sessionStore.createIndex('by-wpm', 'wpm');
        
        db.createObjectStore('settings', { keyPath: 'key' });
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
