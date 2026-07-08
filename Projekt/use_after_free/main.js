let M = null;

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
}

function hex(n) {
    return '0x' + n.toString(16).toUpperCase().padStart(8, '0');
}

function setStatus(text) {
    document.getElementById('status').textContent = text;
}

function doCreate() {
    if (!M) return;
    const user = document.getElementById('usernameInput').value.trim() || 'alice';
    M.ccall('create_session', 'void', ['string'], [user]);
    const ptr = M.ccall('get_session_ptr', 'number', [], []);
    const token = M.UTF8ToString(M.ccall('read_token', 'number', [], []));
    log(`[create_session]  username="${user}", heap ptr=${hex(ptr)}`, 'ok');
    log(`[read_token]      token="${token}"`, 'ok');
    setStatus('Session created. Token is readable.');
}

function doFree() {
    if (!M) return;
    const ptr = M.ccall('get_session_ptr', 'number', [], []);
    if (ptr === 0) { setStatus('No active session — call Create first.'); return; }
    M.ccall('destroy_session', 'void', [], []);
    log(`[destroy_session] freed ${hex(ptr)} — g_session NOT cleared (dangling)`, 'warn');
    // UAF read: pointer is still valid in WASM linear memory
    const token = M.UTF8ToString(M.ccall('read_token', 'number', [], []));
    log(`[read_token UAF]  token="${token}" (stale memory, not yet overwritten)`, 'warn');
    setStatus('Session freed. Dangling pointer still accessible.');
}

function doHijack() {
    if (!M) return;
    const data = document.getElementById('hijackInput').value.trim() || 'ATTACKER_DATA';
    const oldPtr = M.ccall('get_session_ptr', 'number', [], []);
    const newPtr = M.ccall('new_allocation', 'number', ['string'], [data]);

    log(`[new_allocation]  new ptr=${hex(newPtr)}, dangling ptr=${hex(oldPtr)}`, 'info');

    if (newPtr === oldPtr) {
        log('                  ⚠ SAME ADDRESS — allocator reused the freed block!', 'bad');
    } else {
        log('                  Different address — allocator used a new block.', 'info');
    }

    const token = M.UTF8ToString(M.ccall('read_token', 'number', [], []));
    log(`[read_token UAF]  token="${token}" ← read via dangling pointer`, newPtr === oldPtr ? 'bad' : 'info');
    setStatus(newPtr === oldPtr
        ? '⚠ UAF confirmed: attacker data exposed via dangling pointer!'
        : 'Addresses differ — UAF did not overlap this time.');
}

function doReset() {
    if (!M) return;
    M.ccall('reset_demo', 'void', [], []);
    clearLog();
    document.getElementById('usernameInput').value = '';
    document.getElementById('hijackInput').value = '';
    setStatus('Reset. Ready.');
}

createModule().then(mod => {
    M = mod;
    setStatus('WASM loaded. Ready to test.');
});

document.getElementById('btnCreate').addEventListener('click', doCreate);
document.getElementById('btnFree').addEventListener('click', doFree);
document.getElementById('btnHijack').addEventListener('click', doHijack);
document.getElementById('btnReset').addEventListener('click', doReset);
