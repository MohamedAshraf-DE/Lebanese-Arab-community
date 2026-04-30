/**
 * Frontend API configuration.
 *
 * Local Node backend on port 3000:
 *   http://localhost:3000
 *
 * GitHub Pages / static hosting cannot run Node.js. After deploying the
 * backend separately, configure its URL with one of:
 *   window.JALITUNA_API_BASE = 'https://your-api.example.com'
 *   <meta name="jalituna-api-base" content="https://your-api.example.com">
 *   localStorage.setItem('jalituna_api_base', 'https://your-api.example.com')
 *   login.html?api=https://your-api.example.com
 */
(function () {
  var DEFAULT_PRODUCTION_API = '';
  var DEFAULT_LOCAL_API = 'http://localhost:3000';

  function cleanBase(value) {
    return (value || '').trim().replace(/\/+$/, '');
  }

  var host = window.location.hostname;
  var port = window.location.port;
  var protocol = window.location.protocol;
  var isLocal = (host === 'localhost' || host === '127.0.0.1');
  var isFile = protocol === 'file:';
  var isGithubPages = /\.github\.io$/i.test(host);
  var meta = document.querySelector('meta[name="jalituna-api-base"]');
  var queryBase = '';
  var stored = '';

  try {
    var params = new URLSearchParams(window.location.search);
    queryBase = cleanBase(params.get('api') || params.get('apiBase') || '');
    if (queryBase) localStorage.setItem('jalituna_api_base', queryBase);
  } catch (e) {}

  try { stored = localStorage.getItem('jalituna_api_base') || ''; } catch (e) {}

  var explicit = cleanBase(
    window.JALITUNA_API_BASE ||
    (meta && meta.content) ||
    queryBase ||
    stored
  );

  var fallback = '';
  if (!explicit && (isFile || (isLocal && port && port !== '3000'))) {
    fallback = DEFAULT_LOCAL_API;
  } else if (!explicit && !isLocal) {
    fallback = DEFAULT_PRODUCTION_API;
  }

  var apiBase = explicit || fallback;

  window.JALITUNA_CONFIG = {
    apiBase: apiBase,
    needsExternalApi: isGithubPages && !apiBase
  };
}());
