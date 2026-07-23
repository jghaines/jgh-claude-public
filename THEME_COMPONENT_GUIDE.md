# Daily Digest with Theme Management - Complete Guide

A production-ready React component for a scheduled daily digest with full dark/light theme support. The component automatically detects system color scheme preference and allows manual override with localStorage persistence.

## Features

✅ **System Preference Detection** — Uses `prefers-color-scheme` media query to detect OS theme  
✅ **Three Theme Modes** — Auto (follows system), Light, or Dark  
✅ **Persistent Storage** — User's theme choice is saved to localStorage  
✅ **Smooth Transitions** — CSS transitions for theme changes (300ms)  
✅ **Real-time Status** — Shows current theme and whether it's using system or override  
✅ **Responsive Design** — Works on all screen sizes  
✅ **SSR-Safe** — Includes hydration-safe mounting check  
✅ **Tailwind Ready** — Uses Tailwind dark mode classes  

## Installation

### 1. Copy the component file
Place `DailyDigestWithTheme.jsx` in your project:
```bash
cp DailyDigestWithTheme.jsx src/components/
```

### 2. Add to your app
```jsx
import DailyDigest from './components/DailyDigestWithTheme';

export default function App() {
  return <DailyDigest />;
}
```

## How It Works

### System Preference Detection
The component uses the CSS media query `prefers-color-scheme` to detect the user's OS theme preference:

```javascript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
```

It subscribes to changes, so if the user changes their OS theme while your app is open, the component updates automatically.

### Three Theme Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Auto** | Follows system preference | Recommended default |
| **Light** | Force light theme | User prefers light regardless of OS |
| **Dark** | Force dark theme | User prefers dark regardless of OS |

### localStorage Integration

The component stores the user's theme preference:

```javascript
localStorage.setItem('theme-preference', theme);
```

On the next visit, it restores their choice:

```javascript
const saved = localStorage.getItem('theme-preference');
```

### Theme Application

The component applies the theme in two ways:

1. **CSS colorScheme property** (for native elements like inputs):
```javascript
root.style.colorScheme = effectiveTheme;
```

2. **Tailwind dark mode** (for component styling):
```javascript
root.classList.add('dark'); // or remove for light
```

This ensures both native HTML elements and your styled components respond to the theme.

## Customization

### Change the default theme
In the `useTheme` hook, update the initial state:

```javascript
const [theme, setTheme] = useState(() => {
  const saved = localStorage.getItem('theme-preference');
  return saved || 'dark'; // Change to 'dark' or 'light'
});
```

### Update digest items
Replace the sample data with your own:

```jsx
const digestItems = [
  {
    id: 1,
    title: 'Your title',
    preview: 'Your preview text',
    time: '2 hours ago',
    source: 'Your source',
    category: 'work', // or 'tech', 'metrics', 'security'
  },
  // ... more items
];
```

### Customize colors
Modify category colors in the `getCategoryColor` function:

```javascript
const getCategoryColor = (category) => {
  const colors = {
    work: isDark ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-700',
    // Add more categories...
  };
};
```

### Adjust transition speed
Change the duration (currently 300ms):

```jsx
// In the component
className={`transition-colors duration-300`}
// Or in the global style
<style>{`* { transition: background-color 0.5s ease; }`}</style>
```

### Add to a header/navbar
Extract the `ThemeSelector` component and place it in your header:

```jsx
import { ThemeSelector } from './DailyDigestWithTheme';

export function Header() {
  const { theme, setTheme, effectiveTheme, isDark } = useTheme();
  
  return (
    <header>
      <ThemeSelector
        theme={theme}
        setTheme={setTheme}
        effectiveTheme={effectiveTheme}
        isDark={isDark}
      />
    </header>
  );
}
```

## Using the Theme Hook Elsewhere

The `useTheme` hook can be used in any component:

