mod procmon;

fn main() {
  tauri::Builder::default()
      .invoke_handler(tauri::generate_handler![procmon::get_procmon,
        procmon::check_procmon])
      //.invoke_handler(tauri::generate_handler![close_splashscreen])
      .run(tauri::generate_context!())
      .expect(r#"error while running tauri application"#);
}
