/**
 * DIGEST RENDERER WEB COMPONENT
 *
 * Fetches and renders markdown content as HTML.
 * Integrates with theme system for automatic dark/light mode.
 *
 * Usage:
 * <digest-renderer src="digest.md"></digest-renderer>
 *
 * Features:
 * - Fetches markdown from URL
 * - Converts to HTML
 * - Supports links, images, code blocks
 * - Theme-aware styling
 * - Error handling
 */

class DigestRenderer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.content = '';
    this.icons = {};
    this.date = '';
  }

  connectedCallback() {
    this.render();
    this.fetchAndRender();
    this.subscribeToThemeChanges();
  }

  /**
   * Listen for theme changes and update styles
   */
  subscribeToThemeChanges() {
    window.addEventListener('theme-changed', (e) => {
      this.updateThemeClasses(e.detail.isDark);
    });

    // Initial theme update
    const isDark = document.documentElement.classList.contains('dark');
    this.updateThemeClasses(isDark);
  }

  /**
   * Update component styling based on theme
   */
  updateThemeClasses(isDark) {
    if (isDark) {
      this.shadowRoot.host.classList.add('dark');
    } else {
      this.shadowRoot.host.classList.remove('dark');
    }
  }

  /**
   * Fetch markdown file
   */
  async fetchMarkdown(src) {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${src}: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * Split the YAML front matter off the payload.
   *
   * digest.md leads with a metadata block (date, section titles and icons)
   * that must not reach the markdown converter, or it renders as body text.
   * Only the small subset of YAML the digest payload uses is supported:
   * top-level `key: value` pairs plus the `sections:` list of flat objects.
   */
  parseFrontMatter(md) {
    const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) return { meta: { sections: [] }, body: md };

    const unquote = (v) => v.replace(/^["'](.*)["']$/, '$1').trim();
    const meta = { sections: [] };
    let section = null;

    for (const line of match[1].split(/\r?\n/)) {
      if (!line.trim()) continue;

      // "  - id: foo" starts a new section
      const item = line.match(/^\s*-\s+(\w+):\s*(.*)$/);
      if (item) {
        section = { [item[1]]: unquote(item[2]) };
        meta.sections.push(section);
        continue;
      }

      // "    title: Foo" continues the section started above
      const nested = line.match(/^\s{2,}(\w+):\s*(.*)$/);
      if (nested && section) {
        section[nested[1]] = unquote(nested[2]);
        continue;
      }

      // "date: 2026-07-24" — split on the first colon only, so ISO
      // timestamps keep their own colons intact
      const top = line.match(/^(\w+):\s*(.*)$/);
      if (top) {
        section = null;
        if (top[2] !== '') meta[top[1]] = unquote(top[2]);
      }
    }

    return { meta, body: md.slice(match[0].length) };
  }

  /**
   * Format the front matter `date` as a page header, e.g.
   * "FRIDAY, JULY 24, 2026". Falls back to the raw value if unparseable.
   */
  formatDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    if (isNaN(date)) return value;
    return date
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
      .toUpperCase();
  }

  /**
   * Simple markdown to HTML converter
   * Handles: headers, paragraphs, lists, links, code blocks, emphasis
   */
  markdownToHtml(md) {
    let html = md
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&amp;#/g, '&#') // Unescape HTML entities
      .replace(/&amp;([a-zA-Z]+);/g, '&$1;');

    // Code blocks (triple backticks)
    html = html.replace(
      /```(\w*)\n([\s\S]*?)\n```/g,
      (match, lang, code) => {
        const escaped = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<pre><code class="language-${lang || 'plaintext'}">${escaped}</code></pre>`;
      }
    );

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers. Section headings pick up the icon declared for them in the
    // payload's front matter, matched on title.
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, (match, title) => {
      const icon = this.icons[title.trim()];
      return icon
        ? `<h2><span class="icon">${icon}</span>${title}</h2>`
        : `<h2>${title}</h2>`;
    });
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^\w])__([^_]+)__(?!\w)/g, '$1<strong>$2</strong>');

    // Italic. Underscores only count at word boundaries, so snake_case
    // identifiers in the payload (HOME_ASSISTANT_TOKEN) survive intact.
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/(^|[^\w])_([^_]+)_(?!\w)/g, '$1<em>$2</em>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // Images
    html = html.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" loading="lazy" />'
    );

    // Line breaks and paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p><\/p>/g, '');

    // Lists (simple)
    html = html.replace(
      /<p>- (.*?)(?=<p>|$)/g,
      '<ul><li>$1</li></ul>'
    );

    // Numbered lists
    html = html.replace(
      /<p>\d+\. (.*?)(?=<p>|$)/g,
      '<ol><li>$1</li></ol>'
    );

    return html;
  }

  /**
   * Fetch markdown and render
   */
  async fetchAndRender() {
    const src = this.getAttribute('src');

    if (!src) {
      this.displayError('No src attribute provided');
      return;
    }

    let markdown;
    try {
      markdown = await this.fetchMarkdown(src);
    } catch (error) {
      console.error('Error fetching digest:', error);
      this.displayError(`Error loading digest: ${error.message}`);
      return;
    }

    const { meta, body } = this.parseFrontMatter(markdown);

    this.icons = {};
    for (const section of meta.sections) {
      if (section.title && section.icon) this.icons[section.title] = section.icon;
    }

    this.date = this.formatDate(meta.date);
    this.content = this.markdownToHtml(body);
    this.renderContent();
  }

  /**
   * Display loading state
   */
  displayLoading() {
    const container = this.shadowRoot.querySelector('.content');
    if (container) {
      container.innerHTML = '<p class="loading">Loading digest...</p>';
    }
  }

  /**
   * Display error
   */
  displayError(message) {
    const container = this.shadowRoot.querySelector('.content');
    if (container) {
      container.innerHTML = `<p class="error">${message}</p>`;
    }
  }

  /**
   * Render content
   */
  renderContent() {
    const header = this.shadowRoot.querySelector('.date');
    if (header) {
      header.textContent = this.date;
    }

    const container = this.shadowRoot.querySelector('.content');
    if (container) {
      container.innerHTML = this.content;
    }
  }

  /**
   * Render initial HTML structure
   */
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --text-muted: #9ca3af;
          --surface-0: #ffffff;
          --surface-1: #f9fafb;
          --border: #e5e7eb;
          --code-bg: #f3f4f6;
          --code-text: #dc2626;
          --link-color: #2563eb;
          --link-hover: #1d4ed8;
        }

        :host(.dark) {
          --text-primary: #f3f4f6;
          --text-secondary: #d1d5db;
          --text-muted: #9ca3af;
          --surface-0: #111827;
          --surface-1: #1f2937;
          --border: #374151;
          --code-bg: #1f2937;
          --code-text: #f87171;
          --link-color: #60a5fa;
          --link-hover: #93c5fd;
        }

        * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        :host {
          display: block;
          background: var(--surface-0);
          color: var(--text-primary);
          min-height: 100vh;
        }

        .container {
          max-width: 56rem;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .date {
          font-size: 0.875rem;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .date:empty {
          display: none;
        }

        .content {
          line-height: 1.7;
          font-size: 16px;
        }

        .content .icon {
          margin-right: 0.5rem;
        }

        .content > p {
          margin: 0 0 1.5rem;
          color: var(--text-primary);
        }

        .content h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 2rem 0 1rem;
          color: var(--text-primary);
        }

        .content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem;
          color: var(--text-primary);
        }

        .content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1.25rem 0 0.5rem;
          color: var(--text-primary);
        }

        .content a {
          color: var(--link-color);
          text-decoration: none;
          border-bottom: 1px solid currentColor;
          transition: color 0.2s ease;
        }

        .content a:hover {
          color: var(--link-hover);
        }

        .content strong {
          font-weight: 600;
          color: var(--text-primary);
        }

        .content em {
          font-style: italic;
          color: var(--text-secondary);
        }

        .content code {
          background: var(--code-bg);
          color: var(--code-text);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
        }

        .content pre {
          background: var(--code-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }

        .content pre code {
          background: none;
          color: var(--text-secondary);
          padding: 0;
          border-radius: 0;
          font-size: 0.9em;
          line-height: 1.5;
        }

        .content ul,
        .content ol {
          margin: 1.5rem 0 1.5rem 2rem;
          color: var(--text-primary);
        }

        .content li {
          margin: 0.5rem 0;
          color: var(--text-secondary);
        }

        .content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5rem 0;
          border: 1px solid var(--border);
        }

        .loading {
          color: var(--text-muted);
          font-style: italic;
          padding: 2rem;
          text-align: center;
        }

        .error {
          background: #fee2e2;
          color: #991b1b;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid #dc2626;
          margin: 1rem 0;
        }

        :host(.dark) .error {
          background: #7f1d1d;
          color: #fecaca;
          border-left-color: #ef4444;
        }

        @media (max-width: 640px) {
          .container {
            padding: 1rem;
          }

          .content h1 {
            font-size: 1.5rem;
          }

          .content h2 {
            font-size: 1.25rem;
          }

          .content {
            font-size: 15px;
          }
        }
      </style>

      <div class="container">
        <div class="date"></div>
        <div class="content">
          <p class="loading">Loading digest...</p>
        </div>
      </div>
    `;
  }
}

// Register the web component
customElements.define('digest-renderer', DigestRenderer);
