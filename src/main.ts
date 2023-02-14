import * as bootstrap from 'bootstrap';
import { invoke } from "@tauri-apps/api/tauri";
import $ from 'jquery';
import './scss/styles.scss';
import {MultiGraph} from "graphology";
import Sigma from "sigma";
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import ForceSupervisor from "graphology-layout-force/worker";



function handleFileLoad() {
  $('#load_btn').removeClass('btn-outline-secondary').addClass('btn-outline-success').removeClass('disabled');
}


function print_error_message(message: string){
  $('#error-message').text(message);  
  const toast = new bootstrap.Toast('#error-toast'); 
  toast.show()
}

function print_info_message(message: string){
  $('#info-message').text(message);  
  const toast = new bootstrap.Toast('#info-toast'); 
  toast.show()
}  

function generate_select(processes: any){
  let sorted = processes.sort((a: any, b: any) => (a.pid < b.pid) ? 1 : -1);
  $.each(sorted, function(index, item){
    const option = document.createElement('option');
    option.setAttribute('value',item.name+ " " + item.pid);
    option.textContent = item.name + ' : ' + item.pid;
    if (index == 0){
      option.selected = true;
    }
    $('#process_select').append(option);
});
}

async function load(path: string){
  $('#title').fadeOut();
  $('#logo').animate({
    width: 200,
    height: 150,
 });

  $('#loading_scan').removeClass('d-none');
  $('#input_form').addClass('d-none');

  invoke('get_procmon', {path: path}).then((result) => {
    const json_graph = JSON.parse(result as string);

    generate_select(json_graph.processes.processes);

    $('#loading_scan').addClass('d-none');
    $('#process_picker').fadeIn(2000);

    $('#generate_btn').on("click", function(){
          const values = $('#process_select').val() as string;
          const array = values.split(" ");
          const selected_item = array[0];
          const linked_pid = array[1];
          
          $('.container-fluid').remove();
          const container = document.getElementById("sigma-container") as HTMLElement;
          const graph = new MultiGraph();

          // First, we add the central node (the filtered process) :
          let process: any;
          $.each(json_graph.processes.processes, function(_index, item){
            if (item.pid == linked_pid){
              process = item;
            }
          })
          // TODO : Create a case where we don't find the process (should not happend). 

          graph.addNode(process.name, {type: "image", label: process.name, image: "/cpu.svg", size: 15, color: "#FFFFFF"});

          $('#card_process_name').text("Process Name: " + process.name);
          $('#card_process_pid').text("PID: " + process.pid);
          $('#card_process_ppid').text("PPID: " + process.ppid);
          $('#card_process_cmdline').text("Command Line : " + process.command_line);
          
          $('#process_info').fadeIn();

          $.each(json_graph.nodes.nodes, function(_index, item){
            // Look for the parent process
            if (item.linked_pid == process.ppid && item.operation == "Process Create"){
              if (!graph.nodes().includes(item.name)){
                graph.addNode(item.name, {type: "image", label: item.name, image: "/cpu.svg", size: 15, color: "#FFFFFF"});
              }
              graph.addEdge(item.name, process.name, {type: "arrow", label: "Is Parent Process", size: 5, color: "#000000"});
            }
            
            if (item.linked_pid == process.pid && item.operation == "Process Create"){
              if (!graph.nodes().includes(item.path)){
                graph.addNode(item.path, {type: "image", label: item.path, image: "/cpu.svg", size: 15, color: "#FFFFFF"});
              }
              graph.addEdge(process.name, item.path, {type: "arrow", label: item.operation, size: 5, color: "#000000"});
              //console.log(item.detail); // TODO => Use this when the user clicks (Popover ??)
            }

            if (item.linked_pid == process.pid && item.operation == "QueryEAFile"){
              if (!graph.nodes().includes(item.path)){
                graph.addNode(item.path, {type: "image", label: item.path, image: "/reg.svg", size: 15, color: "#FFFFFF"});
              }
              graph.addEdge(process.name, item.path, {type: "arrow", label: item.operation, size: 5, color: "#000000"});
              //console.log(item.detail); // TODO => Use this when the user clicks (Popover ??)
            }
            
            
            

          });

          // Then, we find each node that have the linked pid
            $.each(json_graph.nodes.nodes, function(_index, item){
              if (item.linked_pid == linked_pid && item.operation == ""){
                if (!graph.nodes().includes(item.path)){
                  graph.addNode(item.path, {type: "image", label: item.path, image: "/reg.svg", size: 15, color: "#FFFFFF"});
                } 
                graph.addEdge(selected_item, item.path, {type: "arrow", label: item.operation, size: 5, color: "#000000"});
              }
            });
          
            graph.nodes().forEach((node, i) => {
              const angle = (i * 2 * Math.PI) / graph.order;
              graph.setNodeAttribute(node, "x", 100 * Math.cos(angle));
              graph.setNodeAttribute(node, "y", 100 * Math.sin(angle));
            });
            
      
            const renderer = new Sigma(graph, container, {
              // We don't have to declare edgeProgramClasses here, because we only use the default ones ("line" and "arrow")
              nodeProgramClasses: {
                image: getNodeProgramImage(),
                
              },
              renderEdgeLabels: true,
              allowInvalidContainer: true,
            });
   
         
            //Create the spring layout and start it
            const layout = new ForceSupervisor(graph);
            layout.start();
    });
    


  })
  .catch((error) => {
      print_error_message("Error : "+ error);
      routine();
    }
  );
}

function routine(){
  $('#process_info').hide();
  $('#process_picker').hide();
  $('#loading_scan').addClass('d-none');
  $('#input_form').removeClass('d-none');
  $('#load_btn').addClass('btn-outline-secondary').removeClass('btn-outline-success').addClass('disabled');
  $('#import_section').removeClass("d-none");
  $('#file_input').on("change", function(){ handleFileLoad(); });  
  
  
  $('#load_btn').on("click", async function(){
    let path = $("#file_input").val() as string;
    await invoke('check_procmon', {path: path}).then(() => {
      load(path); 
    })
    .catch((error) => {
      print_error_message("Error : "+ error);
      routine();
    }
    );
    
  });
}

document.addEventListener('DOMContentLoaded', async () => {
    routine();
});