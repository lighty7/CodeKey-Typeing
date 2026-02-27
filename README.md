<div align="center">
  <img width="1200" height="475" alt="CodeKey - Developer Typing Tutor" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CodeKey - Developer Typing Tutor

A modern, developer-focused typing practice application built with React, TypeScript, and Tailwind CSS. Practice typing real code snippets with real-time feedback, progress tracking, and a virtual keyboard visualization.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Code Snippets Practice** - Type real code in multiple programming languages (JavaScript, TypeScript, Python, Rust, Go, and more)
- **Virtual Keyboard** - Visual keyboard with staggered QWERTY layout showing finger positioning
- **Real-time Stats** - Live WPM (Words Per Minute) and accuracy tracking
- **Progress Dashboard** - Charts showing your improvement over time
- **Session History** - Track and review past typing sessions
- **Customizable Themes** - Choose from multiple color themes (Emerald, Blue, Rose, Amber)
- **Local Storage** - All progress stored locally in IndexedDB

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/codekey.git
cd codekey

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Charts**: Recharts
- **Storage**: IndexedDB (via idb)
- **Keyboard**: Custom React component

## Project Structure

```
src/
├── App.tsx                 # Main application component
├── main.tsx               # Entry point
├── index.css              # Global styles
├── constants.ts           # Code snippets data
├── lib/
│   ├── storage.ts         # IndexedDB wrapper
│   ├── snippets-api.ts    # Snippets + GitHub API
│   └── utils.ts          # Utility functions
├── components/
│   ├── VirtualKeyboard.tsx  # Virtual keyboard component
│   ├── ProgressChart.tsx    # Progress charts
│   └── SessionHistory.tsx   # Session history table
└── pages/
    └── ProgressPage.tsx     # Progress dashboard
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Code snippets sourced from GitHub public repositories
- Inspired by typing tutors like Monkeytype and Typeracer
