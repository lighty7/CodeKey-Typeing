import { useState, useEffect } from 'react';

type Theme = 'emerald' | 'blue' | 'rose' | 'amber';

interface VirtualKeyboardProps {
  currentKey: string;
  nextKey?: string;
  theme: Theme;
  disabled?: boolean;
}

const themeColors: Record<Theme, { primary: string; secondary: string; glow: string }> = {
  emerald: { primary: '#10b981', secondary: '#065f46', glow: 'rgba(16, 185, 129, 0.5)' },
  blue: { primary: '#3b82f6', secondary: '#1e40af', glow: 'rgba(59, 130, 246, 0.5)' },
  rose: { primary: '#f43f5e', secondary: '#9f1239', glow: 'rgba(244, 63, 94, 0.5)' },
  amber: { primary: '#f59e0b', secondary: '#b45309', glow: 'rgba(245, 158, 11, 0.5)' },
};

const fingerColors: Record<string, string> = {
  a: '#ef4444', s: '#f97316', d: '#eab308', f: '#22c55e', g: '#14b8a6',
  h: '#06b6d4', j: '#3b82f6', k: '#8b5cf6', l: '#a855f7',
  q: '#ef4444', w: '#f97316', e: '#eab308', r: '#22c55e', t: '#14b8a6',
  y: '#06b6d4', u: '#3b82f6', i: '#8b5cf6', o: '#a855f7', p: '#ec4899',
  z: '#ef4444', x: '#f97316', c: '#eab308', v: '#22c55e', b: '#14b8a6',
  n: '#06b6d4', m: '#3b82f6',
};

interface KeyProps {
  label: string;
  width?: number;
  isCurrent: boolean;
  isNext: boolean;
  fingerColor?: string;
  isHomeRow: boolean;
  colors: { primary: string; secondary: string; glow: string };
}

function Key({ label, width = 44, isCurrent, isNext, fingerColor, isHomeRow, colors }: KeyProps) {
  const baseStyle: React.CSSProperties = {
    width: `${width}px`,
    height: '48px',
    background: 'linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%)',
    borderRadius: '6px',
    boxShadow: '0 4px 0 #0a0a0a, 0 5px 10px rgba(0,0,0,0.3)',
    border: '1px solid #4a4a4a',
    color: '#e5e5e5',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    transition: 'all 0.08s ease',
    position: 'relative',
    flexShrink: 0,
  };

  let style = { ...baseStyle };

  if (isCurrent) {
    style = {
      ...style,
      background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      boxShadow: `0 0 25px ${colors.glow}, 0 0 50px ${colors.glow}, 0 4px 0 ${colors.secondary}`,
      transform: 'translateY(2px)',
      borderColor: colors.primary,
      color: '#fff',
      fontWeight: 700,
      zIndex: 10,
    };
  } else if (isNext) {
    style = {
      ...style,
      background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)',
      boxShadow: `0 0 15px ${colors.glow}, 0 4px 0 #0a0a0a`,
      borderColor: colors.primary,
    };
  } else if (fingerColor) {
    style = {
      ...style,
      boxShadow: `0 4px 0 #0a0a0a, 0 0 8px ${fingerColor}30, inset 0 1px 0 ${fingerColor}20`,
      borderColor: `${fingerColor}50`,
    };
  } else if (isHomeRow) {
    style = {
      ...style,
      boxShadow: '0 4px 0 #0a0a0a, 0 0 12px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)',
    };
  }

  return (
    <div style={style}>
      <div style={{
        position: 'absolute',
        top: '2px',
        left: '4px',
        right: '4px',
        height: '16px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
        borderRadius: '4px 4px 8px 8px',
        pointerEvents: 'none',
      }} />
      {label}
    </div>
  );
}

