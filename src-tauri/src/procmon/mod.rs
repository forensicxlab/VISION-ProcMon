use std::fs::File;
use std::io::{BufReader};
use std::path::Path;

pub(crate) mod parser;

#[tauri::command]
pub fn check_procmon(path: String) -> Result<String, String>{
    let procmon_path = Path::new(&path);
    if procmon_path.exists(){
        Ok("0".into())
    }
    else {
        Err("File not found.".into())
    }
}


#[tauri::command]
pub async fn get_procmon(path: String) -> String {
    let f = match File::open(path){
        Ok(f) => f,
        Err(_) => return "-1".to_string()
    };
    println!("Parsing....");
    let file: BufReader<&File> = BufReader::new(&f);
    let graph = parser::parse_procmon(file);

    let result = serde_json::to_string(&graph).expect("could not serialize the file");
    println!("Done");
    return result.to_string();
}
