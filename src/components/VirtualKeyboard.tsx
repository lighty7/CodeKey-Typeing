import { useState, useEffect } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

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

export default function VirtualKeyboard({ currentKey, nextKey, theme, disabled }: VirtualKeyboardProps) {
  const [layout, setLayout] = useState<'default' | 'shift'>('default');
  const colors = themeColors[theme];

  useEffect(() => {
    const key = currentKey.toLowerCase();
    const needsShift = /[A-Z~!@#$%^&*()_+{}|:"<>?]/.test(currentKey);
    if (needsShift && layout === 'default') {
      setLayout('shift');
    }
  }, [currentKey, layout]);

  const getKeyStyle = (button: string): React.CSSProperties => {
    const normalizedKey = button.toLowerCase().replace(/{|}/g, '');
    const isCurrentKey = normalizedKey === currentKey.toLowerCase() || button === currentKey;
    const isNextKey = nextKey && (normalizedKey === nextKey.toLowerCase() || button === nextKey);
    const isHomeRow = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].includes(normalizedKey);
    const fingerColor = fingerColors[normalizedKey];
    
    const baseStyle: React.CSSProperties = {
      background: 'linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%)',
      borderRadius: '6px',
      boxShadow: '0 4px 0 #0a0a0a, 0 5px 10px rgba(0,0,0,0.3)',
      border: '1px solid #4a4a4a',
      color: '#e5e5e5',
      fontWeight: 500,
    };
    
    if (isCurrentKey) {
      return {
        ...baseStyle,
        background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        boxShadow: `0 0 25px ${colors.glow}, 0 0 50px ${colors.glow}, 0 4px 0 ${colors.secondary}`,
        transform: 'translateY(2px)',
        borderColor: colors.primary,
        color: '#fff',
        fontWeight: 700,
      };
    }
    
    if (isNextKey) {
      return {
        ...baseStyle,
        background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)',
        boxShadow: `0 0 15px ${colors.glow}, 0 4px 0 #0a0a0a`,
        borderColor: colors.primary,
      };
    }
    
    if (fingerColor) {
      return {
        ...baseStyle,
        boxShadow: `0 4px 0 #0a0a0a, 0 0 8px ${fingerColor}30, inset 0 1px 0 ${fingerColor}20`,
        borderColor: `${fingerColor}50`,
      };
    }
    
    if (isHomeRow) {
      return {
        ...baseStyle,
        boxShadow: '0 4px 0 #0a0a0a, 0 0 12px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)',
      };
    }
    
    return baseStyle;
  };

  const keyboardLayout = {
    default: [
      '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
      'q w e r t y u i o p [ ] \\',
      'a s d f g h j k l ; \' {enter}',
      'shift z x c v b n m , . / shift',
      'ctrl alt space alt ctrl'
    ],
    shift: [
      '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
      'Q W E R T Y U I O P { } |',
      'A S D F G H J K L : " {enter}',
      'shift Z X C V B N M < > ? shift',
      'ctrl alt space alt ctrl'
    ]
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-6">
      <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-700">
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/40 to-transparent rounded-b-2xl" />
        
        <Keyboard
          layoutName={layout}
          layout={keyboardLayout}
          disableButtonHold
          baseClass="simple-keyboard"
          renderButton={(props: any) => ({
            ...props,
            customClass: `hg-button ${props.buttonElement?.className || ''}`,
            customStyle: getKeyStyle(props.buttonElement?.textContent || props.buttonBase?.children?.[0]?.textContent || ''),
          })}
        />
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

      <style>{`
        .simple-keyboard {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        
        .hg-rows {
          display: flex !important;
          justify-content: center !important;
          gap: 6px !important;
          margin-bottom: 6px !important;
        }
        
        .hg-row {
          display: flex !important;
          gap: 6px !important;
          justify-content: center !important;
        }
        
        .hg-button {
          height: 48px !important;
          min-width: 44px !important;
          border-radius: 8px !important;
          margin: 0 !important;
          font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
          font-size: 13px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.08s ease !important;
          position: relative !important;
        }
        
        .hg-button::before {
          content: '' !important;
          position: absolute !important;
          top: 2px !important;
          left: 4px !important;
          right: 4px !important;
          height: 16px !important;
          background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%) !important;
          border-radius: 4px 4px 8px 8px !important;
          pointer-events: none !important;
        }
        
        .hg-button:active, .hg-button-active {
          transform: translateY(3px) !important;
          box-shadow: 0 1px 0 #0a0a0a !important;
        }
        
        .hg-button-bksp {
          width: 90px !important;
        }
        
        .hg-button-tab {
          width: 75px !important;
        }
        
        .hg-button-caps {
          width: 85px !important;
        }
        
        .hg-button-enter {
          width: 95px !important;
        }
        
        .hg-button-shift {
          width: 110px !important;
          font-size: 11px !important;
        }
        
        .hg-button-space {
          width: 280px !important;
        }
        
        .hg-button-ctrl, .hg-button-alt {
          width: 60px !important;
          font-size: 11px !important;
        }
      `}</style>
    </div>
  );
}
