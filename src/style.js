// style loader
(function() {
  var style = document.createElement('style');
  style.textContent = '.hidden{display:none!important}' +
    '.filtered-out{display:none}' +
    '.code-block{position:relative}' +
    '.copy-btn{position:absolute;top:4px;right:4px;z-index:10;opacity:0}' +
    'pre:hover .copy-btn,.code-block:hover .copy-btn{opacity:1}' +
    '.heading-anchor{opacity:0}' +
    'h1:hover .heading-anchor,h2:hover .heading-anchor,h3:hover .heading-anchor,' +
    'h4:hover .heading-anchor,h5:hover .heading-anchor,h6:hover .heading-anchor{opacity:1}' +
    '.repo-meta>span:empty,.release-item>span:empty{display:none}'
  document.head.appendChild(style);
})();