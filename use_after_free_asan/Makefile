EMCC   ?= emcc
SRC     = vuln.c
TARGET  = wasm.js

# -fsanitize=address enables Emscripten's AddressSanitizer.
# It instruments every heap allocation and access at compile time:
#   - freed memory is poisoned (marked as inaccessible in shadow memory)
#   - any read/write to poisoned memory triggers an abort with a full report
# -O1 is required; higher optimisation levels can remove instrumentation.
EMCC_FLAGS = \
    -fsanitize=address \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createModule" \
    -s EXPORTED_FUNCTIONS='["_create_session","_get_session_ptr","_destroy_session","_read_token","_new_allocation","_reset_demo","_malloc","_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall","UTF8ToString","stringToNewUTF8"]' \
    -O1

all: $(TARGET)

$(TARGET): $(SRC)
	$(EMCC) $(SRC) $(EMCC_FLAGS) -o $(TARGET)

clean:
	rm -f wasm.js wasm.wasm wasm.wasm.map
