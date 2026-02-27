import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Target, Clock, Flame, TrendingUp, History, BarChart3, Download, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getSessions, getStats, clearHistory, exportData, Session } from '../lib/storage';
import { WpmProgressChart, AccuracyChart, SessionsPerDayChart } from '../components/ProgressChart';
import SessionHistory from '../components/SessionHistory';

type Theme = 'emerald' | 'blue' | 'rose' | 'amber';

interface ProgressPageProps {
  theme: Theme;
  onBack: () => void;
}

const themeColors: Record<Theme, { primary: string; secondary: string; bg: string }> = {
  emerald: { primary: 'text-emerald-400', secondary: 'bg-emerald-500', bg: 'bg-emerald-500/10' },
  blue: { primary: 'text-blue-400', secondary: 'bg-blue-500', bg: 'bg-blue-500/10' },
  rose: { primary: 'text-rose-400', secondary: 'bg-rose-500', bg: 'bg-rose-500/10' },
  amber: { primary: 'text-amber-400', secondary: 'bg-amber-500', bg: 'bg-amber-500/10' },
};

export default function ProgressPage({ theme, onBack }: ProgressPageProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    bestWpm: 0,
    averageWpm: 0,
    averageAccuracy: 0,
    totalTime: 0,
    currentStreak: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  const colors = themeColors[theme];
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessionsData, statsData] = await Promise.all([
        getSessions(100),
        getStats(),
      ]);
      setSessions(sessionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codekey-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      await clearHistory();
      loadData();
    }
  };
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-700 border-t-current rounded-full" style={{ color: colors.primary.replace('text-', '') }} />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Practice</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-rose-900/50 transition-colors text-sm text-rose-400"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold mb-8"
        >
          Your <span className={colors.primary}>Progress</span>
        </motion.h1>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colors.bg)}>
              <Trophy className={cn("w-5 h-5", colors.primary)} />
            </div>
            <p className="text-2xl font-bold font-mono">{stats.bestWpm}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Best WPM</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colors.bg)}>
              <TrendingUp className={cn("w-5 h-5", colors.primary)} />
            </div>
            <p className="text-2xl font-bold font-mono">{stats.averageWpm}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Avg WPM</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colors.bg)}>
              <Target className={cn("w-5 h-5", colors.primary)} />
            </div>
            <p className="text-2xl font-bold font-mono">{stats.averageAccuracy}%</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Avg Accuracy</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colors.bg)}>
              <BarChart3 className={cn("w-5 h-5", colors.primary)} />
            </div>
            <p className="text-2xl font-bold font-mono">{stats.totalSessions}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Sessions</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colors.bg)}>
              <Flame className={cn("w-5 h-5", colors.primary)} />
            </div>
            <p className="text-2xl font-bold font-mono">{stats.currentStreak}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Day Streak</p>
          </motion.div>
        </div>
        
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-6 py-3 rounded-xl font-medium transition-colors",
              activeTab === 'overview' 
                ? cn(colors.bg, colors.primary)
                : "text-zinc-400 hover:text-white"
            )}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-6 py-3 rounded-xl font-medium transition-colors",
              activeTab === 'history' 
                ? cn(colors.bg, colors.primary)
                : "text-zinc-400 hover:text-white"
            )}
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </span>
          </button>
        </div>
        
        {activeTab === 'overview' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">WPM Progress</h3>
              <WpmProgressChart sessions={sessions} theme={theme} />
            </div>
            
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Accuracy by Language</h3>
              <AccuracyChart sessions={sessions} theme={theme} />
            </div>
            
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-lg font-bold mb-4">Daily Activity</h3>
              <SessionsPerDayChart sessions={sessions} theme={theme} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold mb-4">Session History</h3>
            <SessionHistory sessions={sessions} theme={theme} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
