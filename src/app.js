// repo list

async function loadRepoList() {
  try {
    const repos = await cachedApiGet('/users/' + USER + '/repos?per_page=100&sort=updated&type=owner');
    const grid = document.getElementById('repo-grid');
    const searchInput = document.getElementById('repo-search');
    const langSelect = document.getElementById('filter-lang');
    const sortSelect = document.getElementById('filter-sort');
    const countEl = document.getElementById('repo-count');

    // Save grid template children
    var gridTmpl = [];
    for (var c = grid.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1) gridTmpl.push(c);
    }
    grid.innerHTML = '';

    let shown = [];
    let langs = new Set();
    for (const repo of repos) {
      if (!isRepoShown(repo.name)) continue;
      const card = document.createElement('div');
      card.className = 'repo-card';
      card.dataset.name = repo.name.toLowerCase();
      card.dataset.desc = (repo.description || '').toLowerCase();
      card.dataset.lang = (repo.language || '').toLowerCase();
      card.dataset.stars = repo.stargazers_count || 0;
      card.dataset.forks = repo.forks_count || 0;
      card.dataset.updated = repo.updated_at || '';
      if (repo.language) langs.add(repo.language);

      // Clone template and fill
      for (var i = 0; i < gridTmpl.length; i++) {
        var clone = gridTmpl[i].cloneNode(true);
        if (clone.classList.contains('repo-name')) {
          var a = clone;
          a.href = './?' + encodeURIComponent(repo.name);
          a.textContent = repo.name;
        } else if (clone.classList.contains('repo-desc')) {
          clone.innerHTML = repo.description ? escapeHtml(repo.description) : UI.noDescription;
        } else if (clone.classList.contains('repo-meta')) {
          var langSpan = clone.querySelector('.repo-lang');
          if (langSpan) langSpan.textContent = repo.language || '';
          var starsSpan = clone.querySelector('.repo-stars');
          if (starsSpan) starsSpan.innerHTML = repo.stargazers_count > 0 ? UI.repoStarsIcon + repo.stargazers_count : '';
          var forksSpan = clone.querySelector('.repo-forks');
          if (forksSpan) forksSpan.innerHTML = repo.forks_count > 0 ? UI.repoForksIcon + repo.forks_count : '';
          var dateSpan = clone.querySelector('.repo-update');
          if (dateSpan) dateSpan.textContent = repo.updated_at
            ? new Date(repo.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : '';
        }
        card.appendChild(clone);
      }
      card.dataset.all = card.textContent.toLowerCase();
      grid.appendChild(card);
      shown.push({ card, repo });
    }

    langSelect.innerHTML = '<option value="">' + UI.allLanguages + '</option>';
    [...langs].sort().forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.toLowerCase();
      opt.textContent = l;
      langSelect.appendChild(opt);
    });

    sortSelect.innerHTML = '';
    SORT_OPTIONS.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      sortSelect.appendChild(opt);
    });

    function doFilter() {
      const q = searchInput.value.toLowerCase().trim();
      const langVal = langSelect.value;
      const sortVal = sortSelect.value;

      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (langVal) params.set('lang', langVal);
      if (sortVal && sortVal !== 'updated') params.set('sort', sortVal);
      const newUrl = window.location.pathname + (params.toString() ? '?' + params : '');
      history.replaceState(null, '', newUrl);

      let filtered = shown.filter(({ card, repo }) => {
        if (!isRepoShown(repo.name)) return false;
        if (q && !card.dataset.all.includes(q)) return false;
        if (langVal && card.dataset.lang !== langVal) return false;
        return true;
      });

      filtered.sort((a, b) => {
        if (sortVal === 'stars') return b.card.dataset.stars - a.card.dataset.stars;
        if (sortVal === 'forks') return b.card.dataset.forks - a.card.dataset.forks;
        if (sortVal === 'name') return a.card.dataset.name.localeCompare(b.card.dataset.name);
        return b.card.dataset.updated.localeCompare(a.card.dataset.updated);
      });

      for (const { card } of shown) card.classList.add('filtered-out');
      for (const { card } of filtered) {
        card.classList.remove('filtered-out');
        grid.appendChild(card);
      }

      countEl.textContent = UI.repoCount(filtered.length, shown.length);
      countEl.classList.remove('hidden');
    }

    const params = getParams();
    if (params.q) searchInput.value = params.q;
    if (params.lang) { const opt = [...langSelect.options].find(o => o.value === params.lang); if (opt) langSelect.value = params.lang; }
    if (params.sort) { const opt = [...sortSelect.options].find(o => o.value === params.sort); if (opt) sortSelect.value = params.sort; }

    var filterTimer = null;
    function scheduleFilter() {
      if (filterTimer) clearTimeout(filterTimer);
      filterTimer = setTimeout(doFilter, 150);
    }

    searchInput.oninput = scheduleFilter;
    langSelect.onchange = doFilter;
    sortSelect.onchange = doFilter;
    doFilter();

    if (shown.length === 0) {
      grid.innerHTML = p('empty-state', UI.noReposFound);
      countEl.classList.add('hidden');
    }

    show('repo-list');
  } catch (e) {
    showError(UI.errorLoad);
  }
}

