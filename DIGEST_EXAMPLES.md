# Digest Web Components - Usage Examples

Ready-to-use examples for common scenarios.

## Example 1: Basic Setup (Default)

Use as-is with `digest.md` in the same directory.

**Files:**
- digest.html
- digest-theme.js
- digest-renderer.js
- digest-styles.css
- digest.md

**Result:** Works immediately with no changes needed.

---

## Example 2: Load from Different Path

Change the markdown source in `digest.html`:

```html
<digest-renderer src="/content/my-digest.md"></digest-renderer>
```

Or from a subdirectory:
```html
<digest-renderer src="./markdown/today.md"></digest-renderer>
```

---

## Example 3: Fetch from API

Modify `digest-renderer.js` to fetch from an API endpoint:

**Updated `fetchMarkdown` method:**
```javascript
async fetchMarkdown(src) {
  try {
    // Determine if src is URL or file path
    const isUrl = src.startsWith('http');
    
    if (isUrl) {
      // Fetch from API
      const response = await fetch(src, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.content; // Assuming API returns { content: "markdown..." }
    } else {
      // Original file fetch
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${src}`);
      }
      return await response.text();
    }
  } catch (error) {
    console.error('Error fetching digest:', error);
    return `<p class="error">Error: ${error.message}</p>`;
  }
}
```

**Usage in HTML:**
```html
<digest-renderer src="https://api.example.com/digest"></digest-renderer>
```

---

## Example 4: Daily Digest with Date-based URL

Load different digests based on date:

**Modified digest.html:**
```html
<script>
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  document.addEventListener('DOMContentLoaded', () => {
    const renderer = document.querySelector('digest-renderer');
    renderer.setAttribute('src', `/digests/${today}.md`);
  });
</script>

<digest-renderer></digest-renderer>
```

**Directory structure:**
```
digests/
  ├── 2026-07-22.md
  ├── 2026-07-21.md
  └── 2026-07-20.md
```

---

## Example 5: Multiple Digests on Same Page

Show different digests with separate renderers:

```html
<body>
  <digest-theme-manager></digest-theme-manager>

  <h2>Morning Digest</h2>
  <digest-renderer src="digest-morning.md"></digest-renderer>

  <h2>Evening Digest</h2>
  <digest-renderer src="digest-evening.md"></digest-renderer>

  <script type="module" src="digest-theme.js"></script>
  <script type="module" src="digest-renderer.js"></script>
</body>
```

---

## Example 6: Custom Theme Integration

Use theme state in your own code:

```html
<script>
window.addEventListener('theme-changed', (e) => {
  console.log('Theme changed to:', e.detail.effectiveTheme);
  
  if (e.detail.isDark) {
    document.body.classList.add('dark-mode');
    // Update custom elements
    updateCustomCharts('dark');
  } else {
    document.body.classList.remove('dark-mode');
    updateCustomCharts('light');
  }
});
</script>
```

---

## Example 7: Programmatic Theme Control

Change theme from JavaScript:

```javascript
// Get theme manager
const themeManager = document.querySelector('digest-theme-manager');

// Change to dark mode
themeManager.setTheme('dark');

// Or after a delay
setTimeout(() => {
  themeManager.setTheme('light');
}, 2000);

// Check current theme
console.log(themeManager.theme);           // 'auto', 'light', or 'dark'
console.log(themeManager.effectiveTheme);  // 'light' or 'dark'
```

---

## Example 8: Custom Markdown Rendering

Extend markdown parser to support custom syntax:

**Create custom-digest-renderer.js:**
```javascript
// Import the base class or extend it
class CustomDigestRenderer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    const src = this.getAttribute('src');
    const markdown = await fetch(src).then(r => r.text());
    
    // Custom parsing
    const html = this.customMarkdownToHtml(markdown);
    
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="content">${html}</div>
    `;
  }

  customMarkdownToHtml(md) {
    // Your custom parser here
    // Add support for: tables, footnotes, callouts, etc.
    return md;
  }

  getStyles() {
    // Return CSS as string
    return `/* your styles */`;
  }
}

customElements.define('custom-digest-renderer', CustomDigestRenderer);
```

**Use in digest.html:**
```html
<script type="module" src="custom-digest-renderer.js"></script>
<custom-digest-renderer src="digest.md"></custom-digest-renderer>
```

