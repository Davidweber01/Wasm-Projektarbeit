let ModuleInstance = null;

function setStatus(text) {
    document.getElementById('status').textContent = text;
}

function updateSecret() {
    if (!ModuleInstance) return;
    const ptr = ModuleInstance.ccall('read_secret', 'number', [], []);
    const secret = ModuleInstance.UTF8ToString(ptr);
    document.getElementById('secret').textContent = secret;
}

function updateUsername() {
    const input = document.getElementById('usernameInput').value;
    document.getElementById('username').textContent = input;
}

function submitLogin() {
    if (!ModuleInstance) return;
    const user = document.getElementById('usernameInput').value;
    const pass = document.getElementById('passwordInput').value;

    ModuleInstance.ccall('attempt_login', 'void', ['string', 'string'], [user, pass]);
    updateSecret();
    setStatus('Login request processed.');
}

function resetPage() {
    if (!ModuleInstance) return;
    ModuleInstance.ccall('reset_state', 'void', [], []);
    document.getElementById('usernameInput').value = '';
    document.getElementById('passwordInput').value = '';
    updateSecret();
    setStatus('State reset. Ready');
}

createModule().then(module => {
    ModuleInstance = module;
    setStatus('WASM loaded. Ready to test.');
    resetPage();
});

document.getElementById('runButton').addEventListener('click', submitLogin);
document.getElementById('resetButton').addEventListener('click', resetPage);
