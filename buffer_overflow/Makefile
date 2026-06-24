EMCC ?= emcc
SRC = vuln.c
TARGET = wasm.js
EMCC_FLAGS = \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createModule" \
    -s EXPORTED_FUNCTIONS='["_reset_state","_attempt_login","_read_secret","_malloc","_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall","UTF8ToString","stringToNewUTF8"]' \
    -O2

all: $(TARGET)

$(TARGET): $(SRC)
	$(EMCC) $(SRC) $(EMCC_FLAGS) -o $(TARGET)

clean:
	rm -f wasm.js wasm.wasm wasm.wasm.map
