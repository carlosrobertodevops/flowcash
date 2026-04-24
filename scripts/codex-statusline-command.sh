#!/bin/sh
# Codex terminal statusline. Reads latest ~/.codex/sessions JSONL.

node <<'JS'
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const home = os.homedir();
const sessionsRoot = path.join(home, '.codex', 'sessions');
const flagFile = path.join(home, '.claude', '.caveman-active');
const codexConfig = path.join(home, '.codex', 'config.toml');

function walk(dir) {
  let out = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) out = out.concat(walk(p));
      else if (entry.isFile() && entry.name.endsWith('.jsonl')) out.push(p);
    }
  } catch {}
  return out;
}

function fmtTokens(n) {
  n = Number(n || 0);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function fmtDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '--';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return h + 'h' + String(m).padStart(2, '0') + 'm';
  return m + 'm' + String(sec).padStart(2, '0') + 's';
}

function bar(pct) {
  const width = 20;
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)));
  const empty = width - filled;
  const color = pct >= 80 ? '\x1b[1;31m' : pct >= 50 ? '\x1b[1;33m' : '\x1b[1;32m';
  return color + '▰'.repeat(filled) + '\x1b[0;90m' + '▱'.repeat(empty) + '\x1b[0m';
}

function safeExec(cmd, args, opts = {}) {
  try {
    return cp.execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], ...opts }).trim();
  } catch {
    return '';
  }
}

const files = walk(sessionsRoot)
  .map((p) => ({ p, mtime: fs.statSync(p).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

const file = files[0]?.p;
let usage = null;
let contextUsage = null;
let started = null;
let model = 'Codex';
let cwd = process.cwd();
let windowSize = 0;

if (file) {
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line) continue;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    if (o.type === 'session_meta' && o.payload) {
      model = o.payload.model || model;
      cwd = o.payload.cwd || cwd;
      if (o.payload.timestamp) started = new Date(o.payload.timestamp).getTime();
    }
    if (o.type === 'event_msg' && o.payload?.type === 'task_started') {
      if (o.payload.started_at) started = o.payload.started_at * 1000;
      if (o.payload.model_context_window) windowSize = o.payload.model_context_window;
    }
    if (o.type === 'event_msg' && o.payload?.type === 'token_count' && o.payload.info) {
      usage = o.payload.info.total_token_usage || usage;
      contextUsage = o.payload.info.last_token_usage || contextUsage;
      windowSize = o.payload.info.model_context_window || windowSize;
    }
  }
}

if (model === 'Codex') {
  try {
    const match = fs.readFileSync(codexConfig, 'utf8').match(/^model\s*=\s*"([^"]+)"/m);
    if (match) model = match[1];
  } catch {}
}

const inTok = contextUsage?.input_tokens || usage?.input_tokens || 0;
const outTok = contextUsage?.output_tokens || usage?.output_tokens || 0;
const totalTok = contextUsage?.total_tokens || inTok + outTok;
const costInTok = usage?.input_tokens || inTok;
const costOutTok = usage?.output_tokens || outTok;
const pct = windowSize ? Math.round((totalTok / windowSize) * 100) : 0;
const dir = path.basename(cwd || process.cwd());
const user = os.userInfo().username;
const host = os.hostname().split('.')[0];

let git = '';
if (cwd && safeExec('git', ['-C', cwd, 'rev-parse', '--is-inside-work-tree']) === 'true') {
  const branch =
    safeExec('git', ['-C', cwd, '-c', 'gc.auto=0', 'symbolic-ref', '--short', 'HEAD']) ||
    safeExec('git', ['-C', cwd, '-c', 'gc.auto=0', 'rev-parse', '--short', 'HEAD']);
  const dirty = safeExec('git', ['-C', cwd, '-c', 'gc.auto=0', 'status', '--porcelain']);
  if (branch) git = ` | \x1b[1;33m${branch}${dirty ? ' *' : ''}\x1b[0m`;
}

let caveman = '';
try {
  const mode = fs.readFileSync(flagFile, 'utf8').trim().toUpperCase();
  if (mode && mode !== 'OFF') caveman = ` \x1b[38;5;172m[CAVEMAN${mode === 'FULL' ? '' : ':' + mode}]\x1b[0m`;
} catch {}

const start = started || (file ? fs.statSync(file).birthtimeMs : Date.now());
const duration = fmtDuration(Date.now() - start);
const ctxFmt = windowSize ? fmtTokens(windowSize) : '--';
const modelText = model.replace(/^gpt-/, 'GPT-');
const costUsd = ((costInTok / 1000000) * 3 + (costOutTok / 1000000) * 15).toFixed(4);
const costBrl = (Number(costUsd) * 5.7).toFixed(4);

process.stdout.write(`[ \x1b[1;32mUser:\x1b[0m \x1b[1;34m${user}@${host}\x1b[0m | \x1b[1;37m${dir}\x1b[0m${git}${caveman} ]\n`);
process.stdout.write(`[ \x1b[1;32mModel:\x1b[0m \x1b[1;37m${modelText}\x1b[0m | \x1b[1;32mContext:\x1b[0m \x1b[1;37m${fmtTokens(totalTok)}/${ctxFmt}\x1b[0m | \x1b[1;37min:\x1b[0m ${fmtTokens(inTok)} \x1b[1;37mout:\x1b[0m ${fmtTokens(outTok)} | ${bar(pct)} \x1b[1;31m(${pct}%)\x1b[0m ]\n`);
process.stdout.write(`[ \x1b[1;32mCost:\x1b[0m \x1b[1;31m$${costUsd} USD\x1b[0m / \x1b[1;31mR$${costBrl} BRL\x1b[0m | \x1b[1;32mSection:\x1b[0m \x1b[1;37m${duration}\x1b[0m ]\n`);
JS
