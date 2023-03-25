
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


fn check_timestamp(values: &Vec<String>) -> bool{
    let test = values[2].replace("\"", "").parse::<usize>();
    match test{
        Ok(_) => return true,
        Err(_) => return false
    }
}

pub(crate) fn parse_procmon(file: BufReader<&File>)  -> Graph {
 

    let mut process: Process = Process::new();    
    let mut processes: Processes = Processes { processes: vec![] };

    let mut procmon_item: ProcMon = ProcMon::new();
    let mut nodes: Nodes = Nodes { nodes: vec![]};
    // Collecting keys from the excel file.
    for (num, line) in file.lines().enumerate() {
        if num != 0 {
            let l = line.unwrap();
            let mut values: Vec<String> = l.splitn(7,',')
                .map(|val| val.to_string().replace('"', ""))
                .collect();

                // We need to check if the timestamp is with a ',' if it is then we need to adapt our values...
                if !check_timestamp(&values){
                    values= l.splitn(8,',')
                        .map(|val| val.to_string().replace('"', ""))
                        .collect();
                    
                    values.remove(1);
                }
                //let time: String  = values[0].replace('"', "").parse().unwrap(); <- Not used yet be could be usefull in the future.
                let process_name: String = values[1].parse().unwrap();
                let pid: usize  = values[2].parse().unwrap();
                let operation: String  = values[3].parse().unwrap();    
                let path: String  = values[4].parse().unwrap();
                //let result: String  = values[5].parse().unwrap(); <- Not used yet be could be usefull in the future.
                procmon_item.name = process_name.clone();
                procmon_item.linked_pid = pid;
                procmon_item.operation = operation.clone();
                procmon_item.path = path.clone();
                procmon_item.detail = "".to_string();

                match &operation as &str {
                    
                    "Process Start" => {
                        // String = values[7].parse().unwrap();
                        if !processes.contains(pid){
                            process.name = process_name.clone();
                            process.pid = pid;
                            //I need to isolate the ppid and the commandline from the details 
                            let details: Vec<String> = values[6].splitn(3,',').map(|val| val.to_string()).collect();
                            process.ppid = details[0].replace("Parent PID: ","").parse().unwrap();
                            process.command_line = details[1].replace("Command line: ","").parse().unwrap();
                            processes.processes.push(process.clone());
                        }    
                    },
                    
                    "Process Create" => {        
                        if !nodes.contains(pid, &path, &operation){
                            procmon_item.detail = values[6].parse().unwrap();
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },

                    "QueryEAFile" => {        
                        if !nodes.contains(pid, &path, &operation){                          
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },

                    "ReadFile" => {        
                        if !nodes.contains(pid, &path, &operation){
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },

                    "WriteFile" => {        
                        if !nodes.contains(pid, &path, &operation){
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },


                    "RegCreateKey" => {        
                        if !nodes.contains(pid, &path, &operation){
                            println!("{:?}", values);
                            procmon_item.detail = values[6].parse().unwrap();
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },

                    "RegDeleteKey" => {        
                        if !nodes.contains(pid, &path, &operation){
                            procmon_item.detail = values[6].parse().unwrap();
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },

                    "RegSetValue" => {        
                        if !nodes.contains(pid, &path, &operation){
                            procmon_item.detail = values[6].parse().unwrap();
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },

                    "RegDeleteValue" => {        
                        if !nodes.contains(pid, &path, &operation){
                            procmon_item.detail = values[6].parse().unwrap();
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },

                    "DeleteFile" => {        
                        if !nodes.contains(pid, &path, &operation){
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },

                    "TCP Connect" => {        
                        if !nodes.contains(pid, &path, &operation){
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },

                    "UDP Send" => {        
                        if !nodes.contains(pid, &path, &operation){
                            nodes.nodes.push(procmon_item.clone());
                        }
                    },
                    _ => (),
                }
        }
    }
    Graph {
        processes: processes,
        nodes: nodes,      
    }
}