// repo view

// per-repo helpers

async function loadRepoConfigJS(repoName) {
  var resp = await fetch(CONFIG.base + 'js/' + encodeURIComponent(repoName) + '.cfg.js?t=' + Date.now());
  if (!resp.ok) return;
  var code = await resp.text();
  if (!code.trim()) return;
  try {
    var _ui = {}, _config = {};
    new Function('_ui', '_config', code)(_ui, _config);
    Object.assign(UI, _ui);
    Object.assign(CONFIG, _config);
  } catch (_) {}
}

async function loadRepoHTML(repoName) {
  var resp = await fetch(CONFIG.base + 'html/' + encodeURIComponent(repoName) + '.html?t=' + Date.now());
  if (!resp.ok) return null;
  var html = await resp.text();
  return html.trim() || null;
}

async function loadRepoCustomJS(repoName, repoUrl) {
  var resp = await fetch(CONFIG.base + 'js/' + encodeURIComponent(repoName) + '.js?t=' + Date.now());
  if (!resp.ok) return;
  var code = await resp.text();
  if (!code.trim()) return;
  try {
    new Function('UI', 'CONFIG', 'repoName', 'repoUrl', code)(UI, CONFIG, repoName, repoUrl);
  } catch (_) {}
}

function loadHighlightTheme() {
  var theme = CONFIG.highlightTheme || 'default';
  var id = 'hljs-theme';
  var existing = document.getElementById(id);
  if (existing) {
    existing.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.12.0/styles/' + theme + '.min.css';
    return;
  }
  var link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.12.0/styles/' + theme + '.min.css';
  document.head.appendChild(link);
}

// content helpers

async function fetchContent(repoName, fileName) {
  var content = null;
  var actualFile = fileName;
  if (!actualFile) {
    var candidates = CONFIG.allowedExtensions.length > 0 ? CONFIG.allowedExtensions : ['.md', '.txt', '.markdown'];
    for (var i = 0; i < candidates.length; i++) {
      var ext = candidates[i];
      var candidate = 'README' + ext;
      try {
        content = await rawFetch(RAW_BASE + '/' + encodeURIComponent(repoName) + '/' + currentBranch + '/' + candidate);
        actualFile = candidate;
        break;
      } catch (_) {}
    }
  } else {
    try {
      var path = actualFile.replace(/\\/g, '/').split('/').map(function(s) { return encodeURIComponent(s); }).join('/');
      content = await rawFetch(RAW_BASE + '/' + encodeURIComponent(repoName) + '/' + currentBranch + '/' + path);
    } catch (_) { content = null; }
  }
  if (!content) return null;
  return { content: content, file: actualFile };
}

function renderContent(el, content, file, repoName, branch) {
  var dot = file.lastIndexOf('.');
  var ext = dot !== -1 ? file.substring(dot).toLowerCase() : '';
  var isMd = ext === '.md';

  if (isMd) {
    el.innerHTML = marked.parse(content, { renderer: createRenderer(repoName, branch, file) });
  } else {
    var lang = getLangForExtension(file);
    el.innerHTML = h('pre', null, h('code', 'language-' + lang, escapeHtml(content)));
  }
  try { el.querySelectorAll('pre code').forEach(function(e) { hljs.highlightElement(e); }); } catch (_) {}

  var U = UI;
  el.querySelectorAll('pre').forEach(function(pre) {
    if (pre.parentElement?.classList.contains('code-block')) return;
    var wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = U.copyIcon;
    btn.onclick = async function() {
      try {
        await navigator.clipboard.writeText(pre.querySelector('code')?.textContent || pre.textContent);
        btn.textContent = U.copyOk;
        setTimeout(function() { btn.textContent = U.copyIcon; }, 2000);
      } catch (_) {
        btn.textContent = U.copyFail;
        setTimeout(function() { btn.textContent = U.copyIcon; }, 2000);
      }
    };
    pre.parentElement.insertBefore(wrapper, pre);
    wrapper.appendChild(btn);
    wrapper.appendChild(pre);
  });

  el.querySelectorAll('.heading-anchor').forEach(function(a) {
    a.onclick = function(e) {
      e.preventDefault();
      scrollToHeading(a.dataset.slug, a.dataset.url);
    };
  });
}

