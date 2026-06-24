# Browser WASM Buffer Overflow PoC

This project builds a small WebAssembly demo from `vuln.c` and serves it with a static HTTP server.

## Run with Docker

1. Build the Docker image:

```bash
docker build -t wasm-browser-poc .
```

2. Run the app:

```bash
docker run --rm -p 8080:8080 wasm-browser-poc
```

3. Open the demo in your browser:

```text
http://127.0.0.1:8080
```

## Notes

- This PoC simulates a realistic login page with a browser-based form and a WASM "backend" authentication layer.
- The browser sends a username and password to the backend, which verifies the user and only reveals protected content when auth succeeds.
- The backend stores expected credentials separately and uses a password verification helper instead of hardcoding auth logic in the form.
- The vulnerability is in the backend login path: the password is copied into a fixed-size 16-byte buffer, and the adjacent `isAdmin` flag is stored right after it.
- A too-long password overflows `password[16]`, corrupts `isAdmin`, and can bypass authentication even when the password is wrong.
- This demonstrates a real class of bug where unsafe string handling in server-side auth logic can lead to privilege escalation.
