import * as bootstrap from 'bootstrap';
import "bootstrap-icons/font/bootstrap-icons.css";
import { invoke } from "@tauri-apps/api/tauri";
import $ from 'jquery';
import './scss/styles.scss';
import Graph from "graphology";
import Sigma from "sigma";
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import FA2Layout from 'graphology-layout-forceatlas2/worker';
import drawHover from 'sigma/rendering/canvas/hover';
import { once } from '@tauri-apps/api/event'




/*
--------------GLOB---------------
*/
var graph: Graph;
var steps_count = 0;
const container = document.getElementById("sigma-container") as HTMLElement;
var renderer: Sigma;

// Make the DIV element draggable:
drag_cards(document.getElementById("process_info_card"));
drag_cards(document.getElementById("filter_card"));
drag_cards(document.getElementById("details_info"));

/*
-------------FUNCTIONS---------------
*/
function print_error_message(message: string){
  $('#error-message').text(message);  
  const toast = new bootstrap.Toast('#error-toast'); 
  toast.show();
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

/* display_graph:
Take the JSON resulted from the CSV parsing from rust backend and build the graph.
Triggered everytime the user is changing the filters.
*/
function display_graph(json_graph: any){
  
  const values = $('#process_select').val() as string;
  const array = values.split(" ");
  const selected_item = array[0];
  const linked_pid = array[1];

  $('#process_filter').append($('.input_select'));
  $('.container-fluid').remove();
  $('#quit').fadeIn();
  $('#dashboard').fadeIn();
  $('#sigma-container').empty();
  graph = new Graph();
  steps_count = 0;
  // First, we add the central node (the filtered process) :
  let process: any;
  $.each(json_graph.processes.processes, function(_index, item){
    if (item.pid == linked_pid){
      process = item;
    }
  })
  // Add the node and fill the process information on the card.
  graph.addNode(process.name, {label: process.name, size: 10, color: "#FFFFFF", step: steps_count});

  $('#card_process_name').text("Process Name: " + process.name);
  $('#card_process_pid').text("PID: " + process.pid);
  $('#card_process_ppid').text("PPID: " + process.ppid);
  $('#card_process_cmdline').text("Command Line : " + process.command_line);
  $('#process_info_card').fadeIn();

  $.each(json_graph.nodes.nodes, function(_index, item){
    // Look for the parent process
    if (item.linked_pid == process.ppid && item.operation == "Process Create"){
      if (!graph.nodes().includes(item.name)){
        graph.addNode(item.name, { label: item.name, size: 10, color: "#FFFFFF", step: steps_count});
        graph.addEdge(item.name, process.name, {type: "arrow", label: "Is Parent Process (" + steps_count + ")", size: 3, color: "#6f42c1"});
      }
      steps_count++; 
    }
    // Display the Root Node Process.
    if (item.linked_pid == process.pid && item.operation == "Process Create"){
      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF", details: item.detail, step: steps_count});
        graph.addEdge(process.name, item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#752a37"});
      }
      else{
        graph.addEdge(process.name, item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#752a37"});
      }
      steps_count++; 
    }

    // Create a node and and edge for each QueryEAFile item
    if (item.linked_pid == process.pid && item.operation == "QueryEAFile" && $('#File_filter').is(":checked")){
      if (!graph.nodes().includes("Files")){
        graph.addNode("Files", {label: "Files", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Files", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }

      if (!graph.nodes().includes("QueryEA")){
        graph.addNode("QueryEA", {label: "QueryEA", size: 10, color: "#FFFFFF"});
        graph.addEdge("Files", "QueryEA", {type: "arrow", label: "", size: 3, color: "#000000"});
      }    

     if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF", step: steps_count});
        graph.addEdge("QueryEA", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#e91e63"});
      }
      else{
        graph.addEdge("QueryEA", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#e91e63"});
      }
      
      steps_count++; 
    }

    // Create a node and and edge for each file readed
    if (item.linked_pid == process.pid && item.operation == "ReadFile" && $('#File_filter').is(":checked") ){
      if (!graph.nodes().includes("Files")){
        graph.addNode("Files", {label: "Files", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Files", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }    

      if (!graph.nodes().includes("Read")){
        graph.addNode("Read", {label: "Read", size: 10, color: "#FFFFFF"});
        graph.addEdge("Files", "Read", {type: "arrow", label: "", size: 3, color: "#000000"});
      }    

      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF", step: steps_count});
        graph.addEdge("Read", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#2a5d75"});

      }
      else{
        graph.addEdge("Read", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#2a5d75"});
      }
      
      steps_count++; 
    }

    // Create a node and and edge for each file written
    if (item.linked_pid == process.pid && item.operation == "WriteFile" && $('#File_filter').is(":checked") ){
      if (!graph.nodes().includes("Files")){
        graph.addNode("Files", {label: "Files", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Files", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }    


      if (!graph.nodes().includes("Write")){
        graph.addNode("Write", {label: "Write", size: 10, color: "#FFFFFF"});
        graph.addEdge("Files", "Write", {type: "arrow", label: "", size: 3, color: "#000000"});
      }    


      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF", step: steps_count});
        graph.addEdge("Write", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#9c27b0"});
      }
      else{
        graph.addEdge("Write", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#9c27b0"});
      }      
      steps_count++; 
    }
    
    // Create a node and and edge for the created registry key
    if (item.linked_pid == linked_pid && item.operation == "RegCreateKey" && $('#RegCreateKey_filter').is(":checked")){
      if (!graph.nodes().includes("Registry")){
        graph.addNode("Registry", {label: "Registry Hive", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Registry", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }

      if (!graph.nodes().includes("Key Creation")){
        graph.addNode("Key Creation", {label: "Key Creation", size: 10, color: "#FFFFFF"});
        graph.addEdge("Registry", "Key Creation", {type: "arrow", label: "", size: 3, color: "#000000"});
      }
      
      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF", details: item.detail, step: steps_count});
        graph.addEdge("Key Creation", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#e91e63"});
      } 
      else{
        graph.addEdge("Key Creation", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#e91e63"});
      }
      
      steps_count++; 

    }

        // Create a node and and edge for the deleted registry key
        if (item.linked_pid == linked_pid && item.operation == "RegDeleteKey" && $('#RegDeleteKey_filter').is(":checked")){
          if (!graph.nodes().includes("Registry")){
            graph.addNode("Registry", {label: "Registry Hive", size: 10, color: "#FFFFFF"});
            graph.addEdge(selected_item, "Registry", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
          }
    
          if (!graph.nodes().includes("Key Deletion")){
            graph.addNode("Key Deletion", {label: "Key Deletion", size: 10, color: "#FFFFFF"});
            graph.addEdge("Registry", "Key Deletion", {type: "arrow", label: "", size: 3, color: "#000000"});
          }
          
          if (!graph.nodes().includes(item.path)){
            graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF", details: item.detail, step: steps_count});
            graph.addEdge("Key Deletion", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#e91e63"});
          } 
          else{
            graph.addEdge("Key Deletion", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#e91e63"});
          }
          steps_count++; 
        }
    

    // Create a node and and edge for the deleted registry key value
    if (item.linked_pid == linked_pid && item.operation == "RegDeleteValue" && $('#RegDeleteValue_filter').is(":checked")){
      if (!graph.nodes().includes("Registry")){
        graph.addNode("Registry", {label: "Registry Hive", size: 12, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Registry", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }

      if (!graph.nodes().includes("Delete Value")){
        graph.addNode("Delete Value", {label: "Delete Value", size: 10, color: "#FFFFFF"});
        graph.addEdge("Registry", "Delete Value", {type: "arrow", label: "", size: 3, color: "#000000"});
      }

      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF", details: item.detail, step: steps_count});
        graph.addEdge("Delete Value", item.path, {type: "arrow", label: item.operation+ "(" + steps_count + ")", size: 3, color: "#0c797d"});
      }
      else{
        graph.addEdge("Delete Value", item.path, {type: "arrow", label: item.operation+ "(" + steps_count + ")", size: 3, color: "#0c797d"});
      }
      
      steps_count++; 
    }

    // Create a node and and edge for the set registry key value
    if (item.linked_pid == linked_pid && item.operation == "RegSetValue" && $('#RegSetValue_filter').is(":checked")){
      if (!graph.nodes().includes("Registry")){
        graph.addNode("Registry", {label: "Registry Hive", size: 10, color: "#FFFFFF"});
        graph.addEdge(selected_item, "Registry", {type: "arrow", label: "Interacts with", size: 3, color: "#000000"});
      }     

      if (!graph.nodes().includes("Set Value")){
        graph.addNode("Set Value", {label: "Set Value", size: 10, color: "#FFFFFF"});
        graph.addEdge("Registry", "Set Value", {type: "arrow", label: "", size: 3, color: "#000000"});
      }

      if (!graph.nodes().includes(item.path)){
        graph.addNode(item.path, {label: item.path, size: 10, color: "#FFFFFF", details: item.detail, step: steps_count});
        graph.addEdge("Set Value", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#d5572f"});
      } 
      else{
        graph.addEdge("Set Value", item.path, {type: "arrow", label: item.operation + "(" + steps_count + ")", size: 3, color: "#d5572f"});
      }
      
      steps_count++; 
    }
    // Create a node and and edge for the TCP connection
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
        graph.addNode(src_dst[1], {label: src_dst[1], size: 10, color: "#FFFFFF", step: steps_count});
        graph.addEdge(src, src_dst[1], {type: "arrow", label: "dst", size: 3, color: "#d5572f"});
      }
      steps_count++; 
    }
    // Create a node and and edge for the UDP send item
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
        graph.addNode(src_dst[1], {label: src_dst[1], size: 10, color: "#FFFFFF", step: steps_count});
        graph.addEdge(src, src_dst[1], {type: "arrow", label: "dst", size: 3, color: "#d5572f"});
      }
      steps_count++; 
    }

  });
  steps_count--;
  graph.nodes().forEach((node, i) => {
    const angle = (i * 2 * Math.PI) / graph.order;
    graph.setNodeAttribute(node, "x", 100 * Math.cos(angle));
    graph.setNodeAttribute(node, "y", 100 * Math.sin(angle));
  });
  render_graph(graph);
  return graph;
}

/* render_graph:
Take the JSON resulted from the CSV parsing from rust backend and build the graph.
Triggered everytime the user is changing the filters.
*/
function render_graph(graph: Graph){
  // Kill the current canvases to avoid to many WebGL contexts
  if(renderer)
    renderer.kill() 

  renderer = new Sigma(graph, container, {
    nodeProgramClasses: {
      image: getNodeProgramImage(),          
    },
    renderEdgeLabels: true,
    labelSize: 12,
    labelRenderer: drawHover,
    labelRenderedSizeThreshold: 1,
  });
  $('#process_filter').fadeIn();
  $('#filter_card').fadeIn();
  renderer.on("enterNode", (_e) => {
    document.body.style.cursor = 'pointer';
  });

  renderer.on("leaveNode", (_e) => {
    document.body.style.cursor = 'default';
  });

  renderer.on("downNode", (e) => {
    $('#details_body').empty();
    $('#card_details').empty();
    let attributes = graph.getNodeAttributes(e.node);

    if(attributes.label == "Write" || attributes.label == "Read" || attributes.label == "QueryEA" || attributes.label ==  "Key Creation" || attributes.label ==  "Delete Value" || attributes.label == "Set Value" || attributes.label ==  "Key Deletion"){
      for (const {attributes} of graph.neighborEntries(e.node)) {
        const detail = document.createElement('span');
        detail.setAttribute('id','highlight-me');
        const br = document.createElement('br');
        detail.textContent = attributes.step ? "("+attributes.step as string + ") : " + attributes.label as string : attributes.label as string;
        $("#details_body").append(detail);
        $("#details_body").append(br);
      }
    }

    else if (attributes.details != undefined){
      const details = attributes.details.split(",");
      $.each(details, function(_index, item){
        const detail = document.createElement('span');
        detail.setAttribute('id','highlight-me');
        const br = document.createElement('br');
        detail.textContent = item as string;
        $("#details_body").append(detail);
        $("#details_body").append(br);
      });
    }
    else{
      $('#details_body').text(attributes.label);
    }

    $('#details_info').show();
  });
  // Create the spring layout and start it
  const layout = new FA2Layout(graph,{ settings: { gravity: 0.0001,}});
  layout.start();
  setTimeout(function(){
    layout.stop();
  }, 5000);
}

/* update_steps_display:
Updating the graph and the step count on the UI
*/
function update_steps_display(step: number){
  $("#step_count").text(step);
    graph.nodes().map(function(item){
    let attributes = graph.getNodeAttributes(item);
    if (step < attributes.step){
      graph.setNodeAttribute(item, "hidden", true);
    }
    else{
      graph.setNodeAttribute(item, "hidden", false);
    }
  });
}

/* recompute_graph:
When the user is triggering a filter, we rebuild the graph and update the step count
*/
function recompute_graph(json_graph: any){
  graph = display_graph(json_graph);
  $("#steps_range").attr("max", steps_count);
  $("#steps_range").val(steps_count);
  $("#step_count").text(steps_count);
}

/* load : 
Take the dragged and dropped CSV file, send it to rust backend and wait for the result. 
Update the UI in the same time.
*/
async function load(path: string){
  $('#title').fadeOut();
  $('#logo').animate({
    width: 250,
    height: 200,
 });

  $('#loading_scan').removeClass('d-none');
  $('#input_form').addClass('d-none');

  invoke('get_procmon', {path: path}).then((result) => {
    const json_graph = JSON.parse(result as string);
    generate_select(json_graph.processes.processes);
    $('#loading_scan').addClass('d-none');
    $('#process_picker').fadeIn(1500);

    $('#generate_btn').on("click", function(){
        recompute_graph(json_graph)
    });

    $('#RegCreateKey_filter').on("change", function(){
        recompute_graph(json_graph)
    });
   
    $('#RegDeleteKey_filter').on("change", function(){
        recompute_graph(json_graph)
    });

    $('#RegSetValue_filter').on("change", function(){
        recompute_graph(json_graph)
    });

    $('#RegDeleteValue_filter').on("change", function(){
        recompute_graph(json_graph)
    });

    $('#File_filter').on("change", function(){
        recompute_graph(json_graph)
    });

    $('#Network_filter').on("change", function(){
        recompute_graph(json_graph)
    });


  })
  .catch((error) => {
      print_error_message("Error : "+ error);
    }
  );
}


/*
listen_drag :
Listen for file drag and drop and update the UI 
*/
function listen_drag(){
  once('tauri://file-drop-hover', event => {
    $("#import_section").addClass("overlay");
    $("#drag-and-drop-message").addClass("text-white");
    let payload = event.payload
    $("#drag-and-drop-message").text("Perform analysis for " + payload);
  })

  once('tauri://file-drop-cancelled', () => {
    $("#drag-and-drop-message").removeClass("text-white");
    $("#drag-and-drop-message").text("Drag and Drop your CSV here");
    $("#import_section").removeClass("overlay");
    listen_drag(); 
  })
}

/*
routine: 
Display the main menu where the user can drag and drop the CSV.
Triggered at first launch of the application or when the user click the "Quit" button.
*/
function routine(){
    once('tauri://file-drop', async event => {
    let path = event.payload as string;
    await invoke('check_procmon', {path: path[0]}).then(() => {
        $("#import_section").removeClass("overlay");
        load(path[0]);
    })
    .catch((error) => {
      print_error_message("Error : "+ error);
    }
    );
  })

  listen_drag();

  $('#sigma-container').empty();
  $('#dashboard').hide();
  $('#quit').hide();
  $('#process_filter').hide(); 
  $('#filter_card').hide(); 
  $('#title-2').hide(); 
  $('#process_info_card').hide();
  $('#details_info').hide();
  $('#process_picker').hide();
  $('#loading_scan').addClass('d-none');
  $('#input_form').removeClass('d-none');
  $('#load_btn').addClass('btn-outline-secondary').removeClass('btn-outline-success').addClass('disabled');
  $('#import_section').removeClass("d-none");
}


/*
drag_cards : 
Make a card draggable anywhere on the page.
*/
function drag_cards(elmnt: HTMLElement | null) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if(elmnt){
    var header = document.getElementById(elmnt.id + "_header")
    if(header) {
      header.onmousedown = dragMouseDown;
    } else {
        elmnt.onmousedown = dragMouseDown;
    }
  }
  function dragMouseDown(e: any) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = close_drag_cards;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e: any) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    if(elmnt){
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
  }

  function close_drag_cards() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

/*
-------------LISTENERS---------------
*/


$("#steps_range").on("input", (e: any) => {
  const step = e.target.value;
  update_steps_display(step);
});

$(document).on("keydown", function(e: any) { 
  console.log("keydown !")
  if (e.which === 39) { // 39 is the keyCode for the right arrow key
    var step_c = $("#steps_range").val() as number;
    if(step_c < steps_count){
      step_c++;
      $("#steps_range").val(step_c)
      update_steps_display(step_c);
    }
  }
  if (e.which === 37) { 
    var step_c = $("#steps_range").val() as number;
    if(step_c > 0){
      step_c--;
      $("#steps_range").val(step_c)
      update_steps_display(step_c);
    }
  }      
});


$('#quit_btn').on("click", async function(){
  location.reload();
  routine();
});

$('#closebtn').on("click", async function(){
  $('#details_info').hide();
});

document.addEventListener('DOMContentLoaded', () => {
  routine();
});

// function print_info_message(message: string){
//   $('#info-message').text(message);  
//   const toast = new bootstrap.Toast('#info-toast'); 
//   toast.show();
// }  