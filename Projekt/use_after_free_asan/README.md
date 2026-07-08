# Browser WASM Use-After-Free — AddressSanitizer Build

Countermeasure demo for `use_after_free/`. The source (`vuln.c`) is identical.
The only change is the addition of `-fsanitize=address` to the Emscripten
compiler invocation.

## Run with Docker

```bash
docker build -t wasm-uaf-asan-poc .
docker run --rm -p 8080:8080 wasm-uaf-asan-poc
```

Open `http://127.0.0.1:8080` in your browser.

## How it works

Emscripten's AddressSanitizer (based on LLVM ASan) adds shadow memory
alongside the WASM linear memory at compile time. Every `malloc`/`free` call
marks the corresponding shadow region as accessible or poisoned respectively.
Every memory read and write is preceded by a shadow-memory check instruction.

When `read_token()` dereferences `g_session` after `destroy_session()` has
freed the block:

1. ASan's instrumentation checks the shadow memory for `g_session->token`.
2. The shadow byte is `0xfd` (heap-use-after-free poison).
3. ASan writes a `heap-use-after-free` report to stderr and calls `abort()`.
4. The Emscripten runtime halts — `read_token()` never returns a value.

The attacker-controlled data is never exposed, even though the same buggy
pointer dereference is present in the source.

## Comparison

| | `use_after_free/` (unprotected) | `use_after_free_asan/` (this) |
|---|---|---|
| Source code | vuln.c | identical vuln.c |
| Compiler flags | `-O2` | `-fsanitize=address -O1` |
| UAF attempt result | returns attacker data | aborted, ASan report emitted |

## Notes

- ASan increases the WASM binary size and adds runtime overhead (~2×).
  It is therefore most appropriate for development/testing builds, not production.
- For production, compile-time mitigations such as using Rust (ownership model)
  or enabling `-fsanitize=address` in CI pipelines are recommended.
