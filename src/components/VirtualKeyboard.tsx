import { useMemo, useState, useEffect } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

type Theme = 'emerald' | 'blue' | 'rose' | 'amber';

interface VirtualKeyboardProps {
  currentKey: string;
  nextKey?: string;
  theme: Theme;
  disabled?: boolean;
}

const themeColors: Record<Theme, { primary: string; secondary: string; glow: string; key: string }> = {
  emerald: {
    primary: '#10b981',
    secondary: '#065f46',
    glow: 'rgba(16, 185, 129, 0.6)',
    key: '#1a1a1a',
  },
  blue: {
    primary: '#3b82f6',
    secondary: '#1e40af',
    glow: 'rgba(59, 130, 246, 0.6)',
    key: '#1a1a1a',
  },
  rose: {
    primary: '#f43f5e',
    secondary: '#9f1239',
    glow: 'rgba(244, 63, 94, 0.6)',
    key: '#1a1a1a',
  },
  amber: {
    primary: '#f59e0b',
    secondary: '#b45309',
    glow: 'rgba(245, 158, 11, 0.6)',
    key: '#1a1a1a',
  },
};

const fingerZones: Record<string, { color: string; finger: string }> = {
  // Pinky fingers - red
  '`': { color: '#dc2626', finger: 'pinky' }, '~': { color: '#dc2626', finger: 'pinky' },
  '1': { color: '#dc2626', finger: 'pinky' }, '!': { color: '#dc2626', finger: 'pinky' },
  'q': { color: '#dc2626', finger: 'pinky' }, 'Q': { color: '#dc2626', finger: 'pinky' },
  'a': { color: '#dc2626', finger: 'pinky' }, 'A': { color: '#dc2626', finger: 'pinky' },
  'z': { color: '#dc2626', finger: 'pinky' }, 'Z': { color: '#dc2626', finger: 'pinky' },
  // Ring fingers - orange
  '2': { color: '#ea580c', finger: 'ring' }, '@': { color: '#ea580c', finger: 'ring' },
  'w': { color: '#ea580c', finger: 'ring' }, 'W': { color: '#ea580c', finger: 'ring' },
  's': { color: '#ea580c', finger: 'ring' }, 'S': { color: '#ea580c', finger: 'ring' },
  'x': { color: '#ea580c', finger: 'ring' }, 'X': { color: '#ea580c', finger: 'ring' },
  // Middle fingers - yellow
  '3': { color: '#ca8a04', finger: 'middle' }, '#': { color: '#ca8a04', finger: 'middle' },
  'e': { color: '#ca8a04', finger: 'middle' }, 'E': { color: '#ca8a04', finger: 'middle' },
  'd': { color: '#ca8a04', finger: 'middle' }, 'D': { color: '#ca8a04', finger: 'middle' },
  'c': { color: '#ca8a04', finger: 'middle' }, 'C': { color: '#ca8a04', finger: 'middle' },
  // Index fingers - green/cyan
  '4': { color: '#16a34a', finger: 'index' }, '$': { color: '#16a34a', finger: 'index' },
  '5': { color: '#16a34a', finger: 'index' }, '%': { color: '#16a34a', finger: 'index' },
  'r': { color: '#16a34a', finger: 'index' }, 'R': { color: '#16a34a', finger: 'index' },
  't': { color: '#16a34a', finger: 'index' }, 'T': { color: '#16a34a', finger: 'index' },
  'f': { color: '#16a34a', finger: 'index' }, 'F': { color: '#16a34a', finger: 'index' },
  'v': { color: '#16a34a', finger: 'index' }, 'V': { color: '#16a34a', finger: 'index' },
  'g': { color: '#16a34a', finger: 'index' }, 'G': { color: '#16a34a', finger: 'index' },
  'b': { color: '#16a34a', finger: 'index' }, 'B': { color: '#16a34a', finger: 'index' },
  // Right index - blue
  '6': { color: '#0891b2', finger: 'index' }, '^': { color: '#0891b2', finger: 'index' },
  'y': { color: '#0891b2', finger: 'index' }, 'Y': { color: '#0891b2', finger: 'index' },
  'u': { color: '#0891b2', finger: 'index' }, 'U': { color: '#0891b2', finger: 'index' },
  'h': { color: '#0891b2', finger: 'index' }, 'H': { color: '#0891b2', finger: 'index' },
  'j': { color: '#0891b2', finger: 'index' }, 'J': { color: '#0891b2', finger: 'index' },
  'n': { color: '#0891b2', finger: 'index' }, 'N': { color: '#0891b2', finger: 'index' },
  'm': { color: '#0891b2', finger: 'index' }, 'M': { color: '#0891b2', finger: 'index' },
  // Right ring - purple
  '7': { color: '#7c3aed', finger: 'ring' }, '&': { color: '#7c3aed', finger: 'ring' },
  '8': { color: '#7c3aed', finger: 'ring' }, '*': { color: '#7c3aed', finger: 'ring' },
  'i': { color: '#7c3aed', finger: 'ring' }, 'I': { color: '#7c3aed', finger: 'ring' },
  'o': { color: '#7c3aed', finger: 'ring' }, 'O': { color: '#7c3aed', finger: 'ring' },
  'k': { color: '#7c3aed', finger: 'ring' }, 'K': { color: '#7c3aed', finger: 'ring' },
  ',': { color: '#7c3aed', finger: 'ring' }, '<': { color: '#7c3aed', finger: 'ring' },
  // Right pinky - pink
  '9': { color: '#db2777', finger: 'pinky' }, '(': { color: '#db2777', finger: 'pinky' },
  '0': { color: '#db2777', finger: 'pinky' }, ')': { color: '#db2777', finger: 'pinky' },
  'p': { color: '#db2777', finger: 'pinky' }, 'P': { color: '#db2777', finger: 'pinky' },
  '[': { color: '#db2777', finger: 'pinky' }, '{': { color: '#db2777', finger: 'pinky' },
  ']': { color: '#db2777', finger: 'pinky' }, '}': { color: '#db2777', finger: 'pinky' },
  ';': { color: '#db2777', finger: 'pinky' }, ':': { color: '#db2777', finger: 'pinky' },
  "'": { color: '#db2777', finger: 'pinky' }, '"': { color: '#db2777', finger: 'pinky' },
  '\\': { color: '#db2777', finger: 'pinky' }, '|': { color: '#db2777', finger: 'pinky' },
  '/': { color: '#db2777', finger: 'pinky' }, '?': { color: '#db2777', finger: 'pinky' },
  '.': { color: '#db2777', finger: 'pinky' }, '>': { color: '#db2777', finger: 'pinky' },
  '-': { color: '#db2777', finger: 'pinky' }, '_': { color: '#db2777', finger: 'pinky' },
  '=': { color: '#db2777', finger: 'pinky' }, '+': { color: '#db2777', finger: 'pinky' },
};

const homeRowKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];

export default function VirtualKeyboard({ currentKey, nextKey, theme, disabled }: VirtualKeyboardProps) {
  const [layout, setLayout] = useState<'default' | 'shift'>('default');
  const colors = themeColors[theme];
  
  const layoutOptions = useMemo(() => ({
    default: [
      '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
      'tab q w e r t y u i o p [ ] \\',
      'caps a s d f g h j k l ; \' {enter}',
      'shift z x c v b n m , . / shift',
      'ctrl alt space alt ctrl',
    ],
    shift: [
      '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
      'tab Q W E R T Y U I O P { } |',
      'caps A S D F G H J K L : " {enter}',
      'shift Z X C V B N M < > ? shift',
      'ctrl alt space alt ctrl',
    ],
  }), []);
  
  useEffect(() => {
    const key = currentKey.toLowerCase();
    const needsShift = /[A-Z~!@#$%^&*()_+{}|:"<>?]/.test(currentKey);
    if (needsShift && layout === 'default') {
      setLayout('shift');
    }
  }, [currentKey, layout]);

  const getKeyStyle = (button: string): React.CSSProperties => {
    const normalizedKey = button.toLowerCase().replace(/{|}/g, '');
    const isCurrentKey = normalizedKey === currentKey.toLowerCase();
    const isNextKey = nextKey && normalizedKey === nextKey.toLowerCase();
    const isHomeRow = homeRowKeys.includes(normalizedKey);
    const fingerZone = fingerZones[button] || fingerZones[normalizedKey];
    
    const baseStyle: React.CSSProperties = {
      background: `linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)`,
      borderRadius: '6px',
      boxShadow: '0 4px 0 #0a0a0a, 0 4px 8px rgba(0,0,0,0.3)',
      border: '1px solid #3a3a3a',
      transition: 'all 0.1s ease',
    };
    
    if (isCurrentKey) {
      return {
        ...baseStyle,
        background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        boxShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}, 0 4px 0 ${colors.secondary}`,
        transform: 'translateY(2px)',
        borderColor: colors.primary,
      };
    }
    
    if (isNextKey) {
      return {
        ...baseStyle,
        background: `linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)`,
        boxShadow: `0 0 10px ${colors.glow}, 0 4px 0 #0a0a0a`,
        borderColor: colors.primary,
        opacity: 0.9,
      };
    }
    
    if (fingerZone) {
      return {
        ...baseStyle,
        boxShadow: `0 4px 0 #0a0a0a, 0 0 8px ${fingerZone.color}40, inset 0 1px 0 ${fingerZone.color}20`,
        borderColor: `${fingerZone.color}40`,
      };
    }
    
    if (isHomeRow) {
      return {
        ...baseStyle,
        boxShadow: '0 4px 0 #0a0a0a, 0 0 15px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)',
        borderColor: '#4a4a4a',
      };
    }
    
    return baseStyle;
  };
  
  const customCSS = `
    :root {
      --hg-theme-primary: ${colors.primary};
    }
    
    .hg-button {
      height: 52px !important;
      min-width: 44px !important;
      border-radius: 8px !important;
      margin: 3px 2px !important;
      font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
      font-weight: 500 !important;
      font-size: 13px !important;
      text-transform: uppercase !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: relative !important;
      overflow: hidden !important;
    }
    
    .hg-button::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: 50% !important;
      background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%) !important;
      border-radius: 6px 6px 0 0 !important;
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
      width: 100px !important;
    }
    
    .hg-button-shift {
      width: 105px !important;
    }
    
    .hg-button-space {
      width: 240px !important;
    }
    
    .hg-button-ctrl, .hg-button-alt {
      width: 55px !important;
    }
    
    .hg-keyboard {
      background: linear-gradient(180deg, #1f1f1f 0%, #141414 100%) !important;
      border-radius: 16px !important;
      padding: 16px !important;
      box-shadow: 
        0 20px 60px rgba(0,0,0,0.5),
        0 0 0 1px rgba(255,255,255,0.05),
        inset 0 1px 0 rgba(255,255,255,0.05) !important;
    }
    
    .hg-rows {
      gap: 4px !important;
    }
    
    .hg-row {
      justify-content: center !important;
    }
    
    /* Special key styling */
    .hg-button-tab, .hg-button-caps, .hg-button-shift, .hg-button-bksp, .hg-button-enter {
      font-size: 10px !important;
      background: linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%) !important;
    }
    
    .hg-button-space {
      font-size: 11px !important;
      letter-spacing: 2px !important;
    }
    
    /* Disabled state */
    .hg-keyboard-disabled {
      opacity: 0.5 !important;
      pointer-events: none !important;
    }
  `;

  return (
    <div className="w-full max-w-5xl mx-auto mt-6">
      <style>{customCSS}</style>
      
      <Keyboard
        layoutName={layout}
        layout={layoutOptions}
        disableButtonHold
        theme="hg-theme-custom"
        baseClass={disabled ? 'hg-keyboard-disabled' : ''}
        renderButton={(buttonProps) => {
          const style = getKeyStyle(buttonProps.buttonElement?.textContent || buttonProps.buttonBase?.children?.[0]?.textContent || '');
          return {
            ...buttonProps,
            customClass: 'hg-button-custom',
            customStyle: style,
          };
        }}
      />
      
      <div className="flex justify-center items-center gap-8 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: colors.primary, boxShadow: `0 0 8px ${colors.glow}` }} />
          <span className="text-zinc-400">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: colors.primary, opacity: 0.5 }} />
          <span className="text-zinc-400">Next</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-zinc-400">Index</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-zinc-400">Middle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-zinc-400">Ring</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-zinc-400">Pinky</span>
        </div>
      </div>
    </div>
  );
}