function renderContentNotFound(el, fileName, repoUrl) {
  var displayName = fileName || 'README';
  el.innerHTML = p('not-found-message', UI.fileNotFound, h('br'),
    anchor(repoUrl, 'not-found-link', UI.openOnGitHub));
}

function showFilepath(el, file) {
  if (!el || !file) return;
  el.textContent = '/' + file;
  el.classList.remove('hidden');
}

async function loadRepoView(repoName, fileName) {
  if (!isRepoShown(repoName)) {
    showError(UI.errorRepoNotFound(escapeHtml(repoName)));
    return;
  }

  currentRepo = repoName;
  currentFile = fileName;

  show('loading');

  var header = document.getElementById('repo-header');
  var titleEl = document.getElementById('repo-title');
  var actionsEl = document.getElementById('repo-actions');
  var releaseSection = document.getElementById('releases');
  var releaseList = document.getElementById('release-list');
  var contentEl = document.getElementById('markdown-content');
  var fpEl = document.getElementById('repo-filepath');
  var releaseTmpl = releaseList.querySelector('.release-item');
  var releaseTmplHTML = releaseTmpl ? releaseTmpl.outerHTML : '';

  if (titleEl) titleEl.textContent = repoName;
  releaseList.innerHTML = '';
  contentEl.innerHTML = '';
  if (fpEl) fpEl.classList.add('hidden');
  releaseSection.classList.add('hidden');

  if (fileName && (!isFileAllowed(fileName) || isFileExcluded(fileName))) {
    let reason = '';
    if (!isFileAllowed(fileName) && CONFIG.allowedExtensions.length > 0) {
      reason = UI.blockedAllowed(CONFIG.allowedExtensions);
    }
    if (isFileExcluded(fileName)) {
      reason = UI.blockedExcluded(fileName.substring(fileName.lastIndexOf('.')).toLowerCase());
    }
    contentEl.innerHTML = p('blocked-message', reason, h('br'), anchor('./?' + encodeURIComponent(repoName), '', UI.showReadme));
    titleEl.textContent = UI.blockedTitle(repoName);
    show('repo-view');
    return;
  }

  try {
    const repo = await cachedApiGet('/repos/' + USER + '/' + encodeURIComponent(repoName));
    currentBranch = repo.default_branch || 'main';
    document.title = repoName + ' - ' + UI.siteName;

    await loadRepoCSS(repoName);
    await loadRepoConfigJS(repoName);
    loadHighlightTheme();

    const repoUrl = repo.html_url || 'https://github.com/' + USER + '/' + repoName;
    const cloneUrl = repo.clone_url || repoUrl + '.git';

    // Load custom HTML first, then re-query elements
    var customHTML = await loadRepoHTML(repoName);
    if (customHTML) {
      document.getElementById('container').innerHTML = customHTML;
    }

    titleEl = document.getElementById('repo-title');
    actionsEl = document.getElementById('repo-actions');
    contentEl = document.getElementById('markdown-content');
    releaseSection = document.getElementById('releases');
    releaseList = document.getElementById('release-list');
    header = document.getElementById('repo-header');
    fpEl = document.getElementById('repo-filepath');
    if (releaseList && !releaseList.querySelector('.release-item') && releaseTmplHTML) {
      releaseList.innerHTML = releaseTmplHTML;
    }

    if (titleEl) titleEl.innerHTML = anchor('./?' + encodeURIComponent(repoName), 'repo-title-link', escapeHtml(repoName));

    if (actionsEl) {
      var ghLink = actionsEl.querySelector('#view-github');
      if (ghLink) ghLink.href = repoUrl;
      var zipLink = actionsEl.querySelector('#download-zip');
      if (zipLink) zipLink.href = repoUrl + '/archive/refs/heads/' + currentBranch + '.zip';
      var cloneBtn = actionsEl.querySelector('#clone-url');
      if (cloneBtn) {
        cloneBtn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(cloneUrl);
            cloneBtn.textContent = UI.copiedClone;
            setTimeout(() => { cloneBtn.textContent = '🐑 Clone URL'; }, 2000);
          } catch (_) {
            cloneBtn.textContent = UI.errorClone;
            setTimeout(() => { cloneBtn.textContent = '🐑 Clone URL'; }, 2000);
          }
        };
      }
    }

    if (header && repo.description) {
      var existingDesc = header.querySelector('.repo-desc');
      if (existingDesc) existingDesc.remove();
      var d = document.createElement('p');
      d.className = 'repo-desc';
      d.textContent = repo.description;
      header.appendChild(d);
    }

    // releases
    if (releaseSection && releaseList) {
      try {
        const releases = await cachedApiGet('/repos/' + USER + '/' + encodeURIComponent(repoName) + '/releases?per_page=5');
        if (releases && releases.length > 0) {
          releaseSection.classList.remove('hidden');
          const releasesHref = './?' + encodeURIComponent(repoName) + (currentFile ? '/' + encodeURIComponent(currentFile) : '') + '#releases';
          var relBtn = releaseSection.querySelector('#release-heading');
          if (relBtn) {
            relBtn.onclick = (e) => {
              e.preventDefault();
              if (releaseSection) releaseSection.scrollIntoView({ behavior: 'smooth' });
              history.replaceState(null, '', releasesHref);
            };
          }

          var tmpl = releaseList.querySelector('.release-item');
            if (tmpl) {
              releaseList.innerHTML = '';
              for (const rel of releases) {
                var item = tmpl.cloneNode(true);
                item.removeAttribute('id');
                var tag = item.querySelector('.release-tag');
                if (tag) { tag.href = rel.html_url || '#'; tag.textContent = rel.tag_name || ''; }
                var nameEl = item.querySelector('.release-name');
                if (nameEl) nameEl.textContent = rel.name || rel.tag_name || UI.untaggedRelease;
                var dateEl = item.querySelector('.release-date');
                if (dateEl) dateEl.textContent = rel.published_at
                  ? new Date(rel.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  : '';
                var assetsEl = item.querySelector('.release-assets');
                if (assetsEl) {
                  assetsEl.innerHTML = '';
                  if (rel.assets && rel.assets.length > 0) {
                    assetsEl.innerHTML = rel.assets.map(function(asset) {
                      return h('a', { href: asset.browser_download_url, class: 'release-asset-link', download: '' }, escapeHtml(asset.name));
                    }).join('');
                  }
                }
                releaseList.appendChild(item);
              }
            }

          var rh = releaseSection.querySelector('#release-heading');
          if (rh) { rh.href = repoUrl + '/releases'; rh.target = '_blank'; rh.rel = 'noopener'; }
        }
      } catch (_) {}
      if (releaseSection.classList.contains('hidden')) {
        var hiddenBtn = document.querySelector('#repo-actions a[href="#releases"]');
        if (hiddenBtn) hiddenBtn.classList.add('hidden');
      }
    }

    if (window.location.hash === '#releases' && releaseSection) {
      setTimeout(() => releaseSection.scrollIntoView({ behavior: 'smooth' }), 100);
    }

    // content rendering
    if (customHTML) {
      if (contentEl) {
        var content = await fetchContent(repoName, fileName);
        if (content) { renderContent(contentEl, content.content, content.file, repoName, currentBranch); showFilepath(fpEl, content.file); }
        else renderContentNotFound(contentEl, fileName, repoUrl);
      }
    } else {
      if (contentEl) {
        var content = await fetchContent(repoName, fileName);
        if (content) { renderContent(contentEl, content.content, content.file, repoName, currentBranch); showFilepath(fpEl, content.file); }
        else renderContentNotFound(contentEl, fileName, repoUrl);
      }
    }

    await loadRepoCustomJS(repoName, repoUrl);
    show('repo-view');
  } catch (e) {
    if (e.message === 'RATE_LIMITED') showError(UI.errorRateLimited);
    else if (e.message === 'NOT_FOUND') showError(UI.errorRepoNotFound(escapeHtml(repoName)));
    else showError(UI.errorLoading(escapeHtml(repoName), e.message));
  }
}

// entry point

async function loadContent() {
  const params = getParams();
  if (params.repo) {
    await loadRepoView(params.repo, params.file);
  } else {
    await loadRepoList();
  }
}

loadContent();
window.addEventListener('popstate', loadContent);