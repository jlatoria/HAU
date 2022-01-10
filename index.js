
const chalk = require("chalk");
const boxen = require("boxen");
const prompt = require('readline');
const {performance} = require('perf_hooks');
var sf = require('sf');
const SerialPort = require('serialport');
const fs = require('fs');
const Readline = require('@serialport/parser-readline');
const bindings = require("@serialport/bindings");
const usb = require('usb')
const greeting = chalk.white.bold("USB SERIAL EXPLORER ") + chalk.grey(" By: Joe Latoria \n");
const about = chalk.white("Program Version: 0.0.1 \n");
var mode = chalk.yellow("Raw Data Mode \n");
var warning = chalk.red("WARNING FOR TESTING PURPOSES ONLY! \n");
var log;
var port;
const HID = require("node-hid");

const boxenOptions = {
 padding: 1,
 margin: 0,
 borderColor: "white"
};
var msgBox;
var dict;
var DataMode = "RAW";
var LogData = true;
var DebugMode = true;
var SendData = true;

var data = {};
var isPrompt = false;
var fileData = [];



  // Pipe the data into another stream (like a parser or standard out)


console.clear();
mode = "DataMode: " + DataMode + " \n";
log = "Logging: " + LogData + " \n";
if(DebugMode) {
msgBox = boxen( greeting + about + mode + log + warning + chalk.yellow("DEBUG MODE ACTIVE"), boxenOptions );
} else {
  msgBox = boxen( greeting + about + mode + log + warning, boxenOptions );
}
console.log(msgBox);
console.log("Looking For CP210...");
GetSerialDevices();






function GetSerialDevices() {



/**
 * Get a list of available serial ports.
 * @param {boolean} verbose - Log results if true.
 * @returns {{status: string, data: array|object}} - 'ok' or 'fail' with details to handle elsewhere.
 */
const listPorts = async (verbose) => {
  let result;
  try {
    const portList = await bindings.list();
    if (verbose) {
      console.log(chalk.green("Debug ") + chalk.cyan("Listing All Ports!"))
      console.table(portList);
    }
    // Print out the array if desired.
    result = { status: "ok", data: portList };
    console.log(chalk.green("Success! ") + portList.length + " Ports Found!");
    FindDevice(portList);

  } catch (err) {
    if (verbose) console.log(err); // To see what the error is, if desired.
    result = { status: "fail", data: err };
  }
  return result;
};

// Run the command.
const { portStatus, portList } = listPorts(DebugMode);
}

function FindDevice(data) {

  for (var i = 0; i < data.length; i++) {
    if(data[i].productId == 'ea60') {
      console.log(chalk.green("Success! ") + "Device Found!");
      SetUpPort(data,i);
      setTimeout(function () {

        ClearTitle();
        StartReading();
      }, 5000);

      return;
    }
  }

  console.log(  chalk.red("Error: ") + chalk.white.bold("Failed To Find USB To Serial Module:"));
  console.log(  chalk.green("Potienial Fix: ") + chalk.white("Make sure USB Serial Device is plugged in and that drivers are installed. If device is currently plugged in then try moving it to another USB port and restarting this program!"));
}

function ClearTitle() {
  console.clear();

  msgBox = boxen( greeting + about + mode + log + chalk.green("Reading Data..."), boxenOptions );
    console.log(msgBox);

}

function StartReading() {
  if(SendData) {
  CreatePrompt("Enter Data To Send: ");
  }// Read data that is available but keep the stream in "paused mode"
  port.on('readable', function () {

    var pipe = port.read();
    //console.log(chalk.magenta('Data Readable') + chalk.grey('>>> ') + pipe);
    AddDataToFile(pipe, "read");
    console.log("Data:",pipe,"ascii: " + pipe);

    if(SendData) {
    CreatePrompt("Enter Data To Send: ");
  }

  });





}


function SetUpPort(data,i) {
  var sPortName = data[i].path;
  port = new SerialPort(sPortName);
  var lineStream = port.pipe(new Readline());
  console.log("Port has Been Set To: " + sPortName);
}


function CreatePrompt(prmpt) {
  if(!isPrompt){
  console.log("hi");
  isPrompt = true;
  const rl = prompt.createInterface({
  input: process.stdin,
  output: process.stdout
  });

  rl.question(prmpt, (answer) => {
    if(answer == "/save") {
      SaveData();
    } else if (answer == "/stop") {
      if(LogData) {
      SaveAndShutdown();
    } else if (answer == "/clear") {
        ClearTitle();    
    
    } else {
    port.write(answer);
    AddDataToFile(answer, "write");
    }

    rl.close();
    isPrompt = false;
    CreatePrompt("Enter Data To Send: ");
}

  });
}
}


function AddDataToFile(databuffer, datatype) {
    var dataObj = {
      time: performance.now(),
      data: databuffer,
      type: datatype
    }

    fileData.push(dataObj);
}

function SaveData() {
  try {
  var filename = Date.now() + ".json";
  const data = fs.writeFileSync( filename , JSON.stringify(fileData))
  console.log("Data Saved As " + filename);
  //file written successfully
} catch (err) {
  console.error(err)
}
}

function SaveAndShutdown() {
  try {
  var filename = Date.now() + ".json";
  const data = fs.writeFileSync( filename , JSON.stringify(fileData))
  console.log("Data Saved As " + filename);
  Shutdown();
  //file written successfully
} catch (err) {
  console.error(err)
}
}

function Shutdown() {
  process.exit(1);
}
