#include <emscripten.h>
#include <stdint.h>
#include <string.h>

static const char expected_username[] = "admin";

static int verify_password(const char *password)
{
    return strcmp(password, "password") == 0;
}

typedef struct
{
    char username[16];
    char password[16];
    uint8_t isAdmin;
    char reserved[7];
    char secret[24];
} AppState;

static AppState state = {
    .isAdmin = 0,
    .secret = "TOP_SECRET_1234"};

EMSCRIPTEN_KEEPALIVE
void reset_state(void)
{
    state.isAdmin = 0;
    state.username[0] = '\0';
    state.password[0] = '\0';
}

EMSCRIPTEN_KEEPALIVE
void attempt_login(const char *user, const char *pass)
{
    state.isAdmin = 0;
    strcpy(state.username, user);
    strcpy(state.password, pass);

    if (strcmp(state.username, expected_username) == 0 && verify_password(state.password))
    {
        state.isAdmin = 1;
    }
}

EMSCRIPTEN_KEEPALIVE
const char *read_secret(void)
{
    if (!state.isAdmin)
    {
        return "ACCESS DENIED";
    }
    return state.secret;
}
