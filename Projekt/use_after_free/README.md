# Browser WASM Use-After-Free PoC

This project demonstrates a Use-After-Free (UAF) vulnerability in a WASM module compiled from C.

## Run with Docker

```bash
docker build -t wasm-uaf-poc .
docker run --rm -p 8080:8080 wasm-uaf-poc
```

Open `http://127.0.0.1:8080` in your browser.

## Notes

- A `Session` struct is allocated on the WASM heap via `malloc`.
- `destroy_session()` calls `free()` but **does not clear the pointer** — the classic UAF pattern.
- Because WASM linear memory is never reclaimed by the OS, the freed bytes remain readable through the dangling pointer.
- `new_allocation()` allocates a block of the same size (`sizeof(Session)`). The WASM allocator (dlmalloc) typically reuses the just-freed block.
- `read_token()` reads through the dangling pointer and now returns attacker-controlled data placed in the new allocation.
- This demonstrates how memory-safe languages and OS-level protections (ASLR, guard pages) do **not** protect against UAF within WASM's flat linear memory model.
