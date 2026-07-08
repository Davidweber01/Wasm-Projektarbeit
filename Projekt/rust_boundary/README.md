# Rust WASM Boundary Bug PoC

This project demonstrates a browser-side WASM boundary vulnerability using Rust.

## Run with Docker

1. Build the Docker image:

```bash
cd rust_boundary
docker build -t rust-boundary-poc .
```

2. Run the app:

```bash
docker run --rm -p 8080:8080 rust-boundary-poc
```

3. Open the demo in your browser:

```text
http://127.0.0.1:8080
```

## Notes

- This PoC uses Rust compiled to WASM with a plain WebAssembly loader.
- The browser writes a request payload into WASM memory and passes both a pointer and a host-reported length.
- The Rust module copies the host-provided length into a fixed-size 16-byte buffer.
- If the host length is larger than the actual payload, the request can overflow into the adjacent `is_admin` flag.
- This demonstrates a real JS → WASM host-boundary vulnerability: even safe languages like Rust can be exploited if the boundary values are trusted.
