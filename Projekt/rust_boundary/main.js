const resultEl = document.getElementById("result");
const requestInput = document.getElementById("requestInput");
const lengthInput = document.getElementById("lengthInput");
const runButton = document.getElementById("runButton");
const resetButton = document.getElementById("resetButton");

let wasmInstance;

async function loadWasm() {
    const response = await fetch("rust_boundary.wasm");
    const bytes = await response.arrayBuffer();
    const {
        instance,
    } = await WebAssembly.instantiate(bytes, {});
    wasmInstance = instance;
    resultEl.textContent = "WASM loaded. Enter a request and choose a host-reported length.";
}

function alloc(size) {
    return wasmInstance.exports.alloc(size);
}

function dealloc(ptr, size) {
    wasmInstance.exports.dealloc(ptr, size);
}

function resetState() {
    wasmInstance.exports.reset_state();
    requestInput.value = "admin:wrongpass";
    lengthInput.value = "18";
    resultEl.textContent = "State reset. WASM ready.";
}

function runPoC() {
    const text = requestInput.value;
    const length = Number(lengthInput.value);

    if (!text || Number.isNaN(length) || length < 0) {
        resultEl.textContent = "Enter a valid request and host-reported length.";
        return;
    }

    const encoder = new TextEncoder();
    const encoded = encoder.encode(text + "\0");
    const ptr = alloc(encoded.length);
    const memory = new Uint8Array(wasmInstance.exports.memory.buffer, ptr, encoded.length);
    memory.set(encoded);

    const resultPtr = wasmInstance.exports.process_request(ptr, length);
    const view = new Uint8Array(wasmInstance.exports.memory.buffer, resultPtr, 64);
    let response = "";
    for (let i = 0; i < view.length; i++) {
        if (view[i] === 0) break;
        response += String.fromCharCode(view[i]);
    }

    dealloc(ptr, encoded.length);
    resultEl.textContent = response;
}

runButton.addEventListener("click", runPoC);
resetButton.addEventListener("click", resetState);

loadWasm();
