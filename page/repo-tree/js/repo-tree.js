// repo-tree.js — Per-repo JS (dramatic demo)
// Mostra JS customizado com stats, CDN copy, atalho

(function(repo, url) {
  // ── inject drafting table styles ──
  var s = document.createElement('style');
  s.textContent =
    '#dt-header{display:flex;align-items:center;justify-content:space-between;' +
    'max-width:960px;margin:0 auto 6px;padding:6px 36px;' +
    'background:#e6ebf2;border:2px solid #bcc6d4;border-radius:3px;}' +
    '#dt-title{display:flex;align-items:baseline;gap:8px;}' +
    '#dt-icon{font-size:1.4rem;line-height:1;}' +
    '#dt-project{font-weight:700;font-size:1.05rem;color:#1e2430;' +
    'font-family:\'Georgia\',serif;}' +
    '#dt-badge{font-size:0.65rem;color:#a8b2c0;text-transform:uppercase;' +
    'letter-spacing:0.05em;padding:1px 6px;border:1px solid #3a7c8c;' +
    'border-radius:2px;background:rgba(58,124,140,0.08);}' +
    '#dt-meta{display:flex;align-items:baseline;gap:10px;font-size:0.72rem;color:#a8b2c0;}' +
    '#dt-scale{color:#5a6678;}' +
    '#dt-date{color:#a8b2c0;}' +
    '#dt-author{font-weight:600;color:#2c4a78;}' +
    '#dt-version{display:inline-flex;align-items:center;gap:6px;' +
    'margin-left:8px;font-size:0.75rem;color:#5a6678;}' +
    '#dt-version code{font-family:monospace;font-size:0.82rem;color:#3a7c8c;' +
    'padding:1px 6px;border:1px solid #3a7c8c;border-radius:2px;}' +
    '#cdn-field{display:flex;gap:8px;align-items:center;margin:8px 0 12px;' +
    'padding:8px 12px;background:#fafcff;border:1px solid #c8d0dc;border-radius:3px;}' +
    '#cdn-field span{font-size:0.72rem;color:#a8b2c0;text-transform:uppercase;' +
    'letter-spacing:0.05em;margin-right:8px;}' +
    '#cdn-url{flex:1;font-family:monospace;font-size:0.78rem;color:#1e2430;' +
    'background:transparent;border:none;padding:4px 0;outline:none;}' +
    '#cdn-copy{font:inherit;font-size:0.72rem;padding:2px 10px;' +
    'background:#fafcff;border:1px solid #c8d0dc;border-radius:2px;' +
    'color:#1e2430;cursor:pointer;}' +
    '#cdn-copy:hover{background:#3a7c8c;color:#fff;}' +
    '#dt-footer{max-width:960px;margin:6px auto 0;' +
    'display:flex;align-items:center;justify-content:space-between;' +
    'padding:4px 36px;font-size:0.7rem;color:#a8b2c0;' +
    'border-top:2px solid #bcc6d4;}';
  document.head.appendChild(s);

  // ── set date ──
  var dateEl = document.getElementById('dt-date');
  if (dateEl) {
    var d = new Date();
    dateEl.textContent = d.toLocaleDateString('en-US',
      { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── version + CDN copy ──
  var ver = '0.1.2';
  var titleEl = document.getElementById('repo-title');
  if (titleEl) {
    var vBadge = document.createElement('span');
    vBadge.id = 'dt-version';
    vBadge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-left:8px;font-size:0.75rem;color:#5a6678;';
    vBadge.innerHTML = 'v<code style="font-family:monospace;font-size:0.82rem;color:#3a7c8c;padding:1px 6px;border:1px solid #3a7c8c;border-radius:2px;">' + ver + '</code>';
    titleEl.appendChild(vBadge);
  }

  var cdnInput = document.getElementById('cdn-url');
  var cdnBtn = document.getElementById('cdn-copy');
  if (cdnInput) {
    cdnInput.value = 'https://cdn.jsdelivr.net/gh/KaioHSG/repo-tree@' + ver + '/repo-tree.min.js';
  }
  if (cdnBtn && cdnInput) {
    cdnBtn.onclick = function() {
      try {
        navigator.clipboard.writeText(cdnInput.value);
        cdnBtn.textContent = 'copied';
        setTimeout(function() { cdnBtn.textContent = 'copy'; }, 2000);
      } catch (_) {}
    };
  }

  // ── keyboard shortcut: pressionar 'b' volta pra lista ──
  document.addEventListener('keydown', function(e) {
    if (e.key === 'b' && !e.ctrl && !e.meta && !e.alt) {
      var back = document.querySelector('#repo-view > p:last-child a[href="."]');
      if (back) back.click();
    }
  });

  console.log(
    '✏️  [' + repo + '] custom JS loaded\n' +
    '   ' + url + '\n' +
    '   drafting-table theme · press [b] to go back'
  );
})(repoName, repoUrl);