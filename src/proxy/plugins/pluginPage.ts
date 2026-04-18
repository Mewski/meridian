/**
 * Plugins management page.
 * Shows all discovered plugins with their status, hooks, adapters, and errors.
 * Fetches /plugins/list client-side for live data; supports reload via POST /plugins/reload.
 */

import { profileBarCss, profileBarHtml, profileBarJs } from "../../telemetry/profileBar"

export const pluginPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Meridian \u2014 Plugins</title>
<style>
  :root {
    --bg: #0f0b1a; --surface: #1a1030; --surface2: #221840; --border: #2d2545;
    --text: #e0e7ff; --muted: #8b8aa0; --accent: #8b5cf6; --accent2: #6366f1;
    --green: #3fb950; --yellow: #d29922; --red: #f85149;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
         background: var(--bg); color: var(--text); line-height: 1.6; min-height: 100vh; }
  .container { max-width: 960px; margin: 0 auto; padding: 32px 24px; }

  .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--muted);
    text-decoration: none; font-size: 13px; margin-bottom: 24px; transition: color 0.15s; }
  .back-link:hover { color: var(--text); }

  .page-header { display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; margin-bottom: 6px; flex-wrap: wrap; }
  .page-header h1 { font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
  .tagline { color: var(--muted); font-size: 14px; margin-bottom: 28px; }

  .reload-btn { padding: 8px 18px; font-size: 13px; font-weight: 500;
    background: var(--surface2); color: var(--accent); border: 1px solid var(--accent);
    border-radius: 8px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .reload-btn:hover { background: rgba(139,92,246,0.15); }
  .reload-btn:disabled { opacity: 0.5; cursor: default; }
  .reload-btn.loading { opacity: 0.7; }

  .reload-status { font-size: 12px; color: var(--green); opacity: 0; transition: opacity 0.3s;
    margin-left: 8px; }
  .reload-status.show { opacity: 1; }
  .reload-status.error { color: var(--red); }

  .header-actions { display: flex; align-items: center; gap: 0; }

  .plugin-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; margin-bottom: 12px; transition: border-color 0.2s; }
  .plugin-card.status-error { border-color: rgba(248,81,73,0.4); }

  .plugin-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
    flex-wrap: wrap; }
  .plugin-name { font-size: 16px; font-weight: 600; }
  .plugin-version { font-size: 11px; color: var(--muted);
    font-family: 'SF Mono', SFMono-Regular, Consolas, monospace; }

  .status-badge { font-size: 10px; padding: 2px 9px; border-radius: 4px;
    text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .badge-active { background: rgba(63,185,80,0.15); color: var(--green);
    border: 1px solid rgba(63,185,80,0.3); }
  .badge-disabled { background: var(--surface2); color: var(--muted);
    border: 1px solid var(--border); }
  .badge-error { background: rgba(248,81,73,0.12); color: var(--red);
    border: 1px solid rgba(248,81,73,0.3); }

  .plugin-description { font-size: 13px; color: var(--muted); margin-bottom: 12px; }

  .plugin-meta { display: flex; gap: 20px; flex-wrap: wrap; font-size: 12px; }
  .meta-item { display: flex; align-items: center; gap: 6px; }
  .meta-label { color: var(--muted); text-transform: uppercase; font-size: 10px;
    letter-spacing: 0.5px; font-weight: 500; }
  .meta-value { color: var(--text);
    font-family: 'SF Mono', SFMono-Regular, Consolas, monospace; font-size: 11px; }

  .plugin-error-box { margin-top: 12px; padding: 10px 14px;
    background: rgba(248,81,73,0.08); border: 1px solid rgba(248,81,73,0.3);
    border-radius: 8px; font-size: 12px; color: var(--red);
    font-family: 'SF Mono', SFMono-Regular, Consolas, monospace; word-break: break-word; }

  .empty-state { text-align: center; padding: 56px 24px; color: var(--muted);
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
  .empty-state h2 { font-size: 16px; font-weight: 600; margin-bottom: 10px; color: var(--text); }
  .empty-state p { font-size: 13px; line-height: 1.7; }
  .empty-state code { font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
    font-size: 12px; background: var(--surface2); padding: 2px 7px;
    border-radius: 4px; color: #a78bfa; }

  .summary-bar { display: flex; gap: 16px; margin-bottom: 20px; font-size: 12px;
    color: var(--muted); }
  .summary-count strong { color: var(--text); font-weight: 600; }
  .summary-count.active strong { color: var(--green); }
  .summary-count.error strong { color: var(--red); }
` + profileBarCss + `
</style>
</head>
<body>
` + profileBarHtml + `
<div class="container">
  <a href="/" class="back-link">&#8592; Back to Meridian</a>

  <div class="page-header">
    <div>
      <h1>Plugins</h1>
    </div>
    <div class="header-actions">
      <button class="reload-btn" id="reloadBtn" onclick="reloadPlugins()">Reload Plugins</button>
      <span class="reload-status" id="reloadStatus"></span>
    </div>
  </div>
  <div class="tagline">Transform request and response behavior with composable plugins</div>

  <div id="content"><div style="color:var(--muted);padding:40px;text-align:center">Loading\u2026</div></div>
</div>

<script>
function esc(s) {
  if (s == null) return '';
  var d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

async function loadPlugins() {
  try {
    var res = await fetch('/plugins/list');
    var data = await res.json();
    render(data.plugins || []);
  } catch {
    document.getElementById('content').innerHTML =
      '<div class="empty-state"><h2>Could not load plugins</h2><p>Is Meridian running?</p></div>';
  }
}

async function reloadPlugins() {
  var btn = document.getElementById('reloadBtn');
  var status = document.getElementById('reloadStatus');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'Reloading\u2026';
  status.className = 'reload-status';
  status.textContent = '';
  try {
    var res = await fetch('/plugins/reload', { method: 'POST' });
    var data = await res.json();
    if (data.success) {
      status.textContent = '\u2713 Reloaded';
      status.className = 'reload-status show';
    } else {
      status.textContent = data.error || 'Reload failed';
      status.className = 'reload-status show error';
    }
    await loadPlugins();
  } catch {
    status.textContent = 'Reload failed';
    status.className = 'reload-status show error';
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = 'Reload Plugins';
    setTimeout(function() { status.className = 'reload-status'; }, 3000);
  }
}

function render(plugins) {
  if (!plugins.length) {
    document.getElementById('content').innerHTML =
      '<div class="empty-state">'
      + '<h2>No plugins found</h2>'
      + '<p>Drop <code>.ts</code> or <code>.js</code> files in <code>~/.config/meridian/plugins/</code> and reload.</p>'
      + '</div>';
    return;
  }

  var active = plugins.filter(function(p) { return p.status === 'active'; }).length;
  var disabled = plugins.filter(function(p) { return p.status === 'disabled'; }).length;
  var errors = plugins.filter(function(p) { return p.status === 'error'; }).length;

  var html = '<div class="summary-bar">'
    + '<span class="summary-count"><strong>' + plugins.length + '</strong> plugin' + (plugins.length !== 1 ? 's' : '') + '</span>'
    + '<span class="summary-count active"><strong>' + active + '</strong> active</span>';
  if (disabled) html += '<span class="summary-count"><strong>' + disabled + '</strong> disabled</span>';
  if (errors) html += '<span class="summary-count error"><strong>' + errors + '</strong> error' + (errors !== 1 ? 's' : '') + '</span>';
  html += '</div>';

  for (var i = 0; i < plugins.length; i++) {
    var p = plugins[i];
    var statusClass = p.status === 'active' ? 'badge-active' : p.status === 'error' ? 'badge-error' : 'badge-disabled';
    html += '<div class="plugin-card' + (p.status === 'error' ? ' status-error' : '') + '">';

    html += '<div class="plugin-card-header">';
    html += '<span class="plugin-name">' + esc(p.name) + '</span>';
    if (p.version) html += '<span class="plugin-version">v' + esc(p.version) + '</span>';
    html += '<span class="status-badge ' + statusClass + '">' + esc(p.status) + '</span>';
    html += '</div>';

    if (p.description) {
      html += '<div class="plugin-description">' + esc(p.description) + '</div>';
    }

    html += '<div class="plugin-meta">';
    var hooks = (p.hooks && p.hooks.length) ? p.hooks.join(', ') : '\u2014';
    html += '<div class="meta-item"><span class="meta-label">Hooks</span><span class="meta-value">' + esc(hooks) + '</span></div>';
    var adapters = (p.adapters && p.adapters.length) ? p.adapters.join(', ') : 'All adapters';
    html += '<div class="meta-item"><span class="meta-label">Adapters</span><span class="meta-value">' + esc(adapters) + '</span></div>';
    html += '</div>';

    if (p.status === 'error' && p.error) {
      html += '<div class="plugin-error-box">' + esc(p.error) + '</div>';
    }

    html += '</div>';
  }

  document.getElementById('content').innerHTML = html;
}

loadPlugins();
` + profileBarJs + `
</script>
</body>
</html>`
