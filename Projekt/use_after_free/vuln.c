#include <emscripten.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/*
 * Use-After-Free PoC
 *
 * A Session is allocated on the WASM heap. After destroy_session() the
 * pointer is left dangling — not NULL-ed. Because WASM linear memory is
 * never reclaimed by the OS, the bytes stay readable. A subsequent
 * same-size allocation typically lands on the same block, letting an
 * attacker write data that the stale pointer now exposes.
 */

typedef struct
{
    char username[16];
    char token[16];
    uint8_t is_active;
} Session;

static Session *g_session = NULL;
static uint8_t g_freed = 0;

EMSCRIPTEN_KEEPALIVE
void create_session(const char *username)
{
    if (!g_freed && g_session)
        free(g_session);

    g_session = (Session *)malloc(sizeof(Session));
    strncpy(g_session->username, username, 15);
    g_session->username[15] = '\0';
    strncpy(g_session->token, "SECRET_TOKEN_42", 15);
    g_session->token[15] = '\0';
    g_session->is_active = 1;
    g_freed = 0;
}

/* Expose the raw pointer address so JS can display it */
EMSCRIPTEN_KEEPALIVE
uint32_t get_session_ptr(void)
{
    return (uint32_t)(uintptr_t)g_session;
}

EMSCRIPTEN_KEEPALIVE
void destroy_session(void)
{
    free(g_session);
    g_freed = 1;
    /* BUG: g_session is intentionally NOT set to NULL — dangling pointer */
}

EMSCRIPTEN_KEEPALIVE
const char *read_token(void)
{
    /* UAF: reads through a potentially freed pointer */
    if (!g_session)
        return "(no session)";
    return g_session->token;
}

/*
 * Allocates a new block of the same size as Session and fills the token
 * field with attacker-controlled data. The WASM allocator (dlmalloc)
 * typically hands back the just-freed block, so g_session now aliases
 * this new allocation.
 *
 * Returns the new pointer address so JS can compare it to get_session_ptr().
 */
EMSCRIPTEN_KEEPALIVE
uint32_t new_allocation(const char *data)
{
    Session *s = (Session *)malloc(sizeof(Session));
    memset(s, 0, sizeof(Session));
    strncpy(s->token, data, 15);
    s->token[15] = '\0';
    s->is_active = 0;
    return (uint32_t)(uintptr_t)s;
}

EMSCRIPTEN_KEEPALIVE
void reset_demo(void)
{
    if (!g_freed && g_session)
        free(g_session);
    g_session = NULL;
    g_freed = 0;
}
