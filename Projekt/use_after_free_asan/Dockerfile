FROM emscripten/emsdk:latest

WORKDIR /project

COPY . /project

RUN emcc vuln.c \
    -fsanitize=address \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createModule" \
    -s EXPORTED_FUNCTIONS='["_create_session","_get_session_ptr","_destroy_session","_read_token","_new_allocation","_reset_demo","_malloc","_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall","UTF8ToString","stringToNewUTF8"]' \
    -O1 -o wasm.js

EXPOSE 8080

CMD ["python3", "-m", "http.server", "8080"]
