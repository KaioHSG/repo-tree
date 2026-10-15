# Repo Tree

A vanilla HTML/CSS/JS GitHub repository browser. Renders READMEs as Markdown, displays source files with syntax highlighting, lists releases, and supports per-repository customization via CSS, HTML, JS, and config.

[![Online Demo](https://img.shields.io/badge/Demo-Available_Here-blue?style=for-the-badge)](https://kaiohsg.dev/repo-tree/)

---

## Getting Started

### 1. Copy the template

Download the `Repo-Tree-Template.zip` folder to your static server (GitHub Pages, Netlify, Vercel, NGINX, etc).

That's all you need: the template loads `repo-tree.min.js` from a CDN, and the library is **self-sufficient** — syntax-highlighting languages and themes are fetched from the same CDN `highlight/` folder **on demand** (only the first time a language/theme is used). You keep no language files in your repo.

For a **fully local** setup, download `repo-tree.min.js` + `Highlight.zip` from the release and place `highlight/` next to `repo-tree.min.js` — the bundle auto-detects its own location, so no config is needed. (Override with `CONFIG.langBase` / `CONFIG.stylesBase` for custom paths.)

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
  highlightTheme: '1c-light', // highlight.js theme (from highlight/styles/)
  // langBase: 'repo-tree/highlight/langs/',   // optional: custom language modules path
  // stylesBase: 'repo-tree/highlight/styles/', // optional: custom theme path
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

Generates `repo-tree.min.js` plus the self-sufficient `highlight/` assets (`highlight/langs/` language modules and `highlight/styles/` highlight.js themes):

```bash
npm install
npm run build
```

Or via GitHub Actions: trigger the `Build & Tag Release` workflow manually. It regenerates `repo-tree.min.js` and the `highlight/` assets, commits them, creates the tag and a GitHub Release with `Repo-Tree-Template.zip`, `Highlight.zip` and the bundle.

> **Release note:** the tag must match `package.json`'s version (language/theme assets are served from the same CDN tag as the bundle). Update the version pins in `page/index.html` and `template/index.html` when releasing. The workflow commits `repo-tree.min.js` + `highlight/` itself — no need to pre-commit them.

---

## Requirements

- **Static HTTP server** (any will do)
- **Modern browser** (Chrome / Firefox / Edge 2020+, ES2020 with `?.`, `defer/async/await`)
- npm + Node.js 18+ (build only)

---

## Tech Stack

- HTML5 + CSS3
- JavaScript (vanilla, no frameworks)
- [marked.js](https://marked.js.org/) - Markdown renderer
- [highlight.js](https://highlightjs.org/) - syntax highlighting
- [shields.io](https://shields.io/) - badges
- [esbuild](https://esbuild.github.io/) - minification (build tool)