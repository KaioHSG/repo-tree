// repo-tree.js — Per-repo arbitrary JavaScript
// Demonstra: JS customizado per-repo (recebe UI, CONFIG, repoName, repoUrl)
// Adiciona um pequeno rótulo com info do repositório no console

(function(repo, url) {
  var style = document.createElement('style');
  style.textContent =
    '#drafting-bar {' +
      'display:flex;align-items:center;gap:16px;' +
      'padding:4px 32px;' +
      'font-size:0.75rem;color:#5a6678;' +
      'background:#e6ebf2;' +
      'border-bottom:1px solid #bcc6d4;' +
      'font-family:inherit;' +
    '}' +
    '#drafting-project { font-weight:600;color:#2c4a78; }' +
    '#drafting-scale { color:#a8b2c0; }' +
    '#drafting-date { margin-left:auto;color:#a8b2c0; }';
  document.head.appendChild(style);

  console.log(
    '✏️  ' + repo + ' loaded via repo-tree custom JS\n' +
    '   ' + url + '\n' +
    '   Sketchbook theme active'
  );
})(repoName, repoUrl);