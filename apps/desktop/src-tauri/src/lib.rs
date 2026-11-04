//! See on the desktop: one window around the web app. Everything the app does lives in the web build
//! (apps/web); this shell adds the native window, the menu-bar name and opening links in the browser.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // links that leave See (help pages, a service's site) open in the person's browser
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("See could not start");
}
