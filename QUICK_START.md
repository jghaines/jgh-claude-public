# Quick Start Guide

Get the Daily Digest theme component running in 2 minutes.

## 1️⃣ Copy the file
Copy `DailyDigestWithTheme.jsx` into your React project:
```bash
src/components/DailyDigestWithTheme.jsx
```

## 2️⃣ Import and use
```jsx
import DailyDigest from './components/DailyDigestWithTheme';

export default function App() {
  return <DailyDigest />;
}
```

That's it! The component works immediately with:
- ✅ System dark/light mode detection
- ✅ Manual theme toggle (Auto/Light/Dark)
- ✅ localStorage persistence
- ✅ Smooth transitions
- ✅ Responsive design

## Requirements

- React 16.8+ (uses hooks)
- Tailwind CSS (or manually style with CSS variables)
- Modern browser with `prefers-color-scheme` support

## Key Features

| Feature | How It Works |
|---------|------------|
| System detection | Automatically reads OS theme |
| Manual override | Click buttons to force Light/Dark |
| Persistent | Saves choice to localStorage |
| Smooth | 300ms CSS transitions |
| Real-time | Updates when OS theme changes |

## Customize

### Change the digest items
Edit the `digestItems` array in the component:
```jsx
const digestItems = [
  {
    id: 1,
    title: 'Your title',
    preview: 'Your preview',
    time: '2 hours ago',
    source: 'Your source',
    category: 'work',
  },
];
```

### Use in other components
```jsx
import { useTheme } from './components/DailyDigestWithTheme';

function MyComponent() {
  const { isDark, effectiveTheme, setTheme } = useTheme();
  
  return (
    <div className={isDark ? 'bg-slate-900' : 'bg-white'}>
      {/* Your content */}
    </div>
  );
}
```

### Add theme toggle to your header
```jsx
import { useTheme } from './components/DailyDigestWithTheme';

function Header() {
  const { theme, setTheme, isDark } = useTheme();
  
  return (
    <header>
      {/* Your header content */}
      <div className="flex gap-2">
        <button onClick={() => setTheme('auto')}>Auto</button>
        <button onClick={() => setTheme('light')}>Light</button>
        <button onClick={() => setTheme('dark')}>Dark</button>
      </div>
    </header>
  );
}
```

## Prevent flash of wrong theme

Add this to your `public/index.html` in the `<head>`:
```html
<script>
  const theme = localStorage.getItem('theme-preference') || 'auto';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);
  if (isDark) document.documentElement.classList.add('dark');
</script>
```

## Next.js setup

The component works with Next.js out of the box (includes hydration safety).

No special configuration needed — just import and use.

## Tailwind dark mode

Ensure your `tailwind.config.js` has:
```javascript
module.exports = {
  darkMode: 'class',
  // rest of config
}
```

## useTheme Hook API

```javascript
const {
  theme,              // 'auto' | 'light' | 'dark' (user's choice)
  effectiveTheme,     // 'light' | 'dark' (what's applied)
  systemPreference,   // 'light' | 'dark' (OS setting)
  isDark,             // boolean
  setTheme,           // (theme: string) => void
  mounted,            // boolean (true after hydration)
} = useTheme();
```

## Troubleshooting

**Theme not persisting?**
Check if localStorage is enabled in your browser.

**Flash of wrong theme on load?**
Add the script from "Prevent flash of wrong theme" section.

**Not working with Next.js?**
The component includes hydration safety. Make sure you're not rendering it on the server before hydration.

**Dark mode not applying?**
Verify `darkMode: 'class'` in your `tailwind.config.js`.

## Common use cases

### Just the theme hook
```jsx
const { isDark } = useTheme();
```

### Change theme on button click
```jsx
<button onClick={() => setTheme('dark')}>Go Dark</button>
```

### Show different UI based on theme
```jsx
{isDark ? <DarkIcon /> : <LightIcon />}
```

### Check if using system preference
```jsx
{theme === 'auto' && <p>Using system preference</p>}
```

## Files included

- `DailyDigestWithTheme.jsx` — Main component
- `THEME_COMPONENT_GUIDE.md` — Complete documentation
- `INTEGRATION_EXAMPLES.jsx` — Code examples
- `QUICK_START.md` — This file

## Next steps

1. Copy `DailyDigestWithTheme.jsx` to your project
2. Import and use `<DailyDigest />`
3. Customize digest items and colors
4. Read `THEME_COMPONENT_GUIDE.md` for advanced usage

## Support

See `THEME_COMPONENT_GUIDE.md` for:
- Detailed API reference
- Customization guide
- Troubleshooting
- Performance tips
- Browser support

---

**That's it!** You now have a production-ready dark/light theme system with a beautiful daily digest component. 🚀
