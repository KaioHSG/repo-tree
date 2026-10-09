# Repo Tree

[![Online Demo](https://img.shields.io/badge/Demo-Available_Here-blue?style=for-the-badge)](https://kaiohsg.dev/repo-tree/)

A vanilla HTML/CSS/JS GitHub repository browser. Renders READMEs as Markdown, displays source files with syntax highlighting, lists releases, and supports per-repository customization via CSS, HTML, JS, and config.

---

## Getting Started

### 1. Copy the template

Download the `Repo-Tree-Template.zip` folder to your static server (GitHub Pages, Netlify, Vercel, NGINX, etc).

### 2. Edit config.js

Edit `template/repo-tree/config.js`:

```js
const USER = 'your-username';
const CONFIG = {
  base: 'repo-tree/',         // base path for per-repo assets
  allowedRepos: [],           // [] = all; ["repo1","repo2"]
  excludeRepos: [],           // repos hidden from listing
  allowedExtensions: ['.md', '.txt'],
  excludeExtensions: [],
  highlightTheme: '1c-light', // highlight.js theme
  extensionToLang: { '.md': 'markdown', '.js': 'javascript', ... }
};
const UI = {
  siteName: 'My Site',
  // ... all visible strings
};
```

### 3. Serve

```
https://yoursite.com/              → repository list
https://yoursite.com/?repo         → view a repository
https://yoursite.com/?repo/file    → view a specific file
```

---

---

## Per-repo customization

For a repo named `my-repo`, create files under `template/repo-tree/`:

### CSS (`css/`)

| File | Effect |
|---|---|
| `css/my-repo.std.css` | Replaces the global theme **entirely**. Removes `style.css` and applies only this one. |
| `css/my-repo.css` | Adds styles **on top** of the global theme (override). |

### HTML (`html/`)

| File | Effect |
|---|---|
| `html/my-repo.html` | Replaces the entire `#container` when viewing that repo. May include or omit standard elements (`#repo-title`, `#markdown-content`, `#releases`, etc). |

### JS (`js/`)

| File | Access to | Use case |
|---|---|---|
| `js/my-repo.cfg.js` | `_ui`, `_config` | Overrides properties via `Object.assign`. Example: `_ui.shields = { style: 'plastic' }` |
| `js/my-repo.js` | `UI`, `CONFIG`, `repoName`, `repoUrl` | Arbitrary code: DOM manipulation, console output, API calls. |

### Full example

```css
/* css/my-repo.std.css */
body { background: linear-gradient(135deg, #0f0c29, #1a0a2e); }
```

```js
// js/my-repo.cfg.js
_ui.shields = { style: 'flat', color: '00cec9' };
_config.highlightTheme = 'atom-one-dark';
```

```js
// js/my-repo.js
UI.siteName = 'Custom Title';
console.log('Loaded ' + repoName);
```

---

## URL formats

Short form (for file viewing inside a repository):

```
/?repo                 → repository page
/?repo/README.md       → specific file
/?repo/src/main.js     → file in subdirectory
```

Long form (for filter query params on the listing page):

```
/?q=term&lang=javascript&sort=stars
```

---

## Building (minifying)

Generates `repo-tree.min.js`:

```bash
npm install
npm run build
```

Or via GitHub Actions: trigger the `Build & Tag Release` workflow manually. It creates the bundle, a git tag, a template zip, and a GitHub Release with attached artifacts.

---

## Requirements

- **Static HTTP server** (any will do)
- **Modern browser** (Chrome / Firefox / Edge 2020+, ES2020 with `?.`, `defer/async/await`)
- npm + Node.js 18+ (build only)

---

## Tech Stack

- HTML5 + CSS3
- JavaScript (vanilla, no frameworks)
- [marked.js](https://marked.js.org/) — Markdown renderer
- [highlight.js](https://highlightjs.org/) — syntax highlighting
- [shields.io](https://shields.io/) — badges
- [esbuild](https://esbuild.github.io/) — minification (build tool)