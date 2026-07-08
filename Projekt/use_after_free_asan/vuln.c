#include <emscripten.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/*
 * Use-After-Free PoC — compiled with AddressSanitizer (-fsanitize=address)
 *
 * Identical source to use_after_free/vuln.c. The only difference is the
 * compiler flags used to build this module. ASan instruments every heap
 * access at compile time. When read_token() dereferences the freed
 * g_session pointer, ASan detects the illegal access and aborts execution
 * before any data is returned to the caller.
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
    /* BUG: g_session intentionally NOT cleared — same bug as the unprotected build */
}

EMSCRIPTEN_KEEPALIVE
const char *read_token(void)
{
    if (!g_session)
        return "(no session)";
    /* ASan intercepts this read — it dereferences freed memory */
    return g_session->token;
}

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
