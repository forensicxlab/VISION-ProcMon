
use std::fs::File;
use std::io::{BufReader,BufRead};


#[derive(Default, serde::Serialize, serde::Deserialize, Debug,  Clone)]
struct Nodes {
    nodes: Vec<ProcMon>
}

impl Nodes {
    fn contains(&self, pid: usize, path: &str, operation: &str ) -> bool {
        self.nodes.iter().any(|x| x.contains(pid, path, operation))
    }
}



#[derive(Default, serde::Serialize, serde::Deserialize, Debug,  Clone)]
struct ProcMon {
    name: String,
    time_of_day: String,
    linked_pid: usize,
    operation: String,
    path: String,
    result: String,
    detail: String,
}

impl ProcMon  {
    fn new() -> Self {
        Default::default()
    }
    fn contains(&self, pid: usize, path: &str, operation: &str ) -> bool {
        self.linked_pid == pid && self.path == path && self.operation == operation
    }
}

#[derive(Default, serde::Serialize, serde::Deserialize, Debug,  Clone)]
pub struct Processes {
    processes: Vec<Process>
}

impl Processes {
    fn contains(&self, pid: usize) -> bool {
        self.processes.iter().any(|x| x.contains(pid))
    }
}

#[derive(Default, serde::Serialize, serde::Deserialize, Debug,  Clone)]
pub struct Process{
    name: String,
    pid : usize,
    ppid: usize,
    command_line: String,
}

impl Process  {
    fn new() -> Self {
        Default::default()
    }

    fn contains(&self, pid: usize) -> bool {
        self.pid == pid
    }
}

#[derive(Default, serde::Serialize, serde::Deserialize, Debug,  Clone)]
pub struct Graph {
    processes: Processes,
    nodes: Nodes,
}


pub(crate) fn parse_procmon(file: BufReader<&File>)  -> Graph {
 

    let mut process: Process = Process::new();    
    let mut processes: Processes = Processes { processes: vec![] };

    let mut procmon_item: ProcMon = ProcMon::new();
    let mut nodes: Nodes = Nodes { nodes: vec![]};

    
    let mut keys = vec![String::from("")];
    
    // Collecting keys from the excel file.
    for (num, line) in file.lines().enumerate() {
        if num == 0 {
            let l = line.unwrap();
            let v = l.split(',')
                .map(|field| field.to_lowercase().replace(" ", "_"))
                .collect();
            keys = v;
        } 
        
        // Parsing cell values
        else {
            let l = line.unwrap();
            let values: Vec<String> = l.split(',')
                .map(|val| val.to_string())
                .collect();
            
            for item in keys.iter() {
                let time: String  = values[0].replace('"', "").parse().unwrap();
                let process_name: String = values[1].replace('"', "").parse().unwrap();
                let pid: usize  = values[2].replace('"', "").parse().unwrap();
                let operation: String  = values[3].replace('"', "").parse().unwrap();
                
                let path: String  = values[4].replace('"', "").parse().unwrap();
                let result: String  = values[5].replace('"', "").parse().unwrap();
               
                // We add the process to the list if not present
                match &operation as &str {
                    "Process Start" => {
                        // String = values[7].replace('"', "").parse().unwrap();
                        if !processes.contains(pid){
                            process.name = process_name.clone();
                            process.pid = pid;
                            process.ppid = values[6].replace('"', "").replace("Parent PID: ","").parse().unwrap();
                            process.command_line = values[7].replace('"', "").replace("Command line: ","").parse().unwrap();
                            processes.processes.push(process.clone());
                        }    
                    },
                    
                    "Process Create" => {        
                        if !nodes.contains(pid, &path, &operation){
                            procmon_item.name = process_name.clone();
                            procmon_item.linked_pid = pid;
                            procmon_item.operation = operation;
                            procmon_item.path = path;
                            procmon_item.detail = values[6].replace('"', "").replace("PID: ","").parse().unwrap();
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },

                    "QueryEAFile" => {        
                        if !nodes.contains(pid, &path, &operation){
                            procmon_item.name = process_name.clone();
                            procmon_item.linked_pid = pid;
                            procmon_item.operation = operation;
                            procmon_item.path = path;
                            procmon_item.detail = "".to_string();
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },
                    _ => (),
                }
            }   
        }
    }
    return Graph {
        processes: processes,
        nodes: nodes,      
    };
}

