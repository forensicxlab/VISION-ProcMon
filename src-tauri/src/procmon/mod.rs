use std::fs::File;
use std::io::{BufReader};
use std::path::Path;

pub(crate) mod parser;

#[tauri::command]
pub fn check_procmon(path: String) -> Result<String, String>{
    let procmon_path = Path::new(&path);
    if procmon_path.exists(){
        if procmon_path.is_file(){
            Ok("0".into())
        }
        else {
            Err("You can't choose a directory.".into())
        }
    }
    else {
        Err("File not found.".into())
    }
}


#[tauri::command]
pub async fn get_procmon(path: String) -> Result<String, String> {
    let f = match File::open(path){
        Ok(f) => f,
        Err(_) => return Err("Could not open the file".into())
    };

    let file: BufReader<&File> = BufReader::new(&f);
    let graph = parser::parse_procmon(file);
    
    let result = serde_json::to_string(&graph).expect("could not serialize the file");
    Ok(result.into())
}