---

## Example 9: Theme Toggle in Header

Create a sticky header with theme toggle:

```html
<header style="position: sticky; top: 0; background: var(--surface-2); border-bottom: 1px solid var(--border); padding: 1rem;">
  <div class="container" style="max-width: 56rem; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
    <h1>My Digest</h1>
    <digest-theme-manager></digest-theme-manager>
  </div>
</header>

<digest-renderer src="digest.md"></digest-renderer>
```

---

## Example 10: Refresh Digest Content

Periodically reload digest content:

```html
<script>
// Refresh digest every 30 minutes
setInterval(() => {
  const renderer = document.querySelector('digest-renderer');
  
  // Reload by setting src again
  const src = renderer.getAttribute('src');
  renderer.setAttribute('src', src + `?t=${Date.now()}`);
}, 30 * 60 * 1000);
</script>
```

---

## Example 11: Search/Filter Digest Content

Add search to filter visible items:

```html
<input 
  type="search" 
  id="search" 
  placeholder="Search digest..."
  style="width: 100%; padding: 0.5rem; margin-bottom: 1rem;"
/>

<script>
document.getElementById('search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const content = document.querySelector('digest-renderer').shadowRoot;
  
  if (!content) return;
  
  const items = content.querySelectorAll('h2, h3');
  items.forEach(item => {
    const matches = item.textContent.toLowerCase().includes(query);
    item.style.display = matches ? '' : 'none';
  });
});
</script>
```

---

## Example 12: Offline Support with Service Worker

Make digest available offline:

**Create service-worker.js:**
```javascript
const CACHE_NAME = 'digest-v1';
const urls = [
  '/',
  '/digest.html',
  '/digest-theme.js',
  '/digest-renderer.js',
  '/digest-styles.css',
  '/digest.md'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urls))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
```

**Register in digest.html:**
```html
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
</script>
```

---

## Example 13: Schedule Digest Updates

Show digest updates at specific times:

```html
<script>
function scheduleDigestUpdate(hour, minute) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  
  if (now > target) {
    target.setDate(target.getDate() + 1);
  }
  
  const delay = target - now;
  
  setTimeout(() => {
    // Reload digest
    location.reload();
    
    // Schedule next update
    scheduleDigestUpdate(hour, minute);
  }, delay);
}

// Update digest every day at 9 AM
scheduleDigestUpdate(9, 0);
</script>
```

---

## Example 14: Export/Print Digest

Add print-friendly styling and export button:

```html
<button onclick="window.print()" style="padding: 0.5rem 1rem; margin: 1rem;">
  📥 Print Digest
</button>
```

**Enhanced print CSS:**
```css
@media print {
  digest-theme-manager {
    display: none;
  }
  
  body {
    background: white;
    color: black;
  }
  
  a {
    text-decoration: underline;
    color: blue;
  }
  
  * {
    transition: none !important;
  }
}
```

---

## Example 15: Analytics Integration

Track digest views and interactions:

```html
<script>
// Log page view
if (typeof gtag !== 'undefined') {
  gtag('event', 'page_view', {
    page_title: 'Daily Digest',
    page_location: window.location.href
  });
}

// Track theme changes
window.addEventListener('theme-changed', (e) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'theme_change', {
      theme: e.detail.effectiveTheme
    });
  }
});
</script>
```

---

## Quick Copy-Paste Templates

### Minimal HTML
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digest</title>
  <link rel="stylesheet" href="digest-styles.css">
</head>
<body>
  <digest-theme-manager></digest-theme-manager>
  <digest-renderer src="digest.md"></digest-renderer>
  
  <script type="module" src="digest-theme.js"></script>
  <script type="module" src="digest-renderer.js"></script>
</body>
</html>
```

### With Header
```html
<header style="position: sticky; top: 0; border-bottom: 1px solid var(--border); background: var(--surface-2); padding: 1rem;">
  <div class="container" style="max-width: 56rem; margin: 0 auto; display: flex; justify-content: space-between;">
    <h1>Daily Digest</h1>
    <digest-theme-manager></digest-theme-manager>
  </div>
</header>
<digest-renderer src="digest.md"></digest-renderer>
```

---

Mix and match these examples to build your perfect digest experience! 🎯
