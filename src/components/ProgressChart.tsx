import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Session } from '../lib/storage';

type Theme = 'emerald' | 'blue' | 'rose' | 'amber';

interface ProgressChartProps {
  sessions: Session[];
  theme: Theme;
}

const themeColors: Record<Theme, { primary: string; secondary: string; accent: string }> = {
  emerald: { primary: '#10b981', secondary: '#34d399', accent: '#065f46' },
  blue: { primary: '#3b82f6', secondary: '#60a5fa', accent: '#1e3a8a' },
  rose: { primary: '#f43f5e', secondary: '#fb7185', accent: '#9f1239' },
  amber: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#b45309' },
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export function WpmProgressChart({ sessions, theme }: ProgressChartProps) {
  const colors = themeColors[theme];
  
  const data = sessions.slice(0, 30).reverse().map((session, index) => ({
    session: `#${index + 1}`,
    wpm: session.wpm,
    accuracy: session.accuracy,
    date: formatDate(session.date),
  }));
  
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500">
        No data yet. Start typing to see your progress!
      </div>
    );
  }
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis 
            dataKey="session" 
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#a1a1aa' }}
          />
          <Area
            type="monotone"
            dataKey="wpm"
            stroke={colors.primary}
            strokeWidth={2}
            fill="url(#wpmGradient)"
            dot={{ fill: colors.primary, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 6, fill: colors.primary }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AccuracyChart({ sessions, theme }: ProgressChartProps) {
  const colors = themeColors[theme];
  
  const languageData = sessions.reduce((acc, session) => {
    const existing = acc.find(d => d.language === session.language);
    if (existing) {
      existing.accuracy = Math.round((existing.accuracy + session.accuracy) / 2);
      existing.count += 1;
    } else {
      acc.push({
        language: session.language,
        accuracy: session.accuracy,
        count: 1,
      });
    }
    return acc;
  }, [] as { language: string; accuracy: number; count: number }[]);
  
  if (languageData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500">
        No data yet. Start typing to see your accuracy by language!
      </div>
    );
  }
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={languageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis 
            dataKey="language" 
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#a1a1aa' }}
          />
          <Bar 
            dataKey="accuracy" 
            fill={colors.primary}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CombinedProgressChart({ sessions, theme }: ProgressChartProps) {
  const colors = themeColors[theme];
  
  const data = sessions.slice(0, 20).reverse().map((session, index) => ({
    session: `#${index + 1}`,
    wpm: session.wpm,
    accuracy: session.accuracy,
    errors: session.errors,
    date: formatDate(session.date),
    time: formatTime(session.date),
  }));
  
  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-zinc-500">
        Complete some typing sessions to see your progress!
      </div>
    );
  }
  
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis 
            dataKey="session" 
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            yAxisId="left"
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#a1a1aa' }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="wpm"
            stroke={colors.primary}
            strokeWidth={2}
            dot={{ fill: colors.primary, strokeWidth: 0, r: 3 }}
            name="WPM"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="accuracy"
            stroke={colors.secondary}
            strokeWidth={2}
            dot={{ fill: colors.secondary, strokeWidth: 0, r: 3 }}
            name="Accuracy %"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SessionsPerDayChart({ sessions, theme }: ProgressChartProps) {
  const colors = themeColors[theme];
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  });
  
  const dayData = last7Days.map(dayStart => {
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const daySessions = sessions.filter(s => s.date >= dayStart && s.date < dayEnd);
    
    return {
      day: new Date(dayStart).toLocaleDateString('en-US', { weekday: 'short' }),
      sessions: daySessions.length,
      avgWpm: daySessions.length > 0 
        ? Math.round(daySessions.reduce((sum, s) => sum + s.wpm, 0) / daySessions.length)
        : 0,
    };
  });
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis 
            dataKey="day" 
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#a1a1aa' }}
          />
          <Bar 
            dataKey="sessions" 
            fill={colors.primary}
            radius={[4, 4, 0, 0]}
            name="Sessions"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