```jsx
import { useTheme } from './DailyDigestWithTheme';

export function MyComponent() {
  const { theme, effectiveTheme, isDark, setTheme } = useTheme();

  return (
    <div className={isDark ? 'bg-slate-900' : 'bg-white'}>
      Current theme: {effectiveTheme}
      <button onClick={() => setTheme('dark')}>Use Dark</button>
    </div>
  );
}
```

### Hook API

```javascript
const {
  theme,              // 'auto', 'light', or 'dark' (user's choice)
  effectiveTheme,     // 'light' or 'dark' (what's actually applied)
  systemPreference,   // 'light' or 'dark' (OS preference)
  setTheme,           // Function to change theme
  isDark,             // Boolean - true if effectiveTheme is 'dark'
  mounted,            // Boolean - true after hydration (SSR-safe)
} = useTheme();
```

## Browser Support

- **System preference detection** — All modern browsers (Chrome 76+, Firefox 67+, Safari 12.1+, Edge 79+)
- **localStorage** — All browsers
- **CSS transitions** — All modern browsers

Legacy browsers without `prefers-color-scheme` support will default to light mode.

## Performance Considerations

- **No re-renders on system change** — The component only re-renders when the effective theme changes, not when system preference changes (if in Auto mode, it updates the DOM directly via `classList` changes)
- **Minimal JavaScript** — Uses native browser APIs, no dependencies
- **Smooth transitions** — CSS transitions prevent jarring color changes
- **SSR-safe** — Includes `mounted` check to prevent hydration mismatches

## Preventing Flash of Wrong Theme

To avoid a flash of the wrong theme on page load, add this to your `index.html` `<head>`:

```html
<script>
  const theme = localStorage.getItem('theme-preference') || 'auto';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);
  
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
</script>
```

Place this before your React app loads to apply the theme before rendering.

## API Reference

### useTheme Hook

The custom hook that manages all theme logic.

**Returns:**
- `theme` (string) — User's chosen theme ('auto', 'light', 'dark')
- `effectiveTheme` (string) — Currently applied theme ('light' or 'dark')
- `systemPreference` (string) — OS preference ('light' or 'dark')
- `setTheme(newTheme)` — Function to change theme
- `isDark` (boolean) — Convenience boolean for current theme
- `mounted` (boolean) — True when component is hydrated (SSR-safe)

**Storage:**
- Reads from: `localStorage.getItem('theme-preference')`
- Writes to: `localStorage.setItem('theme-preference', theme)`

### Component Structure

```
DailyDigest (main component)
├── Header (shows title, date, unread count)
├── ThemeSelector (theme toggle buttons)
├── DigestItems (list of digest items)
│   └── DigestItem (individual item card)
└── Footer (shows system preference status)
```

## Common Issues

### Theme not persisting
Ensure localStorage is available:
```javascript
if (typeof window !== 'undefined' && window.localStorage) {
  // localStorage is available
}
```

### Flash of wrong theme on page load
Add the script in the "Preventing Flash of Wrong Theme" section to your HTML.

### Not working with Next.js
The component includes a `mounted` check to prevent hydration mismatches. Make sure it's not rendering before hydration.

### Tailwind dark mode not working
Ensure your `tailwind.config.js` has dark mode enabled:
```javascript
module.exports = {
  darkMode: 'class',
  // ... rest of config
}
```

## Example: Custom Theme Integration

```jsx
import { useState, useEffect } from 'react';
import DailyDigest, { useTheme } from './DailyDigestWithTheme';

export function AppWithCustomTheme() {
  const { isDark } = useTheme();

  return (
    <div className={isDark ? 'bg-slate-950' : 'bg-white'}>
      <DailyDigest />
      
      {/* Other components can use isDark */}
      <footer className={isDark ? 'bg-slate-900' : 'bg-slate-100'}>
        {/* ... */}
      </footer>
    </div>
  );
}
```

## License

Free to use in any project, commercial or personal.

## Support

For issues or improvements, refer to the inline comments in `DailyDigestWithTheme.jsx`.
