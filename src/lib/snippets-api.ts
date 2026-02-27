import { LEVELED_SNIPPETS } from '../constants';

export type Language = 'javascript' | 'python' | 'cpp' | 'c' | 'typescript' | 'rust' | 'go' | 'warmup' | 'custom' | 'random';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface SnippetResult {
  code: string;
  source: 'local' | 'github' | 'generated';
  language: string;
}

const GITHUB_API_DELAY = 2000;
let lastApiCall = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  if (timeSinceLastCall < GITHUB_API_DELAY) {
    await new Promise(resolve => setTimeout(resolve, GITHUB_API_DELAY - timeSinceLastCall));
  }
  lastApiCall = Date.now();
}

function cleanCodeSnippet(code: string): string {
  let cleaned = code
    .replace(/^\s*import\s+.*$/gm, '')
    .replace(/^\s*export\s+/gm, '')
    .replace(/^\s*require\s*\([^)]+\)\s*;?\s*$/gm, '')
    .replace(/^\s*#include\s*<[^>]+>\s*$/gm, '')
    .replace(/^\s*using\s+namespace\s+std\s*;?\s*$/gm, '')
    .trim();
  
  const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length > 10) {
    cleaned = lines.slice(0, 10).join('\n');
  }
  
  return cleaned.length > 200 ? cleaned.slice(0, 200) : cleaned;
}

async function fetchFromGitHub(language: string): Promise<string | null> {
  try {
    await rateLimit();
    
    const langMap: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      rust: 'rust',
      go: 'go',
      c: 'c',
      cpp: 'c++',
    };
    
    const queryLang = langMap[language] || 'javascript';
    const query = `language:${queryLang}+extension:${language === 'cpp' ? 'cpp' : language}`;
    
    const response = await fetch(
      `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=30&sort=indexed`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!response.ok) {
      console.warn('GitHub API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }
    
    const randomItem = data.items[Math.floor(Math.random() * Math.min(10, data.items.length))];
    
    const fileResponse = await fetch(randomItem.url, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
      },
    });
    
    if (!fileResponse.ok) {
      return null;
    }
    
    const content = await fileResponse.text();
    return cleanCodeSnippet(content);
  } catch (error) {
    console.warn('GitHub fetch error:', error);
    return null;
  }
}

function getRandomCharSet(difficulty: DifficultyLevel): string {
  const chars: Record<DifficultyLevel, string[]> = {
    easy: ['asdf jkl;', 'qwer tyui', 'zxcv bnm', '1234 5678', 'asdfjkl; qweruiop'],
    medium: ['asdf jkl; qwert yuiop', '1234567890-=', 'zxcvbnm,./', '(){}[]<>', '!@#$%^&*'],
    hard: ['asdf jkl; qwerty uiop zxcvbn m,./', '1234567890-=`[]\\;\',./', '!@#$%^&*()_+{}|:"<>?'],
  };
  
  const charSet = chars[difficulty];
  return charSet[Math.floor(Math.random() * charSet.length)];
}

function generatePseudoWord(length: number): string {
  const vowels = 'aeiou';
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    if (i % 2 === 0) {
      result += consonants[Math.floor(Math.random() * consonants.length)];
    } else {
      result += vowels[Math.floor(Math.random() * vowels.length)];
    }
  }
  
  return result;
}

export async function getSnippet(
  language: Language,
  difficulty: DifficultyLevel = 'easy',
  useApi: boolean = true
): Promise<SnippetResult> {
  if (language === 'random') {
    const languages: Language[] = ['javascript', 'typescript', 'python', 'rust', 'go', 'cpp'];
    const randomLang = languages[Math.floor(Math.random() * languages.length)];
    return getSnippet(randomLang, difficulty, useApi);
  }
  
  if (language === 'warmup') {
    const snippet = getRandomCharSet(difficulty);
    return { code: snippet, source: 'generated', language: 'warmup' };
  }
  
  if (language === 'custom') {
    return { code: '', source: 'local', language: 'custom' };
  }
  
  const snippets = LEVELED_SNIPPETS[language];
  
  if (!snippets || snippets[difficulty].length === 0) {
    const fallback = LEVELED_SNIPPETS.javascript?.[difficulty]?.[0] || 'console.log("Hello");';
    return { code: fallback, source: 'local', language: 'javascript' };
  }
  
  const localSnippet = snippets[difficulty][Math.floor(Math.random() * snippets[difficulty].length)];
  
  if (!useApi) {
    return { code: localSnippet, source: 'local', language };
  }
  
  try {
    const githubSnippet = await fetchFromGitHub(language);
    
    if (githubSnippet && githubSnippet.length > 10) {
      return { code: githubSnippet, source: 'github', language };
    }
  } catch (error) {
    console.warn('API fetch failed, using local:', error);
  }
  
  return { code: localSnippet, source: 'local', language };
}

export function getAvailableLanguages(): { id: Language; name: string }[] {
  return [
    { id: 'warmup', name: 'Warmup' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'python', name: 'Python' },
    { id: 'rust', name: 'Rust' },
    { id: 'go', name: 'Go' },
    { id: 'cpp', name: 'C++' },
    { id: 'c', name: 'C' },
    { id: 'random', name: 'Random' },
  ];
}

export function getLanguageFromSnippet(snippet: string): string {
  if (snippet.includes('def ') && snippet.includes(':')) return 'python';
  if (snippet.includes('fn ') && snippet.includes('->')) return 'rust';
  if (snippet.includes('func ') && snippet.includes('fmt')) return 'go';
  if (snippet.includes('#include') || snippet.includes('std::')) return 'cpp';
  if (snippet.includes('interface ') && snippet.includes(':')) return 'typescript';
  if (snippet.includes('const ') || snippet.includes('let ') || snippet.includes('=>')) return 'javascript';
  return 'unknown';
}
