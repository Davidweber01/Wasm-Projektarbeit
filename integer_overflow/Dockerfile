FROM emscripten/emsdk:latest

WORKDIR /project

COPY . /project

RUN emcc vuln.c \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createModule" \
    -s EXPORTED_FUNCTIONS='["_reset_state","_compute_size","_submit_items","_get_admin_status","_read_secret","_malloc","_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall","UTF8ToString","HEAPU8"]' \
    -O2 -o wasm.js

EXPOSE 8080

CMD ["python3", "-m", "http.server", "8080"]
