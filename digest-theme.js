/**
 * DIGEST THEME MANAGER WEB COMPONENT
 *
 * Manages dark/light theme with system preference detection
 * and localStorage persistence.
 *
 * Features:
 * - Detects system color scheme (prefers-color-scheme)
 * - Manual toggle: Auto, Light, Dark
 * - Persists choice to localStorage
 * - Smooth transitions
 * - Real-time status display
 */

class DigestThemeManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.theme = localStorage.getItem('theme-preference') || 'auto';
    this.systemPreference = 'light';
    this.effectiveTheme = 'light';
  }

  connectedCallback() {
    this.detectSystemPreference();
    this.updateEffectiveTheme();
    this.render();
    this.attachEventListeners();
    this.observeSystemPreference();
  }

  /**
   * Detect current system color scheme preference
   */
  detectSystemPreference() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemPreference = prefersDark.matches ? 'dark' : 'light';
  }

  /**
   * Calculate effective theme (considering auto mode)
   */
  updateEffectiveTheme() {
    this.effectiveTheme =
      this.theme === 'auto' ? this.systemPreference : this.theme;
  }

  /**
   * Apply theme to DOM
   */
  applyTheme(theme) {
    const root = document.documentElement;

    // Set color-scheme for native elements
    root.style.colorScheme = theme;

    // Add/remove dark class for CSS
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Dispatch custom event for other components
    window.dispatchEvent(
      new CustomEvent('theme-changed', {
        detail: {
          theme: this.theme,
          effectiveTheme: this.effectiveTheme,
          isDark: theme === 'dark',
        },
      })
    );
  }

  /**
   * Listen for system preference changes
   */
  observeSystemPreference() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    prefersDark.addEventListener('change', (e) => {
      this.systemPreference = e.matches ? 'dark' : 'light';

      // Only update if in auto mode
      if (this.theme === 'auto') {
        this.updateEffectiveTheme();
        this.applyTheme(this.effectiveTheme);
        this.updateUI();
      }
    });
  }

  /**
   * Set theme mode
   */
  setTheme(newTheme) {
    if (['auto', 'light', 'dark'].includes(newTheme)) {
      this.theme = newTheme;

      // Persist to localStorage
      localStorage.setItem('theme-preference', newTheme);

      // Update effective theme and apply
      this.updateEffectiveTheme();
      this.applyTheme(this.effectiveTheme);

      // Update UI
      this.updateUI();
    }
  }

  /**
   * Update UI to reflect current state
   */
  updateUI() {
    const buttons = this.shadowRoot.querySelectorAll('button');
    buttons.forEach((btn) => {
      const btnTheme = btn.dataset.theme;
      btn.classList.toggle(
        'active',
        btnTheme === this.theme
      );
    });

    const status = this.shadowRoot.querySelector('.theme-status');
    if (status) {
      const suffix =
        this.theme === 'auto'
          ? ` (${this.effectiveTheme} - system)`
          : ` (override)`;
      status.textContent = `${this.effectiveTheme}${suffix}`;
    }
  }

  /**
   * Attach click handlers to theme buttons
   */
  attachEventListeners() {
    this.shadowRoot.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.setTheme(e.target.dataset.theme);
      });
    });
  }

  /**
   * Render component HTML
   */
  render() {
    const statusSuffix =
      this.theme === 'auto'
        ? ` (${this.effectiveTheme} - system)`
        : ` (override)`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --surface-1: #f3f4f6;
          --surface-2: #ffffff;
          --border: #e5e7eb;
          --blue-500: #3b82f6;
          --blue-600: #2563eb;
          --slate-200: #e2e8f0;
          --slate-700: #334155;
        }

        :host(.dark) {
          --text-primary: #f3f4f6;
          --text-secondary: #9ca3af;
          --surface-1: #1f2937;
          --surface-2: #111827;
          --border: #374151;
          --blue-500: #3b82f6;
          --blue-600: #1d4ed8;
          --slate-200: #475569;
          --slate-700: #cbd5e1;
        }

        * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        :host {
          display: block;
          border-bottom: 1px solid var(--border);
          background: var(--surface-2);
          padding: 1.5rem;
        }

        .container {
          max-width: 56rem;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .theme-info {
          flex: 1;
          min-width: 200px;
        }

        .theme-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem;
        }

        .theme-status {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
          text-transform: capitalize;
        }

        .theme-buttons {
          display: flex;
          gap: 0.5rem;
        }

        button {
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid var(--border);
          background: var(--surface-1);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        button:hover:not(.active) {
          background: var(--slate-200);
        }

        button.active {
          background: var(--blue-600);
          color: #ffffff;
          border-color: var(--blue-500);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        @media (max-width: 640px) {
          :host {
            padding: 1rem;
          }

          .container {
            flex-direction: column;
            align-items: flex-start;
          }

          .theme-buttons {
            width: 100%;
          }

          button {
            flex: 1;
          }
        }
      </style>

      <div class="container">
        <div class="theme-info">
          <p class="theme-label">Theme</p>
          <p class="theme-status">${this.effectiveTheme}${statusSuffix}</p>
        </div>

        <div class="theme-buttons">
          <button data-theme="auto" class="${this.theme === 'auto' ? 'active' : ''}">
            🔄 Auto
          </button>
          <button data-theme="light" class="${this.theme === 'light' ? 'active' : ''}">
            ☀️ Light
          </button>
          <button data-theme="dark" class="${this.theme === 'dark' ? 'active' : ''}">
            🌙 Dark
          </button>
        </div>
      </div>
    `;

    // Apply dark mode class if needed
    if (this.effectiveTheme === 'dark') {
      this.shadowRoot.host.classList.add('dark');
    } else {
      this.shadowRoot.host.classList.remove('dark');
    }
  }
}

// Register the web component
customElements.define('digest-theme-manager', DigestThemeManager);

// Expose theme manager for external control
export function getThemeManager() {
  return document.querySelector('digest-theme-manager');
}

export function setTheme(theme) {
  const manager = getThemeManager();
  if (manager) {
    manager.setTheme(theme);
  }
}

export function getTheme() {
  const manager = getThemeManager();
  if (manager) {
    return {
      theme: manager.theme,
      effectiveTheme: manager.effectiveTheme,
      systemPreference: manager.systemPreference,
    };
  }
  return null;
}
