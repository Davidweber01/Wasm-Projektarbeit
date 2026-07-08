let M = null;
let asanLog = [];   // collects all ASan stderr output
let aborted = false;

function log(msg, cls = '') {
    const el = document.getElementById('log');
    const line = document.createElement('div');
    line.className = 'log-line' + (cls ? ' ' + cls : '');
    line.textContent = msg;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
}

function clearLog() {
    document.getElementById('log').innerHTML = '';
    asanLog = [];
    aborted = false;
}

function hex(n) {
    return '0x' + n.toString(16).toUpperCase().padStart(8, '0');
}

function setStatus(text) {
    document.getElementById('status').textContent = text;
}

// ── Module configuration ────────────────────────────────────────────────────
// printErr receives all ASan diagnostic lines before abort() is called.
// onAbort is called when the WASM module halts execution.
const moduleConfig = {
    printErr(text) {
        asanLog.push(text);
        // Show every ASan line in the log in real-time.
        const cls = text.includes('ERROR') || text.includes('heap-use-after-free')
            ? 'asan-error' : 'asan';
        log(`[ASan stderr] ${text}`, cls);
    },
    onAbort(reason) {
        aborted = true;
        log('', '');
        log('══════════════════════════════════════════════', 'asan-error');
        log('  AddressSanitizer: execution aborted', 'asan-error');
        log(`  reason: ${reason}`, 'asan-error');
        log('  The UAF access was detected and prevented.', 'asan-error');
        log('══════════════════════════════════════════════', 'asan-error');
        setStatus('⛔ ASan: Use-After-Free detected — execution halted before data was read.');
    }
};

// ── Demo steps ──────────────────────────────────────────────────────────────
function doCreate() {
    if (!M || aborted) return;
    const user = document.getElementById('usernameInput').value.trim() || 'alice';
    M.ccall('create_session', 'void', ['string'], [user]);
    const ptr = M.ccall('get_session_ptr', 'number', [], []);
    const token = M.UTF8ToString(M.ccall('read_token', 'number', [], []));
    log(`[create_session]  username="${user}", heap ptr=${hex(ptr)}`, 'ok');
    log(`[read_token]      token="${token}"  ← normal read, no error`, 'ok');
    setStatus('Session created. Token readable — ASan has not triggered yet.');
}

function doFree() {
    if (!M || aborted) return;
    const ptr = M.ccall('get_session_ptr', 'number', [], []);
    if (ptr === 0) { setStatus('No active session — call Create first.'); return; }
    M.ccall('destroy_session', 'void', [], []);
    log(`[destroy_session] freed ${hex(ptr)} — pointer NOT cleared (same bug as unprotected build)`, 'warn');
    log(`[read_token]      attempting UAF read …`, 'warn');
    // This call will trigger ASan; onAbort fires before ccall returns.
    try {
        M.ccall('read_token', 'number', [], []);
    } catch (e) {
        // After onAbort the Emscripten runtime throws; we swallow it here
        // because we already display the ASan report above.
    }
}

function doReset() {
    clearLog();
    document.getElementById('usernameInput').value = '';
    // Reload the WASM module so the sanitizer state is fresh.
    M = null;
    aborted = false;
    setStatus('Reloading WASM module…');
    createModule({ ...moduleConfig }).then(mod => {
        M = mod;
        setStatus('WASM (ASan build) reloaded. Ready.');
    });
}

// ── Boot ────────────────────────────────────────────────────────────────────
createModule(moduleConfig).then(mod => {
    M = mod;
    setStatus('WASM (ASan build) loaded. Ready to test.');
});

document.getElementById('btnCreate').addEventListener('click', doCreate);
document.getElementById('btnFree').addEventListener('click', doFree);
document.getElementById('btnReset').addEventListener('click', doReset);
