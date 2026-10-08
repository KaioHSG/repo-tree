// sequential loader
(function() {
  var BASE = typeof document !== 'undefined' && document.currentScript
    ? document.currentScript.src.replace(/[^/]*$/, '')
    : 'src/';
  var scripts = [
    BASE + 'style.js',
    BASE + 'helper.js',
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