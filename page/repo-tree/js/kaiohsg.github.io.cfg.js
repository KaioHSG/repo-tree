// kaiohsg.github.io - per-repo config override (tema Y2K do home)
// Mesmos textos e frescuras do meu site, aplicados no repo-tree.

_ui.showReadme = '← Ver README';
_ui.openOnGitHub = 'Ver no GitHub →';

_ui.filePathLabel = 'Arquivo';
_ui.copiedClone = '✔ Copiado';
_ui.errorClone = '❌ Deu ruim';
_ui.copyIcon = '📋';
_ui.copyOk = '✔';
_ui.copyFail = '❌';
_ui.anchorIcon = '👉';

_ui.shields = { style: 'flat-square' };

_ui.noReposFound = 'Nenhum repo bate com o filtro.';
_ui.fileNotFound = 'Esse arquivo não existe. Ou foi pro mundo. 👻';
_ui.loading = 'CARREGANDO... 🚀';
_ui.errorLoad = 'NÃO CONSEGUI CARREGAR OS REPOS. TENTA DE NOVO!';
_ui.errorRateLimited = 'Limite da API do GitHub estourado. Volta mais tarde!';
_ui.errorRepoNotFound = function(repo) {
  return 'O REPO "' + repo + '" NÃO EXISTE!';
};
_ui.errorLoading = function(repo, msg) {
  return 'Erro ao carregar "' + repo + '": ' + (msg || 'desconhecido');
};
_ui.blockedAllowed = function(exts) {
  return 'Aqui só dá pra ver ' + exts.join(', ') + '. O resto é segredo.';
};
_ui.blockedExcluded = function(ext) {
  return 'Arquivo ' + ext + '? EXCLUÍDO. HA!';
};
_ui.blockedTitle = function(repo) {
  return repo + ' (arquivo restrito)';
};

_ui.untaggedRelease = '(sem tag)';

_ui.repoCount = function(n, total) {
  return n + ' / ' + total + ' repos';
};

_config.highlightTheme = 'far';
_config.allowedExtensions = ['.md', '.html', '.css', '.js', '.json', '.txt'];