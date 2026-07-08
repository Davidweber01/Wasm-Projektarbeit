#include <emscripten.h>
#include <stdint.h>
#include <string.h>

/*
 * Integer Overflow PoC
 *
 * The function submit_items() computes the total payload size as
 *   uint8_t total = item_count * ITEM_SIZE
 * Both operands are implicitly promoted to int for the multiplication,
 * but the result is truncated back to uint8_t on assignment. For
 * item_count = 32 and ITEM_SIZE = 8 the product is 256, which wraps
 * to 0 in uint8_t. The bounds check (total > sizeof data) then passes
 * with 0, while the actual memcpy uses the un-truncated size (256
 * bytes), overflowing the 32-byte buffer into the adjacent is_admin
 * flag.
 */

#define ITEM_SIZE 8u

typedef struct
{
    char data[32];
    uint8_t is_admin;
    char secret[24];
} AppState;

static AppState g_state = {
    .is_admin = 0,
    .secret = "TOP_SECRET_9876"};

EMSCRIPTEN_KEEPALIVE
void reset_state(void)
{
    g_state.is_admin = 0;
    memset(g_state.data, 0, sizeof(g_state.data));
}

/*
 * Returns the uint8_t-truncated size so the browser can display the
 * overflow arithmetic without running the exploit.
 */
EMSCRIPTEN_KEEPALIVE
uint8_t compute_size(uint8_t item_count)
{
    return (uint8_t)(item_count * ITEM_SIZE);
}

/*
 * Vulnerability: the bounds check uses the truncated uint8_t size,
 * but memcpy uses the full (size_t) product — which may be much larger.
 */
EMSCRIPTEN_KEEPALIVE
uint8_t submit_items(uint8_t item_count, const char *payload)
{
    uint8_t total = item_count * ITEM_SIZE; /* integer overflow */
    if (total > sizeof(g_state.data))
    {
        return 0; /* rejected */
    }
    /* BUG: copies item_count * ITEM_SIZE bytes, not the (wrapped) total */
    memcpy(g_state.data, payload, (size_t)item_count * ITEM_SIZE);
    return 1; /* accepted */
}

EMSCRIPTEN_KEEPALIVE
uint8_t get_admin_status(void)
{
    return g_state.is_admin;
}

EMSCRIPTEN_KEEPALIVE
const char *read_secret(void)
{
    if (!g_state.is_admin)
        return "ACCESS DENIED";
    return g_state.secret;
}
