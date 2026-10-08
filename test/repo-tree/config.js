const USER = 'KaioHSG';
const GITHUB_API = 'https://api.github.com';
const RAW_BASE = 'https://raw.githubusercontent.com/' + USER;

const CONFIG = {
  base: 'repo-tree/',
  allowedRepos: [],
  excludeRepos: [],
  allowedExtensions: [],
  excludeExtensions: [],
  highlightTheme: 'github',
  extensionToLang: {
    '.json': 'json', '.sh': 'bash', '.yml': 'yaml', '.yaml': 'yaml',
    '.css': 'css', '.js': 'javascript', '.ts': 'typescript', '.html': 'html',
    '.py': 'python', '.rb': 'ruby', '.php': 'php', '.java': 'java',
    '.c': 'c', '.cpp': 'cpp', '.cs': 'csharp', '.go': 'go', '.rs': 'rust',
    '.swift': 'swift', '.kt': 'kotlin', '.sql': 'sql', '.xml': 'xml',
    '.svg': 'xml', '.toml': 'toml', '.ini': 'ini', '.cfg': 'ini',
    '.conf': 'ini', '.env': 'bash', '.gitignore': 'gitignore',
    '.dockerfile': 'dockerfile', '.md': 'markdown'
  }
};

const SORT_OPTIONS = [
  { value: 'updated', label: 'Recent' },
  { value: 'stars', label: 'Most stars' },
  { value: 'forks', label: 'Most forks' },
  { value: 'name', label: 'Name A–Z' },
];

const UI = {
  siteName: 'Architect’s Sketchbook',
  searchPlaceholder: 'type to filter…',
  allLanguages: 'All languages',

  repoStarsIcon: '★ ',
  repoForksIcon: '⑂ ',
  noDescription: '<em>No description.</em>',

  showReadme: '← Show README',
  openOnGitHub: 'Open on GitHub →',

  filePathLabel: 'File',
  copiedClone: '✓ Copied',
  errorClone: '✗ Error',
  copyIcon: '📋',
  copyOk: '✓',
  copyFail: '✗',
  anchorIcon: '¶',

  shields: { style: 'flat-square' },

  noReposFound: 'No repositories match your filters.',
  fileNotFound: 'This file was not found in the repository.',
  loading: 'Loading…',
  errorLoad: 'Could not load repositories. Try again later.',
  errorRateLimited: 'GitHub API rate limit exceeded. Please try again later.',
  errorRepoNotFound: (name) => 'Repository "' + name + '" not found.',
  errorLoading: (name, msg) => 'Error loading "' + name + '": ' + (msg || 'unknown'),
  blockedAllowed: (exts) => 'Only ' + exts.join(', ') + ' files can be viewed.',
  blockedExcluded: (ext) => 'File type ' + ext + ' is excluded.',
  blockedTitle: (repo) => repo + ' — blocked',

  untaggedRelease: '(untagged)',

  repoCount: (n, total) => n + ' / ' + total + ' repos',
};

let currentBranch = 'main';
let currentRepo = null;
let currentFile = null;