function KeyRow({ keys, offset = 0, currentKey, nextKey, colors }: {
  keys: { label: string; width?: number; code?: string }[];
  offset?: number;
  currentKey: string;
  nextKey?: string;
  colors: { primary: string; secondary: string; glow: string };
}) {
  const homeRowKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];

  return (
    <div
      className="flex gap-1.5"
      style={{
        marginLeft: `${offset}px`,
        marginBottom: '6px',
      }}
    >
      {keys.map((key, idx) => {
        const keyLabel = key.code || key.label.toLowerCase();
        const isCurrent = keyLabel === currentKey.toLowerCase() || key.label === currentKey;
        const isNext = nextKey && (keyLabel === nextKey.toLowerCase() || key.label === nextKey);
        const fingerColor = fingerColors[keyLabel] || fingerColors[key.label.toLowerCase()];
        const isHomeRow = homeRowKeys.includes(keyLabel) || homeRowKeys.includes(key.label.toLowerCase());

        return (
          <Key
            key={`${key.label}-${idx}`}
            label={key.label}
            width={key.width}
            isCurrent={isCurrent}
            isNext={isNext || false}
            fingerColor={fingerColor}
            isHomeRow={isHomeRow}
            colors={colors}
          />
        );
      })}
    </div>
  );
}

export default function VirtualKeyboard({ currentKey, nextKey, theme, disabled }: VirtualKeyboardProps) {
  const [isShift, setIsShift] = useState(false);
  const colors = themeColors[theme];

  useEffect(() => {
    const key = currentKey;
    const needsShift = /[A-Z~!@#$%^&*()_+{}|:"<>?]/.test(key);
    if (needsShift && !isShift) {
      setIsShift(true);
    } else if (!needsShift && isShift) {
      setIsShift(false);
    }
  }, [currentKey, isShift]);

  const row1 = isShift
    ? ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'].map(l => ({ label: l, width: 44 }))
    : ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].map(l => ({ label: l, width: 44 }));

  const row1Bksp = { label: '←', width: 90, code: '{bksp}' };

  const row2Keys = isShift
    ? ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|'].map(l => ({ label: l, width: 44 }))
    : ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'].map(l => ({ label: l, width: 44 }));

  const row3Keys = isShift
    ? ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"'].map(l => ({ label: l, width: 44 }))
    : ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"].map(l => ({ label: l, width: 44 }));

  const row3Enter = { label: 'Enter', width: 90, code: '{enter}' };

  const row4Keys = isShift
    ? ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?'].map(l => ({ label: l, width: 44 }))
    : ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'].map(l => ({ label: l, width: 44 }));

  const row4Shift = { label: 'Shift', width: 110, code: 'shift' };

  const row5Ctrl = { label: 'Ctrl', width: 60, code: 'ctrl' };
  const row5Alt = { label: 'Alt', width: 60, code: 'alt' };
  const row5Space = { label: '', width: 280, code: ' ' };
  const row5Win = { label: 'Win', width: 50, code: 'win' };

  return (
    <div className="w-full max-w-5xl mx-auto mt-6">
      <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-700">
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/40 to-transparent rounded-b-2xl" />
        
        <div className="flex flex-col items-center">
          <KeyRow
            keys={[...row1, row1Bksp]}
            offset={0}
            currentKey={currentKey}
            nextKey={nextKey}
            colors={colors}
          />
          
          <KeyRow
            keys={row2Keys}
            offset={20}
            currentKey={currentKey}
            nextKey={nextKey}
            colors={colors}
          />
          
          <KeyRow
            keys={[...row3Keys, row3Enter]}
            offset={35}
            currentKey={currentKey}
            nextKey={nextKey}
            colors={colors}
          />
          
          <KeyRow
            keys={[row4Shift, ...row4Keys, row4Shift]}
            offset={15}
            currentKey={currentKey}
            nextKey={nextKey}
            colors={colors}
          />
          
          <KeyRow
            keys={[row5Ctrl, row5Alt, row5Win, row5Space, row5Win, row5Alt, row5Ctrl]}
            offset={60}
            currentKey={currentKey}
            nextKey={nextKey}
            colors={colors}
          />
        </div>
      </div>
      
      <div className="flex justify-center items-center gap-6 mt-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: colors.primary, boxShadow: `0 0 8px ${colors.glow}` }} />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-500" />
          <span>Next</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-red-500" />
          <span>Pinky</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-orange-500" />
          <span>Ring</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-yellow-500" />
          <span>Middle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-green-500" />
          <span>Index</span>
        </div>
      </div>
    </div>
  );
}
