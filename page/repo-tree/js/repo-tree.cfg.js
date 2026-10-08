// repo-tree.cfg.js — Per-repo config override (dramatic demo)
// Demonstra: alterar UI text, tema highlight, extensões, etc.

_ui.siteName = 'repo-tree · blueprint';

_ui.noDescription = '— blueprint project —';
_ui.noReposFound = 'no repos match the filter';
_ui.repoCount = function(n, total) {
  return n + ' of ' + total + ' blueprints';
};

_ui.anchorIcon = '📐';

_ui.shields = {
  style: 'flat-square',
  color: '3a7c8c'
};

_ui.copyIcon = '📋';
_ui.copyOk = '✓';
_ui.copyFail = '✗';

_ui.errorLoad = 'Failed to load blueprint data.';
_ui.errorLoading = function(repo, msg) {
  return 'Error loading "' + repo + '": ' + msg +
    '<br>Please report this to the drafting board.';
};
_ui.errorRepoNotFound = function(repo) {
  return 'Blueprint "' + repo + '" not found in the archive.';
};

_config.highlightTheme = 'github';

_config.allowedExtensions = ['.md', '.txt', '.markdown', '.js', '.css', '.html', '.json', '.yml', '.yaml', '.sh'];

_ui.fileNotFound = 'This blueprint page is missing.';
_ui.openOnGitHub = 'View original on GitHub →';
_ui.showReadme = 'Show README';

_ui.blockedAllowed = function(exts) {
  return 'This file type is not part of the blueprint set (' + exts.join(', ') + ').';
};
_ui.blockedExcluded = function(ext) {
  return 'Blueprints with extension "' + ext + '" are excluded from the plan.';
};
_ui.blockedTitle = function(repo) {
  return repo + ' (restricted file)';
};