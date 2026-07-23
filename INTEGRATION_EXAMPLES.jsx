/**
 * INTEGRATION EXAMPLES
 * Copy and adapt these examples for your specific use case
 */

import React from 'react';
import DailyDigest, { useTheme } from './DailyDigestWithTheme';

/**
 * EXAMPLE 1: Standalone app with DailyDigest only
 * Simplest setup - just drop in and it works
 */
export function StandaloneApp() {
  return (
    <div>
      <DailyDigest />
    </div>
  );
}

/**
 * EXAMPLE 2: App with navigation header and DailyDigest
 * Shows how to add theme toggle to a header
 */
export function AppWithHeader() {
  const { theme, setTheme, effectiveTheme, isDark } = useTheme();

  return (
    <div className={isDark ? 'bg-slate-950' : 'bg-white'}>
      {/* Header */}
      <header
        className={`border-b sticky top-0 ${
          isDark
            ? 'border-slate-800 bg-slate-900'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1
            className={`text-xl font-bold ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            My App
          </h1>

          {/* Theme Toggle in Header */}
          <div className="flex gap-2">
            {['auto', 'light', 'dark'].map((option) => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  theme === option
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {option === 'auto'
                  ? 'Auto'
                  : option === 'light'
                  ? 'Light'
                  : 'Dark'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        <DailyDigest />
      </main>
    </div>
  );
}

/**
 * EXAMPLE 3: Multi-page app with shared theme
 * All pages automatically use the same theme
 */
export function Router({ page }) {
  const { isDark } = useTheme();

  // Components automatically inherit the theme from useTheme hook
  const pages = {
    digest: <DailyDigest />,
    settings: <SettingsPage />,
    dashboard: <DashboardPage />,
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-slate-950' : 'bg-white'
      }`}
    >
      {pages[page]}
    </div>
  );
}

function SettingsPage() {
  const { isDark } = useTheme();

  return (
    <div className={`p-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <h1 className="text-2xl font-bold">Settings</h1>
      {/* Settings content */}
    </div>
  );
}

function DashboardPage() {
  const { isDark } = useTheme();

  return (
    <div className={`p-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
}

/**
 * EXAMPLE 4: Custom component using the theme hook
 * Shows how to build other components that respond to theme
 */
function CustomCard({ children }) {
  const { isDark } = useTheme();

  return (
    <div
      className={`rounded-lg border p-4 transition-colors duration-300 ${
        isDark
          ? 'border-slate-700 bg-slate-800 text-white'
          : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      {children}
    </div>
  );
}

/**
 * EXAMPLE 5: App with manual theme provider
 * Useful if you want theme management centralized
 */
export function AppWithThemeProvider({ children }) {
  const themeContext = useTheme();

  return (
    <div>
      {/* Make theme available to all children via context if needed */}
      {children}
    </div>
  );
}

/**
 * EXAMPLE 6: Next.js integration
 * Safe for server-side rendering with hydration
 */
export function NextJsPage() {
  return (
    <div>
      <DailyDigest />
    </div>
  );
}

// Add to next.config.js to prevent hydration mismatches:
// module.exports = {
//   reactStrictMode: true,
// };

/**
 * EXAMPLE 7: Digest with real data fetching
 * Modify DailyDigest component's digestItems to fetch from API
 */
export function DigestWithAPI() {
  const { isDark } = useTheme();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Replace with your API call
    fetch('/api/digest')
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${
          isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
        }`}
      >
        Loading...
      </div>
    );
  }

  return <DailyDigest />;
}

/**
 * EXAMPLE 8: Theme toggle as floating action button
 * Useful for apps where header space is limited
 */
export function AppWithFloatingThemeToggle() {
  const { isDark, theme, setTheme } = useTheme();

  return (
    <div>
      <DailyDigest />

      {/* Floating theme toggle */}
      <div className="fixed bottom-6 right-6 flex gap-2">
        {['auto', 'light', 'dark'].map((option) => (
          <button
            key={option}
            onClick={() => setTheme(option)}
            className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center ${
              theme === option
                ? isDark
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-blue-500 text-white ring-2 ring-blue-300'
                : isDark
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title={`Set theme to ${option}`}
          >
            {option === 'auto' ? '🔄' : option === 'light' ? '☀️' : '🌙'}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * EXAMPLE 9: Modal/Popover with custom theme
 * Shows how theme works in overlays
 */
export function AppWithModal() {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div>
      <DailyDigest />

      <button
        onClick={() => setIsOpen(true)}
        className={`m-6 px-4 py-2 rounded transition-colors ${
          isDark
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        Open Modal
      </button>

      {isOpen && (
        <div
          className={`fixed inset-0 flex items-center justify-center ${
            isDark ? 'bg-black/50' : 'bg-black/30'
          }`}
          onClick={() => setIsOpen(false)}
        >
          <div
            className={`rounded-lg p-6 ${
              isDark
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Modal Title</h2>
            <p className="mb-4">Modal content respects the theme.</p>
            <button
              onClick={() => setIsOpen(false)}
              className={`px-4 py-2 rounded transition-colors ${
                isDark
                  ? 'bg-slate-700 hover:bg-slate-600'
                  : 'bg-slate-200 hover:bg-slate-300'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * EXAMPLE 10: Conditional rendering based on theme
 * Render different content based on theme preference
 */
export function ConditionalThemeContent() {
  const { isDark, theme } = useTheme();

  return (
    <div>
      <DailyDigest />

      {isDark && (
        <div className="bg-slate-800 text-white p-6">
          Dark mode specific content
        </div>
      )}

      {!isDark && (
        <div className="bg-slate-100 text-slate-900 p-6">
          Light mode specific content
        </div>
      )}

      {theme === 'auto' && (
        <div className="bg-blue-50 text-blue-900 p-6">
          Using automatic theme detection
        </div>
      )}
    </div>
  );
}

/**
 * EXPORT ALL EXAMPLES
 * Use one of these as your app entry point
 */
export const EXAMPLES = {
  StandaloneApp,
  AppWithHeader,
  Router,
  CustomCard,
  AppWithThemeProvider,
  DigestWithAPI,
  AppWithFloatingThemeToggle,
  AppWithModal,
  ConditionalThemeContent,
};
