FROM rust:slim AS builder

WORKDIR /usr/src/rust_boundary
COPY . .

RUN rustup target add wasm32-unknown-unknown \
    && cargo build --target wasm32-unknown-unknown --release \
    && cp target/wasm32-unknown-unknown/release/rust_boundary.wasm ./

FROM python:3.12-slim

WORKDIR /usr/src/rust_boundary
COPY --from=builder /usr/src/rust_boundary/rust_boundary.wasm ./
COPY index.html main.js README.md ./

EXPOSE 8080
CMD ["python3", "-m", "http.server", "8080"]
