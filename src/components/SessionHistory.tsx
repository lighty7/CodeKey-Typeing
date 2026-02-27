import { useState } from 'react';
import { Session } from '../lib/storage';
import { cn } from '../lib/utils';

type Theme = 'emerald' | 'blue' | 'rose' | 'amber';

interface SessionHistoryProps {
  sessions: Session[];
  theme: Theme;
}

type SortKey = 'date' | 'wpm' | 'accuracy' | 'language';
type SortOrder = 'asc' | 'desc';

const languageLabels: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  rust: 'Rust',
  go: 'Go',
  cpp: 'C++',
  c: 'C',
  warmup: 'Warmup',
  custom: 'Custom',
  random: 'Random',
};

const themeColors: Record<Theme, string> = {
  emerald: '#10b981',
  blue: '#3b82f6',
  rose: '#f43f5e',
  amber: '#f59e0b',
};

export default function SessionHistory({ sessions, theme }: SessionHistoryProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const perPage = 10;
  
  const sortedSessions = [...sessions].sort((a, b) => {
    let comparison = 0;
    switch (sortKey) {
      case 'date':
        comparison = a.date - b.date;
        break;
      case 'wpm':
        comparison = a.wpm - b.wpm;
        break;
      case 'accuracy':
        comparison = a.accuracy - b.accuracy;
        break;
      case 'language':
        comparison = a.language.localeCompare(b.language);
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  const totalPages = Math.ceil(sortedSessions.length / perPage);
  const paginatedSessions = sortedSessions.slice((page - 1) * perPage, page * perPage);
  
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p className="text-lg mb-2">No sessions yet</p>
        <p className="text-sm">Complete a typing session to see your history</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th 
                className="text-left py-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('date')}
              >
                <span className="flex items-center gap-1">
                  Date
                  {sortKey === 'date' && (
                    <span style={{ color: themeColors[theme] }}>
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </span>
              </th>
              <th 
                className="text-left py-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('language')}
              >
                <span className="flex items-center gap-1">
                  Language
                  {sortKey === 'language' && (
                    <span style={{ color: themeColors[theme] }}>
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </span>
              </th>
              <th 
                className="text-left py-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('wpm')}
              >
                <span className="flex items-center gap-1">
                  WPM
                  {sortKey === 'wpm' && (
                    <span style={{ color: themeColors[theme] }}>
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </span>
              </th>
              <th 
                className="text-left py-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('accuracy')}
              >
                <span className="flex items-center gap-1">
                  Accuracy
                  {sortKey === 'accuracy' && (
                    <span style={{ color: themeColors[theme] }}>
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </span>
              </th>
              <th className="text-left py-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="text-left py-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Errors
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedSessions.map((session) => (
              <tr 
                key={session.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-zinc-400">
                  {formatDate(session.date)}
                </td>
                <td className="py-3 px-4">
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    session.language === 'javascript' && "bg-yellow-500/20 text-yellow-400",
                    session.language === 'typescript' && "bg-blue-500/20 text-blue-400",
                    session.language === 'python' && "bg-green-500/20 text-green-400",
                    session.language === 'rust' && "bg-orange-500/20 text-orange-400",
                    session.language === 'go' && "bg-cyan-500/20 text-cyan-400",
                    session.language === 'cpp' && "bg-purple-500/20 text-purple-400",
                    session.language === 'c' && "bg-gray-500/20 text-gray-400",
                    session.language === 'warmup' && "bg-pink-500/20 text-pink-400",
                    session.language === 'custom' && "bg-zinc-500/20 text-zinc-400",
                    session.language === 'random' && "bg-amber-500/20 text-amber-400",
                  )}>
                    {languageLabels[session.language] || session.language}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-mono font-bold" style={{ color: themeColors[theme] }}>
                    {session.wpm}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{session.accuracy}%</span>
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${session.accuracy}%`,
                          backgroundColor: session.accuracy >= 95 ? '#10b981' : session.accuracy >= 85 ? '#f59e0b' : '#f43f5e'
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-zinc-400 font-mono">
                  {formatDuration(session.duration)}
                </td>
                <td className="py-3 px-4">
                  <span className={cn(
                    "text-sm font-mono",
                    session.errors === 0 ? "text-emerald-400" :
                    session.errors <= 3 ? "text-amber-400" : "text-rose-400"
                  )}>
                    {session.errors}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
