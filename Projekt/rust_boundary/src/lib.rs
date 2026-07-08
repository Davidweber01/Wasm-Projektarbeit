#![allow(static_mut_refs)]

use std::mem;
use std::slice;
use std::str;

#[repr(C)]
struct AppState {
    request: [u8; 16],
    is_admin: u8,
    reserved: [u8; 7],
}

static mut STATE: AppState = AppState {
    request: [0; 16],
    is_admin: 0,
    reserved: [0; 7],
};

static ACCESS_DENIED: &[u8] = b"ACCESS DENIED\0";
static SECRET: &[u8] = b"TOP_SECRET_1234\0";

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let mut buffer = Vec::with_capacity(size);
    let ptr = buffer.as_mut_ptr();
    mem::forget(buffer);
    ptr
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, capacity: usize) {
    if ptr.is_null() || capacity == 0 {
        return;
    }
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, capacity);
    }
}

#[no_mangle]
pub extern "C" fn reset_state() {
    unsafe {
        STATE.request = [0; 16];
        STATE.is_admin = 0;
    }
}

#[no_mangle]
pub extern "C" fn process_request(ptr: *const u8, len: usize) -> *const u8 {
    unsafe {
        let input = slice::from_raw_parts(ptr, len);
        std::ptr::copy_nonoverlapping(input.as_ptr(), STATE.request.as_mut_ptr(), len);

        let request_text = str::from_utf8(&STATE.request).unwrap_or("");
        if request_text.trim_end_matches(char::from(0)) == "admin:hunter2" {
            STATE.is_admin = 1;
        }

        if STATE.is_admin != 0 {
            SECRET.as_ptr()
        } else {
            ACCESS_DENIED.as_ptr()
        }
    }
}
