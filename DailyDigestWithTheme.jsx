import React, { useState, useEffect } from 'react';

/**
 * PRODUCTION-READY DAILY DIGEST WITH THEME MANAGEMENT
 *
 * Features:
 * - Detects and respects system color scheme preference (prefers-color-scheme)
 * - Manual theme toggle: Auto (follows system), Light, or Dark
 * - Persists user theme choice in localStorage
 * - Smooth CSS transitions between themes
 * - Shows current theme status in the UI
 *
 * Usage:
 * import DailyDigest from './DailyDigestWithTheme';
 *
 * export default function App() {
 *   return <DailyDigest />;
 * }
 */

/**
 * Custom hook for managing theme state with system preference detection
 * and localStorage persistence
 */
const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage on first render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-preference');
      return saved || 'auto';
    }
    return 'auto';
  });

  const [systemPreference, setSystemPreference] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Detect system preference on mount and subscribe to changes
  useEffect(() => {
    setMounted(true);

    // Detect initial system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(prefersDark.matches ? 'dark' : 'light');

    // Listen for system preference changes (e.g., when OS theme changes)
    const handleChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    prefersDark.addEventListener('change', handleChange);
    return () => prefersDark.removeEventListener('change', handleChange);
  }, []);

  // Determine the effective theme (considering 'auto' mode)
  const effectiveTheme = theme === 'auto' ? systemPreference : theme;

  // Apply theme to DOM and persist choice
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Set CSS color-scheme property for native elements (inputs, selects, etc.)
    root.style.colorScheme = effectiveTheme;

    // Add/remove 'dark' class for Tailwind dark mode
    // If your project uses CSS custom properties or a different approach,
    // adjust this section accordingly
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persist the user's theme choice (not the effective theme)
    localStorage.setItem('theme-preference', theme);
  }, [theme, effectiveTheme, mounted]);

  const setThemeMode = (newTheme) => {
    if (['auto', 'light', 'dark'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  return {
    theme,
    effectiveTheme,
    systemPreference,
    setTheme: setThemeMode,
    isDark: effectiveTheme === 'dark',
    mounted,
  };
};

/**
 * Sample digest item component
 */
const DigestItem = ({ item, isDark }) => {
  const getCategoryColor = (category) => {
    const colors = {
      work: isDark ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-700',
      tech: isDark ? 'bg-purple-900/30 text-purple-200' : 'bg-purple-100 text-purple-700',
      metrics: isDark ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-700',
      security: isDark ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700',
    };
    return colors[category] || colors.work;
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-300 hover:shadow-md cursor-pointer ${
        isDark
          ? 'border-slate-700 bg-slate-800 hover:bg-slate-700/80'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3
          className={`font-semibold text-base transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {item.title}
        </h3>
        <span
          className={`text-xs whitespace-nowrap transition-colors duration-300 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {item.time}
        </span>
      </div>
      <p
        className={`text-sm mb-3 transition-colors duration-300 ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        {item.preview}
      </p>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium px-2 py-1 rounded transition-colors duration-300 ${getCategoryColor(
            item.category
          )}`}
        >
          {item.source}
        </span>
        <span
          className={`text-xs transition-colors duration-300 ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          Category: {item.category}
        </span>
      </div>
    </div>
  );
};

/**
 * Theme selector component
 */
const ThemeSelector = ({ theme, setTheme, effectiveTheme, isDark }) => {
  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div
        className={`rounded-lg border p-4 transition-colors duration-300 ${
          isDark
            ? 'border-slate-700 bg-slate-800/50'
            : 'border-slate-200 bg-slate-100/50'
        }`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2
              className={`text-sm font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Theme
            </h2>
            <p
              className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Current: <span className="font-medium capitalize">
                {theme === 'auto'
                  ? `${effectiveTheme} (system)`
                  : `${theme} (override)`}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            {['auto', 'light', 'dark'].map((option) => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                  theme === option
                    ? isDark
                      ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                      : 'bg-blue-500 text-white ring-1 ring-blue-300'
                    : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {option === 'auto'
                  ? '🔄 Auto'
                  : option === 'light'
                  ? '☀️ Light'
                  : '🌙 Dark'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Daily Digest component
 */
const DailyDigest = () => {
  const { theme, effectiveTheme, setTheme, isDark, mounted } = useTheme();
  const [unreadCount] = useState(12);

  // Sample digest items - replace with your actual data
  const digestItems = [
    {
      id: 1,
      title: 'Team standup recap',
      preview:
        'Backend optimization completed ahead of schedule. Check the PR for details.',
      time: '2 hours ago',
      source: 'Slack',
      category: 'work',
    },
    {
      id: 2,
      title: 'New framework update available',
      preview:
        'React 19.2 introduces significant performance improvements and new hooks.',
      time: '4 hours ago',
      source: 'Dev News',
      category: 'tech',
    },
    {
      id: 3,
      title: 'Project milestone achieved',
      preview:
        'Feature X has reached production and is now live for 50% of users.',
      time: '6 hours ago',
      source: 'Analytics',
      category: 'metrics',
    },
    {
      id: 4,
      title: 'Security update reminder',
      preview:
        'Don\'t forget to enable 2FA on all critical accounts before end of month.',
      time: '8 hours ago',
      source: 'Security',
      category: 'security',
    },
  ];

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <div
      style={{ colorScheme: effectiveTheme }}
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-slate-950' : 'bg-white'
      }`}
    >
      {/* Global transition styles for smooth theme switching */}
      <style>{`
        * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
      `}</style>

      {/* Header */}
      <div
        className={`border-b transition-colors duration-300 ${
          isDark
            ? 'border-slate-800 bg-slate-900/50'
            : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1
                className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Daily Digest
              </h1>
              <p
                className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div
              className={`text-center px-3 py-1 rounded-full transition-colors duration-300 ${
                isDark
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              <p className="text-xs font-medium">{unreadCount} updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selector */}
      <ThemeSelector
        theme={theme}
        setTheme={setTheme}
        effectiveTheme={effectiveTheme}
        isDark={isDark}
      />

      {/* Digest Items */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <div className="space-y-3">
          {digestItems.map((item) => (
            <DigestItem key={item.id} item={item} isDark={isDark} />
          ))}
        </div>
      </div>

      {/* Footer - System Preference Indicator */}
      <div
        className={`border-t transition-colors duration-300 ${
          isDark
            ? 'border-slate-800 bg-slate-900/50'
            : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <div className="max-w-2xl mx-auto px-6 py-4">
          <p
            className={`text-xs transition-colors duration-300 ${
              isDark ? 'text-slate-500' : 'text-slate-500'
            }`}
          >
            System preference: <span className="font-medium capitalize">
              {effectiveTheme}
            </span>
            {theme === 'auto' && ' (being used)'}
            {theme !== 'auto' && ' (overridden)'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailyDigest;
