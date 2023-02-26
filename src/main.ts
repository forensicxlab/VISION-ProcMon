import * as bootstrap from 'bootstrap';
import { invoke } from "@tauri-apps/api/tauri";
import $ from 'jquery';
import './scss/styles.scss';
import Graph from "graphology";
import Sigma from "sigma";
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import ForceSupervisor from "graphology-layout-force/worker";
import drawHover from 'sigma/rendering/canvas/hover';



function handleFileLoad() {
  $('#load_btn').removeClass('btn-outline-secondary').addClass('btn-outline-success').removeClass('disabled');
}


function print_error_message(message: string){
  $('#error-message').text(message);  
  const toast = new bootstrap.Toast('#error-toast'); 
  toast.show();
}

// function print_info_message(message: string){
//   $('#info-message').text(message);  
//   const toast = new bootstrap.Toast('#info-toast'); 
//   toast.show();
// }  

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

function display_graph(json_graph: any){
  const values = $('#process_select').val() as string;
  const array = values.split(" ");
  const selected_item = array[0];
  const linked_pid = array[1];

  $('#process_filter').append($('.input_select'));
  $('.container-fluid').remove();
  $('#quit').fadeIn();
  const container = document.getElementById("sigma-container") as HTMLElement;
  $('#sigma-container').empty();
  const graph = new Graph();

  // First, we add the central node (the filtered process) :
  let process: any;
  $.each(json_graph.processes.processes, function(_index, item){
    if (item.pid == linked_pid){
      process = item;
    }
  })
  // TODO : Create a case where we don't find the process (should not happend). 

  graph.addNode(process.name, {type: "image", label: process.name, size: 10, color: "#FFFFFF"});

  $('#card_process_name').text("Process Name: " + process.name);
  $('#card_process_pid').text("PID: " + process.pid);
  $('#card_process_ppid').text("PPID: " + process.ppid);
  $('#card_process_cmdline').text("Command Line : " + process.command_line);
  
  $('#process_info').fadeIn();
  let steps_count = 0;
  $.each(json_graph.nodes.nodes, function(_index, item){
    // Look for the parent process
    if (item.linked_pid == process.ppid && item.operation == "Process Create"){
      if (!graph.nodes().includes(item.name)){
        graph.addNode(item.name, { label: item.name, size: 10, color: "#FFFFFF"});
        graph.addEdge(item.name, process.name, {type: "arrow", label: "Is Parent Process (" + steps_count + ")", size: 3, color: "#6f42c1"});
      }
      
      steps_count++; 
    }
    
    if (item.linked_pid == process.pid && item.operation == "Process Create"){
      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF"});
        graph.addEdge(process.name, item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#752a37"});
      }
      
      //console.log(item.detail); // TODO => Use this when the user clicks (Popover ??)
      steps_count++; 
    }

    if (item.linked_pid == process.pid && item.operation == "QueryEAFile" && $('#File_filter').is(":checked")){
      if (!graph.nodes().includes("Files")){
        graph.addNode("Files", {label: "Files", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Files", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }    
      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF"});
        graph.addEdge("Files", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#e91e63"});
      }
      //console.log(item.detail); // TODO => Use this when the user clicks (Popover ??)
      steps_count++; 
    }


    if (item.linked_pid == process.pid && item.operation == "ReadFile" && $('#File_filter').is(":checked") ){
      if (!graph.nodes().includes("Files")){
        graph.addNode("Files", {label: "Files", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Files", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }    
      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF"});
        graph.addEdge("Files", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#2a5d75"});
      }
      //console.log(item.detail); // TODO => Use this when the user clicks (Popover ??)
      steps_count++; 
    }

    if (item.linked_pid == process.pid && item.operation == "WriteFile" && $('#File_filter').is(":checked") ){
      if (!graph.nodes().includes("Files")){
        graph.addNode("Files", {label: "Files", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Files", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }    
      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF"});
        graph.addEdge("Files", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#9c27b0"});
      }
      //console.log(item.detail); // TODO => Use this when the user clicks (Popover ??)
      steps_count++; 
    }
    
    
    if (item.linked_pid == linked_pid && item.operation == "RegCreateKey" && $('#RegCreateKey_filter').is(":checked")){
      if (!graph.nodes().includes("Registry")){
        graph.addNode("Registry", {label: "Registry Hive", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Registry", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }     
      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF"});
        graph.addEdge("Registry", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#e91e63"});
      } 
      steps_count++; 

    }

    
    if (item.linked_pid == linked_pid && item.operation == "RegDeleteValue" && $('#RegDeleteValue_filter').is(":checked")){
      if (!graph.nodes().includes("Registry")){
        graph.addNode("Registry", {label: "Registry Hive", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Registry", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }     
      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF"});
        graph.addEdge("Registry", item.path, {type: "arrow", label: item.operation+ "(" + steps_count + ")", size: 3, color: "#0c797d"});
      } 
      steps_count++; 

    }

    
    if (item.linked_pid == linked_pid && item.operation == "RegSetValue" && $('#RegSetValue_filter').is(":checked")){
      if (!graph.nodes().includes("Registry")){
        graph.addNode("Registry", {label: "Registry Hive", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Registry", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }     
      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF"});
        graph.addEdge("Registry", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#d5572f"});
      } 
      steps_count++; 
    }

    if (item.linked_pid == linked_pid && item.operation == "TCP Connect" && $('#Network_filter').is(":checked")){
      let src_dst = item.path.split('->');
      let src = src_dst[0].split(':')[0];

      if (!graph.nodes().includes("Network")){
        graph.addNode("Network", {label: "Network", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Network", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }     
      if (!graph.nodes().includes(src)){
        graph.addNode(src, {label: src, size: 10, color: "#FFFFFF"});
        graph.addEdge("Network", src, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#388e3c"});
      }
      if (!graph.nodes().includes(src_dst[1])){
        graph.addNode(src_dst[1], {label: src_dst[1], size: 10, color: "#FFFFFF"});
        graph.addEdge(src, src_dst[1], {type: "arrow", label: "dst", size: 3, color: "#d5572f"});
      }
      steps_count++; 
    }

    if (item.linked_pid == linked_pid && item.operation == "UDP Send" && $('#Network_filter').is(":checked")){
      let src_dst = item.path.split('->');
      let src = src_dst[0].split(':')[0];

      if (!graph.nodes().includes("Network")){
        graph.addNode("Network", {label: "Network", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Network", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }     
      if (!graph.nodes().includes(src)){
        graph.addNode(src, {label: src, size: 10, color: "#FFFFFF"});
        graph.addEdge("Network", src, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#00796b"});
      }
      if (!graph.nodes().includes(src_dst[1])){
        graph.addNode(src_dst[1], {label: src_dst[1], size: 10, color: "#FFFFFF"});
        graph.addEdge(src, src_dst[1], {type: "arrow", label: "dst", size: 3, color: "#d5572f"});
      }
      steps_count++; 
    }

  });

  graph.nodes().forEach((node, i) => {
    const angle = (i * 2 * Math.PI) / graph.order;
    graph.setNodeAttribute(node, "x", 100 * Math.cos(angle));
    graph.setNodeAttribute(node, "y", 100 * Math.sin(angle));
  });
 
  new Sigma(graph, container, {
      // We don't have to declare edgeProgramClasses here, because we only use the default ones ("line" and "arrow")
      nodeProgramClasses: {
        image: getNodeProgramImage(),
        
      },
      renderEdgeLabels: true,
      labelSize: 12,
      labelRenderer: drawHover,
      allowInvalidContainer: true,
    });

    // //Create the spring layout and start it
    const layout = new ForceSupervisor(graph);
//    const layout = new NoverlapLayout(graph);
    layout.start();
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
      display_graph(json_graph);
      $('#process_filter').fadeIn();
      $('#registry_actions').fadeIn();
    });

    $('#RegCreateKey_filter').on("change", function(){
        display_graph(json_graph);
    });
   
    $('#RegDeleteKey_filter').on("change", function(){
      display_graph(json_graph);
    });

    $('#RegSetValue_filter').on("change", function(){
      display_graph(json_graph);
    });

    $('#RegDeleteValue_filter').on("change", function(){
      display_graph(json_graph);
    });

    $('#File_filter').on("change", function(){
      display_graph(json_graph);
    });

    $('#Network_filter').on("change", function(){
      display_graph(json_graph);
    });


  })
  .catch((error) => {
      print_error_message("Error : "+ error);
    }
  );
}

function routine(){
  $('#sigma-container').empty();
  $('#quit').hide();
  $('#process_filter').hide(); 
  $('#registry_actions').hide(); 
  $('#title-2').hide(); 
  $('#process_info').hide();
  $('#process_picker').hide();
  $('#loading_scan').addClass('d-none');
  $('#input_form').removeClass('d-none');
  $('#load_btn').addClass('btn-outline-secondary').removeClass('btn-outline-success').addClass('disabled');
  $('#import_section').removeClass("d-none");
  $('#file_input').on("change", function(){ handleFileLoad(); });  
}

$('#quit_btn').on("click", async function(){
  location.reload();
  routine();
});

$('#load_btn').on("click", async function(){
  let path = $("#file_input").val() as string;
  await invoke('check_procmon', {path: path}).then(() => {
      load(path); 
  })
  .catch((error) => {
    print_error_message("Error : "+ error);
  }
  );
  
});

document.addEventListener('DOMContentLoaded', () => {
  routine();
});