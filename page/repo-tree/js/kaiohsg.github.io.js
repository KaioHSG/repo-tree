// kaiohsg.github.io — per-repo custom JS (roda após o render)
// Anima o contador de visitantes fake e aplica .emoji-plain nos
// emojis dos títulos (h1–h6) e do restante do README, removendo o
// text-shadow neon dos glifos coloridos (mesmo efeito do home).

(function(UI, CONFIG, repoName, repoUrl) {
  var c = document.getElementById('counter');
  if (c) {
    c.textContent = String(
      document.referrer
        ? Math.floor(43000 + Math.random() * 12000)
        : Math.floor(42000 + Math.random() * 9000)
    ).padStart(6, '0');
  }

  // Ranges de emoji compatíveis com ES6+ (sem \p{}, que quebrava o
  // new Function em navegadores antigos e impedia o embrulho inteiro).
  var EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}]\u{FE0F}?(?:\u{200D}[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}]\u{FE0F}?)*/gu;

  function wrapTextNode(node) {
    var text = node.nodeValue || '';
    var last = 0;
    var m;
    var frag = null;
    EMOJI.lastIndex = 0;
    while ((m = EMOJI.exec(text)) !== null) {
      if (!frag) frag = document.createDocumentFragment();
      if (m.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      }
      var span = document.createElement('span');
      span.className = 'emoji-plain';
      span.textContent = m[0];
      frag.appendChild(span);
      last = m.index + m[0].length;
    }
    if (frag) {
      if (last < text.length) {
        frag.appendChild(document.createTextNode(text.slice(last)));
      }
      node.parentNode.replaceChild(frag, node);
    }
  }

  // Percorre todos os nós de texto (inclui os de h1–h6), pulando
  // código e spans que já foram embrulhados (idempotente).
  function wrap(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        var el = node.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        if (el.closest('pre, code, .emoji-plain')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(wrapTextNode);
  }

  var content = document.getElementById('markdown-content');
  if (!content) return;

  // Títulos primeiro (alvo principal), depois todo o conteúdo.
  [].forEach.call(content.querySelectorAll('h1, h2, h3, h4, h5, h6'), wrap);
  wrap(content);
})(UI, CONFIG, repoName, repoUrl);