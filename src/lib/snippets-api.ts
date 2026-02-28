import { LEVELED_SNIPPETS } from '../constants';

export type Language = 'javascript' | 'python' | 'cpp' | 'c' | 'typescript' | 'rust' | 'go' | 'warmup' | 'custom' | 'random' | 'java' | 'csharp' | 'ruby' | 'sql' | 'html' | 'css';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface SnippetResult {
  code: string;
  source: 'local' | 'gists';
  language: string;
}

const CODE_EXTENSIONS: Record<string, string[]> = {
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  typescript: ['.ts', '.tsx', '.mts', '.cts'],
  python: ['.py', '.pyw', '.pyx'],
  rust: ['.rs'],
  go: ['.go'],
  cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
  c: ['.c', '.h'],
  java: ['.java'],
  csharp: ['.cs'],
  ruby: ['.rb', '.erb'],
  sql: ['.sql'],
  html: ['.html', '.htm'],
  css: ['.css', '.scss', '.sass', '.less'],
};

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  js: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python',
  rs: 'rust',
  go: 'go',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', h: 'c',
  c: 'c',
};

const GITHUB_GISTS_DELAY = 1000;
let lastGistsCall = 0;

async function rateLimitGists(): Promise<void> {
  const now = Date.now();
  const timeSinceLastCall = now - lastGistsCall;
  if (timeSinceLastCall < GITHUB_GISTS_DELAY) {
    await new Promise(resolve => setTimeout(resolve, GITHUB_GISTS_DELAY - timeSinceLastCall));
  }
  lastGistsCall = Date.now();
}

function getCodeFiles(files: Record<string, any>): { filename: string; content: string; language: string } | null {
  const codeFiles: { filename: string; content: string; language: string }[] = [];
  
  for (const [filename, fileData] of Object.entries(files)) {
    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    const lang = LANGUAGE_EXTENSIONS[ext] || LANGUAGE_EXTENSIONS[filename.split('.').pop() || ''];
    
    if (lang && fileData?.content && fileData.content.length > 20 && fileData.content.length < 5000) {
      const lines = fileData.content.split('\n').filter((l: string) => l.trim().length > 0);
      if (lines.length >= 3) {
        codeFiles.push({
          filename,
          content: fileData.content,
          language: lang,
        });
      }
    }
  }
  
  if (codeFiles.length === 0) return null;
  
  return codeFiles[Math.floor(Math.random() * codeFiles.length)];
}

async function fetchFromGists(targetLanguage: string): Promise<{ code: string; language: string } | null> {
  try {
    await rateLimitGists();
    
    const response = await fetch(
      `https://api.github.com/gists/public?per_page=30`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const gists = await response.json();
    
    if (!Array.isArray(gists) || gists.length === 0) {
      return null;
    }
    
    const filteredGists = gists.filter((gist: any) => {
      const files = gist.files || {};
      return Object.keys(files).some(filename => {
        const ext = '.' + filename.split('.').pop()?.toLowerCase();
        const lang = LANGUAGE_EXTENSIONS[ext];
        if (targetLanguage === 'javascript' || targetLanguage === 'typescript') {
          return ['javascript', 'typescript'].includes(lang);
        }
        return lang === targetLanguage;
      });
    });
    
    if (filteredGists.length === 0) {
      const anyCodeGists = gists.filter((gist: any) => {
        const files = gist.files || {};
        return Object.keys(files).some(filename => {
          const ext = '.' + filename.split('.').pop()?.toLowerCase();
          return LANGUAGE_EXTENSIONS[ext];
        });
      });
      
      if (anyCodeGists.length === 0) return null;
      
      const randomGist = anyCodeGists[Math.floor(Math.random() * anyCodeGists.length)];
      const codeFile = getCodeFiles(randomGist.files);
      if (codeFile) {
        return { code: codeFile.content.slice(0, 500), language: codeFile.language };
      }
      return null;
    }
    
    const randomGist = filteredGists[Math.floor(Math.random() * filteredGists.length)];
    const codeFile = getCodeFiles(randomGist.files);
    
    if (codeFile) {
      return { code: codeFile.content.slice(0, 500), language: codeFile.language };
    }
    
    return null;
  } catch (error) {
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
    const languages: Language[] = ['javascript', 'typescript', 'python', 'rust', 'go', 'cpp', 'java', 'csharp', 'ruby', 'sql', 'html', 'css'];
    const randomLang = languages[Math.floor(Math.random() * languages.length)];
    return getSnippet(randomLang, difficulty, useApi);
  }
  
  if (language === 'warmup') {
    const warmupTypes = ['chars', 'pseudo'];
    const type = warmupTypes[Math.floor(Math.random() * warmupTypes.length)];
    
    if (type === 'pseudo') {
      return { code: generatePseudoWord(20), source: 'gists', language: 'warmup' };
    }
    const snippet = getRandomCharSet(difficulty);
    return { code: snippet, source: 'gists', language: 'warmup' };
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
  
  if (useApi) {
    try {
      const gistResult = await fetchFromGists(language);
      if (gistResult && gistResult.code.length > 20) {
        return { code: gistResult.code, source: 'gists', language: gistResult.language };
      }
    } catch (error) {
      console.warn('Gists fetch failed, using local:', error);
    }
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
    { id: 'java', name: 'Java' },
    { id: 'csharp', name: 'C#' },
    { id: 'ruby', name: 'Ruby' },
    { id: 'sql', name: 'SQL' },
    { id: 'html', name: 'HTML' },
    { id: 'css', name: 'CSS' },
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
