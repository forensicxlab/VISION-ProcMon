mod procmon;
fn main() {
  tauri::Builder::default()
    // Add this line
    .invoke_handler(tauri::generate_handler![procmon::get_procmon,
      procmon::check_procmon])
    .run(tauri::generate_context!())
    .expect("failed to run app");
}