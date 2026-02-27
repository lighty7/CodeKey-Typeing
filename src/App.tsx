/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keyboard, 
  Code2, 
  Zap, 
  RotateCcw, 
  Settings, 
  Trophy, 
  ChevronDown,
  Terminal,
  Cpu,
  Braces,
  BarChart3,
  Shuffle
} from 'lucide-react';
import { cn } from './lib/utils';
import confetti from 'canvas-confetti';
import { getSnippet, Language, DifficultyLevel, getAvailableLanguages } from './lib/snippets-api';
import { saveSession, getSetting, setSetting } from './lib/storage';
import VirtualKeyboard from './components/VirtualKeyboard';
import ProgressPage from './pages/ProgressPage';

type Theme = 'emerald' | 'blue' | 'rose' | 'amber';

interface SettingsState {
  sound: boolean;
  difficulty: 'standard' | 'hardcore';
  theme: Theme;
}

interface Stats {
  wpm: number;
  accuracy: number;
  errors: number;
  totalChars: number;
  startTime: number | null;
  endTime: number | null;
  timeLeft: number;
}

const THEME_COLORS: Record<Theme, string> = {
  emerald: 'text-emerald-400 border-emerald-500 bg-emerald-500 shadow-emerald-500/20',
  blue: 'text-blue-400 border-blue-500 bg-blue-500 shadow-blue-500/20',
  rose: 'text-rose-400 border-rose-500 bg-rose-500 shadow-rose-500/20',
  amber: 'text-amber-400 border-amber-500 bg-amber-500 shadow-amber-500/20',
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<'practice' | 'progress'>('practice');
  const [snippet, setSnippet] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [language, setLanguage] = useState<Language>('warmup');
  const [level, setLevel] = useState<DifficultyLevel>('easy');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    sound: true,
    difficulty: 'standard',
    theme: 'emerald',
  });
  const [stats, setStats] = useState<Stats>({
    wpm: 0,
    accuracy: 100,
    errors: 0,
    totalChars: 0,
    startTime: null,
    endTime: null,
    timeLeft: 60,
  });
  const [isFinished, setIsFinished] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [realTimeWpm, setRealTimeWpm] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSnippetRef = useRef<string>('');
  const wpmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const LANGUAGES = getAvailableLanguages();

  const themeClass = THEME_COLORS[settings.theme];

  const fetchSnippet = useCallback(async (lang: Language, custom?: string, targetLevel: DifficultyLevel = 'easy') => {
    setIsLoading(true);
    if (lang === 'custom' && custom) {
      setSnippet(custom);
    } else {
      const result = await getSnippet(lang, targetLevel, true);
      let newSnippet = result.code;
      
      if (newSnippet === lastSnippetRef.current && lang !== 'custom') {
        const altResult = await getSnippet(lang, targetLevel, false);
        newSnippet = altResult.code;
      }
      
      lastSnippetRef.current = newSnippet;
      setSnippet(newSnippet);
    }
    setUserInput('');
    setIsFinished(false);
    setRealTimeWpm(0);
    setStats({
      wpm: 0,
      accuracy: 100,
      errors: 0,
      totalChars: 0,
      startTime: null,
      endTime: null,
      timeLeft: 60,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const savedTheme = await getSetting('theme', 'emerald');
      const savedSound = await getSetting('sound', true);
      const savedDifficulty = await getSetting('difficulty', 'standard');
      setSettings({
        theme: savedTheme as Theme,
        sound: savedSound as boolean,
        difficulty: savedDifficulty as 'standard' | 'hardcore',
      });
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (language !== 'custom') {
      setLevel('easy');
      fetchSnippet(language, undefined, 'easy');
    } else {
      setShowCustomModal(true);
    }
  }, [language, fetchSnippet]);

  useEffect(() => {
    if (stats.startTime && !isFinished && stats.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setStats(prev => {
          if (prev.timeLeft <= 1) {
            setIsFinished(true);
            if (timerRef.current) clearInterval(timerRef.current);
            if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);
            return { ...prev, timeLeft: 0, endTime: Date.now() };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stats.startTime, isFinished, stats.timeLeft]);

  useEffect(() => {
    if (stats.startTime && !isFinished) {
      wpmIntervalRef.current = setInterval(() => {
        if (stats.startTime) {
          const timeElapsed = (Date.now() - stats.startTime) / 1000 / 60;
          if (timeElapsed > 0) {
            const wordsTyped = userInput.length / 5;
            const wpm = Math.round(wordsTyped / timeElapsed);
            setRealTimeWpm(wpm);
          }
        }
      }, 500);
    }
    return () => {
      if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);
    };
  }, [stats.startTime, isFinished, userInput]);

  const calculateStats = useCallback((input: string, currentSnippet: string, start: number) => {
    const timeElapsed = (Date.now() - start) / 1000 / 60;
    const wordsTyped = input.length / 5;
    const wpm = Math.round(wordsTyped / timeElapsed) || 0;

    let errors = 0;
    let correctChars = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === currentSnippet[i]) {
        correctChars++;
      } else {
        errors++;
      }
    }

    const accuracy = Math.round((correctChars / input.length) * 100) || 100;

    return { wpm, accuracy, errors };
  }, []);

  const playClick = useCallback(() => {
    if (!settings.sound) return;
    const audio = new Audio('https://www.soundjay.com/button/button-16.mp3');
    audio.volume = 0.2;
    audio.play().catch(() => {});
  }, [settings.sound]);

  const saveSessionToHistory = useCallback(async () => {
    if (!stats.startTime || !snippet) return;
    
    const duration = stats.endTime 
      ? Math.round((stats.endTime - stats.startTime) / 1000)
      : Math.round((Date.now() - stats.startTime) / 1000);

    await saveSession({
      date: Date.now(),
      language,
      difficulty: level,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      errors: stats.errors,
      duration,
      charactersTyped: snippet.length,
      theme: settings.theme,
    });
  }, [stats, snippet, language, level, settings.theme]);

  const reset = useCallback(async () => {
    if (isFinished) {
      await saveSessionToHistory();
    }
    
    let nextLevel = level;
    if (isFinished && language !== 'custom') {
      if (level === 'easy') nextLevel = 'medium';
      else if (level === 'medium') nextLevel = 'hard';
    }
    
    setLevel(nextLevel);
    fetchSnippet(language, customCode, nextLevel);
  }, [fetchSnippet, language, customCode, level, isFinished, saveSessionToHistory]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        reset();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [reset]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isFinished) return;

    if (!stats.startTime && e.key.length === 1) {
      setStats(prev => ({ ...prev, startTime: Date.now() }));
    }

    if (e.key === 'Backspace') {
      setUserInput(prev => prev.slice(0, -1));
      return;
    }

    if (e.key.length === 1) {
      playClick();
      const nextInput = userInput + e.key;
      
      if (settings.difficulty === 'hardcore' && e.key !== snippet[userInput.length]) {
        setUserInput('');
        setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        return;
      }

      setUserInput(nextInput);

      if (stats.startTime) {
        const { wpm, accuracy, errors } = calculateStats(nextInput, snippet, stats.startTime);
        setStats(prev => ({ ...prev, wpm, accuracy, errors, totalChars: nextInput.length }));
      }

      if (nextInput.length === snippet.length) {
        setIsFinished(true);
        const endTime = Date.now();
        setStats(prev => ({ ...prev, endTime }));
        
        const finalStats = calculateStats(nextInput, snippet, stats.startTime!);
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: [
            settings.theme === 'emerald' ? '#10b981' : 
            settings.theme === 'blue' ? '#3b82f6' : 
            settings.theme === 'rose' ? '#f43f5e' : '#f59e0b'
          ]
        });
      }
    }
  };

  const handleThemeChange = async (theme: Theme) => {
    setSettings(s => ({ ...s, theme }));
    await setSetting('theme', theme);
  };

  const handleDifficultyChange = async (difficulty: 'standard' | 'hardcore') => {
    setSettings(s => ({ ...s, difficulty }));
    await setSetting('difficulty', difficulty);
  };

  const handleSoundChange = async (sound: boolean) => {
    setSettings(s => ({ ...s, sound }));
    await setSetting('sound', sound);
  };

  if (currentPage === 'progress') {
    return <ProgressPage theme={settings.theme} onBack={() => setCurrentPage('practice')} />;
  }

  const currentKey = snippet[userInput.length] || '';
  const nextKey = snippet[userInput.length + 1] || '';

  return (
    <div className={cn("min-h-screen flex flex-col items-center p-6 bg-[#0a0a0a] selection:bg-opacity-30", `selection:bg-${settings.theme}-500`)}>
      <header className="w-full max-w-4xl mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", themeClass.split(' ')[2], themeClass.split(' ')[3])}>
              <Keyboard className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CodeKey</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">v2.0.0</p>
                {language !== 'custom' && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold", 
                    level === 'easy' ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" :
                    level === 'medium' ? "border-blue-500/30 text-blue-500 bg-blue-500/10" :
                    "border-rose-500/30 text-rose-500 bg-rose-500/10"
                  )}>
                    {level}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 px-6 py-3 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">TIME</span>
                <span className={cn("text-xl font-mono font-bold", stats.timeLeft < 10 ? "text-rose-500 animate-pulse" : "text-zinc-100")}>
                  {stats.timeLeft}s
                </span>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">WPM</span>
                <span className={cn("text-xl font-mono font-bold", themeClass.split(' ')[0])}>
                  {realTimeWpm || stats.wpm}
                </span>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">ACC</span>
                <span className={cn("text-xl font-mono font-bold", themeClass.split(' ')[0])}>
                  {stats.accuracy}%
                </span>
              </div>
            </div>

            <button 
              onClick={() => setCurrentPage('progress')}
              className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:bg-zinc-800 transition-colors group"
              title="Progress"
            >
              <BarChart3 className="w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
            </button>

            <button 
              onClick={() => setShowTutorial(true)}
              className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:bg-zinc-800 transition-colors group"
              title="Tutorial"
            >
              <Trophy className="w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
            </button>

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <Settings className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl flex flex-col gap-8 items-center">
        <div className="flex justify-center gap-2 flex-wrap">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                language === lang.id 
                  ? cn("text-black shadow-lg", themeClass.split(' ')[2], themeClass.split(' ')[3])
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800/50"
              )}
            >
              {lang.id === 'warmup' && <Zap className="w-4 h-4" />}
              {lang.id === 'javascript' && <Code2 className="w-4 h-4" />}
              {lang.id === 'typescript' && <Braces className="w-4 h-4" />}
              {lang.id === 'python' && <Terminal className="w-4 h-4" />}
              {lang.id === 'rust' && <Zap className="w-4 h-4" />}
              {lang.id === 'go' && <Code2 className="w-4 h-4" />}
              {lang.id === 'cpp' && <Cpu className="w-4 h-4" />}
              {lang.id === 'c' && <Code2 className="w-4 h-4" />}
              {lang.id === 'random' && <Shuffle className="w-4 h-4" />}
              {lang.id === 'custom' && <Settings className="w-4 h-4" />}
              {lang.name}
            </button>
          ))}
        </div>

        <div 
          className="relative p-12 bg-zinc-900/30 rounded-[32px] border border-zinc-800/50 backdrop-blur-md shadow-2xl overflow-hidden group"
          onClick={() => inputRef.current?.focus()}
        >
          <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity", themeClass.split(' ')[0])} />
          
          <input
            ref={inputRef}
            type="text"
            className="absolute opacity-0 pointer-events-none"
            onKeyDown={handleKeyDown}
            autoFocus
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className={cn("w-12 h-12 border-4 border-opacity-20 rounded-full animate-spin", themeClass.split(' ')[1], themeClass.split(' ')[0].replace('text', 'border-t'))} />
              <p className="text-zinc-500 font-mono text-sm animate-pulse">Loading snippet...</p>
            </div>
          ) : (
            <div className="relative font-mono text-3xl leading-relaxed tracking-tight select-none whitespace-pre-wrap">
              {snippet.split('').map((char, index) => {
                let colorClass = "text-zinc-600";
                let isCurrent = index === userInput.length;
                
                if (index < userInput.length) {
                  colorClass = userInput[index] === char ? themeClass.split(' ')[0] : "text-rose-500 bg-rose-500/10 rounded-sm";
                }

                return (
                  <span 
                    key={index} 
                    className={cn(
                      colorClass, 
                      "transition-colors duration-75",
                      isCurrent && "border-l-2 cursor-blink",
                      isCurrent && themeClass.split(' ')[1]
                    )}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-8 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              className={cn("h-full rounded-full", themeClass.split(' ')[2].replace('bg-', 'bg-'))}
              initial={{ width: 0 }}
              animate={{ width: `${(userInput.length / snippet.length) * 100}%` }}
            />
          </div>

          <div className="mt-4 flex justify-center">
            <button 
              onClick={reset}
              className={cn(
                "group flex items-center gap-2 px-6 py-3 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 transition-all duration-300",
                settings.theme === 'emerald' && "hover:bg-emerald-500 hover:text-black",
                settings.theme === 'blue' && "hover:bg-blue-500 hover:text-black",
                settings.theme === 'rose' && "hover:bg-rose-500 hover:text-black",
                settings.theme === 'amber' && "hover:bg-amber-500 hover:text-black"
              )}
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-sm font-bold uppercase tracking-widest">Restart Session</span>
              <span className="ml-2 px-2 py-0.5 bg-zinc-900/50 rounded text-[10px] font-mono group-hover:bg-black/10">ESC</span>
            </button>
          </div>
        </div>

        <VirtualKeyboard 
          currentKey={currentKey} 
          nextKey={nextKey}
          theme={settings.theme}
          disabled={isFinished}
        />
      </main>

      <AnimatePresence>
        {isFinished && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-[40px] p-12 shadow-2xl relative overflow-hidden">
              <div className={cn("absolute top-0 left-0 w-full h-2", themeClass.split(' ')[2])} />
              
              <div className="flex flex-col items-center text-center gap-8">
                <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center bg-opacity-10", themeClass.split(' ')[2])}>
                  <Trophy className={cn("w-10 h-10", themeClass.split(' ')[0])} />
                </div>
                
                <div>
                  <h2 className="text-4xl font-bold tracking-tight mb-2">
                    {stats.timeLeft === 0 ? "Time's Up!" : "Session Complete"}
                  </h2>
                  <p className="text-zinc-500 font-mono uppercase tracking-widest text-sm mb-4">
                    {stats.wpm > 80 ? "Legendary Coder" : stats.wpm > 50 ? "Senior Developer" : "Junior Developer"}
                  </p>
                  {language !== 'custom' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700">
                      <span className="text-xs text-zinc-400 uppercase font-bold">Next Level:</span>
                      <span className={cn("text-xs font-bold uppercase", 
                        level === 'easy' ? "text-blue-400" : 
                        level === 'medium' ? "text-rose-400" : "text-emerald-400"
                      )}>
                        {level === 'easy' ? 'Medium' : level === 'medium' ? 'Hard' : 'Hard'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-6 w-full">
                  <div className="p-6 bg-zinc-800/50 rounded-3xl border border-zinc-700/30">
                    <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Speed</p>
                    <p className={cn("text-3xl font-mono font-bold", themeClass.split(' ')[0])}>{stats.wpm}</p>
                    <p className="text-[10px] text-zinc-600 font-mono">WPM</p>
                  </div>
                  <div className="p-6 bg-zinc-800/50 rounded-3xl border border-zinc-700/30">
                    <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Accuracy</p>
                    <p className={cn("text-3xl font-mono font-bold", themeClass.split(' ')[0])}>{stats.accuracy}%</p>
                    <p className="text-[10px] text-zinc-600 font-mono">Precision</p>
                  </div>
                  <div className="p-6 bg-zinc-800/50 rounded-3xl border border-zinc-700/30">
                    <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Errors</p>
                    <p className="text-3xl font-mono font-bold text-rose-400">{stats.errors}</p>
                    <p className="text-[10px] text-zinc-600 font-mono">Bugs</p>
                  </div>
                </div>

                <div className="flex gap-4 w-full">
                  <button 
                    onClick={reset}
                    className={cn("flex-1 py-5 text-black font-bold rounded-2xl transition-all shadow-lg", themeClass.split(' ')[2])}
                  >
                    Next Snippet
                  </button>
                  <button 
                    onClick={() => {
                      setIsFinished(false);
                      setUserInput('');
                    }}
                    className="px-8 py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all border border-zinc-700"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 shadow-2xl">
              <h3 className="text-2xl font-bold mb-4">Practice Custom Code</h3>
              <p className="text-zinc-500 text-sm mb-6">Paste any code snippet you want to practice. We'll strip extra whitespace to make it typing-friendly.</p>
              
              <textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="Paste your code here..."
                className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none mb-6"
              />

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    if (customCode.trim()) {
                      fetchSnippet('custom', customCode.trim());
                      setShowCustomModal(false);
                    }
                  }}
                  className={cn("flex-1 py-4 text-black font-bold rounded-xl transition-colors", themeClass.split(' ')[2])}
                >
                  Start Practice
                </button>
                <button 
                  onClick={() => {
                    setLanguage('warmup');
                    setShowCustomModal(false);
                  }}
                  className="px-8 py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-[32px] p-12 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold">Developer Typing Guide</h3>
                <button onClick={() => setShowTutorial(false)} className="text-zinc-500 hover:text-white">
                  <RotateCcw className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Hand Placement</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Keep your fingers on the <span className="text-white font-bold">Home Row</span> (ASDF JKL;). For coding, your pinkies are your most important fingers—they handle brackets, semicolons, and quotes.
                  </p>
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <p className="text-[10px] font-mono text-zinc-500 mb-2">PRO TIP</p>
                    <p className="text-xs italic text-zinc-300">"Don't look at the keyboard. Trust your muscle memory for special characters like {'{}'} and {'[]'}."</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-blue-400 font-bold uppercase tracking-widest text-xs">Coding Rhythm</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Typing code is different from prose. It's about <span className="text-white font-bold">bursts</span>. Focus on accuracy for syntax characters—one wrong bracket can break your flow.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-xs text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Use Warmup mode to loosen up.
                    </li>
                    <li className="flex items-center gap-3 text-xs text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Practice symbols specifically.
                    </li>
                    <li className="flex items-center gap-3 text-xs text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Try Hardcore mode for perfection.
                    </li>
                  </ul>
                </div>
              </div>

              <button 
                onClick={() => setShowTutorial(false)}
                className="w-full mt-12 py-5 bg-zinc-100 text-black font-bold rounded-2xl hover:bg-white transition-all"
              >
                Got it, let's code
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-zinc-900 border-l border-zinc-800 z-[70] p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold">Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white">
                  <ChevronDown className="w-6 h-6 rotate-[-90deg]" />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Sound Effects</label>
                  <button 
                    onClick={() => handleSoundChange(!settings.sound)}
                    className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50"
                  >
                    <span className="text-sm">Mechanical Clicks</span>
                    <div className={cn("w-10 h-5 rounded-full relative transition-colors", settings.sound ? "bg-emerald-500" : "bg-zinc-700")}>
                      <motion.div 
                        animate={{ x: settings.sound ? 20 : 4 }}
                        className="absolute top-1 w-3 h-3 bg-black rounded-full" 
                      />
                    </div>
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Difficulty</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleDifficultyChange('standard')}
                      className={cn("p-3 rounded-xl text-xs font-bold transition-all", settings.difficulty === 'standard' ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400")}
                    >
                      Standard
                    </button>
                    <button 
                      onClick={() => handleDifficultyChange('hardcore')}
                      className={cn("p-3 rounded-xl text-xs font-bold transition-all", settings.difficulty === 'hardcore' ? "bg-rose-500 text-black" : "bg-zinc-800 text-zinc-400")}
                    >
                      Hardcore
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2 italic">Hardcore: Reset snippet on any error.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Theme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['emerald', 'blue', 'rose', 'amber'] as Theme[]).map(t => (
                      <button
                        key={t}
                        onClick={() => handleThemeChange(t)}
                        className={cn(
                          "aspect-square rounded-lg border-2 transition-all",
                          t === 'emerald' ? "bg-emerald-500" : t === 'blue' ? "bg-blue-500" : t === 'rose' ? "bg-rose-500" : "bg-amber-500",
                          settings.theme === t ? "border-white scale-110" : "border-transparent"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8">
                <p className="text-[10px] text-zinc-600 font-mono text-center">
                  Designed for developers who want to type at the speed of thought.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
