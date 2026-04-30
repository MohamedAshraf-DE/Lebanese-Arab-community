/**
 * Frontend API configuration.
 *
 * Local Node backend on port 3000:
 *   http://localhost:3000
 *
 * GitHub Pages / static hosting:
 *   set window.JALITUNA_API_BASE before this file, add
 *   <meta name="jalituna-api-base" content="https://your-api.example.com">,
 *   or change DEFAULT_PRODUCTION_API below after deploying the backend.
 */
(function () {
  var DEFAULT_PRODUCTION_API = 'https://jalituna-api.onrender.com';
  var host = window.location.hostname;
  var port = window.location.port;
  var isLocal = (host === 'localhost' || host === '127.0.0.1');
  var meta = document.querySelector('meta[name="jalituna-api-base"]');
  var stored = '';

  try { stored = localStorage.getItem('jalituna_api_base') || ''; } catch (e) {}

  var explicit =
    window.JALITUNA_API_BASE ||
    (meta && meta.content) ||
    stored;

  window.JALITUNA_CONFIG = {
    apiBase: explicit || (isLocal ? (port && port !== '3000' ? 'http://localhost:3000' : '') : DEFAULT_PRODUCTION_API)
  };
}());
