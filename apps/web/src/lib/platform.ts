/*
 * Where this web build is running. The same build runs in the browser and inside the desktop shell (Tauri);
 * the shell has no marketing page, so "/" opens the app there.
 */
export function isDesktopShell(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
