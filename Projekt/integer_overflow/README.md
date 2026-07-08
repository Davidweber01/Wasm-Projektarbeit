# Browser WASM Integer Overflow PoC

This project demonstrates an integer overflow vulnerability in a WASM module compiled from C.

## Run with Docker

```bash
docker build -t wasm-intof-poc .
docker run --rm -p 8080:8080 wasm-intof-poc
```

Open `http://127.0.0.1:8080` in your browser.

## Notes

- The WASM backend stores submitted items in a 32-byte buffer (`g_state.data`), immediately followed by the `is_admin` flag.
- The bounds check computes `uint8_t total = item_count * 8`. For `item_count = 32`, the product (256) wraps to **0** in `uint8_t`, bypassing the check.
- `memcpy` then uses the actual un-truncated size (`item_count * 8 = 256` bytes), writing 256 bytes into the 32-byte buffer and overwriting `is_admin` at offset 32.
- Setting `is_admin = 1` grants access to the protected secret, demonstrating an auth bypass via integer overflow.
- This pattern is common in C code that uses narrow integer types for size arithmetic, a risk that persists when C is compiled to WASM.
