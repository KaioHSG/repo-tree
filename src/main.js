// sequential loader
(function() {
  var BASE = typeof document !== 'undefined' && document.currentScript
    ? document.currentScript.src.replace(/[^/]*$/, '')
    : 'src/';
  var scripts = [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.12.0/highlight.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.1/marked.min.js',
    BASE + 'style.js',
    BASE + 'helper.js',
    'repo-tree/config.js',
    BASE + 'utils.js',
    BASE + 'renderer.js',
    BASE + 'api.js',
    BASE + 'app.js'
  ];
  var i = 0;
  function next() {
    if (i >= scripts.length) return;
    var s = document.createElement('script');
    s.src = scripts[i++];
    s.onload = next;
    document.body.appendChild(s);
  }
  next();
})();