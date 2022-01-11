
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

var echoList = "";

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

var timeout;

var pairs = {};

var lastMessage = '';
var storeBuffer;
var activeCreatePair = false;


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
/* PLEASE FIX

Possible issues relating the notation on linux vs windows, should be agnostic of capilization, store as hex
or ignore case;

*/
  for (var i = 0; i < data.length; i++) {
    if(data[i].productId == 'EA60') {
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
    lastMessage += pipe;
    if(timeout != undefined) {
      clearTimeout(timeout);
      timeout =  setTimeout(() => {
        console.log("done");

      }, 1000);
    } else {
      timeout =  setTimeout(() => {

        console.log("done");
      }, 1000);
    }

    //console.log(chalk.magenta('Data Readable') + chalk.grey('>>> ') + pipe);

    console.log("Data:",pipe,"ascii: " + pipe);

    if(SendData) {
    CreatePrompt("Enter Data To Send: ");
  }

  });





}


function CreatePair() {
  activeCreatePair = true;
  console.log("[PAIRS] Creating Key Pair: Please Activate Prgrogammer Then Wait Till Buffer Is Stored.");
  console.log("[PAIRS] Once Buffer Is Stored Console Will Say Done. Then Type '/pair store'for next instructions");


}

function Storebuffer() {
  if(activeCreatePair) {
    if(lastMessage != "") {
      storeBuffer = new Buffer.from(lastMessage, "utf-8");
      lastMessage = "";
      console.log("[PAIRS] "+ storeBuffer.inspect() " Has Been Stored As Pair One");
      console.log("[PAIRS] Will Await Next Input Buffer Once Done. Type '/pair finish' ");
    } else {
      console.log("[PAIRS] Last Message Is Empty Ensure A Buffer Has Finished Before Retrying");
    }
  } else {
    console.log("[PAIRS] No Active Pair Creation. Please Type '/pair create first!'");
  }
}

function FinishPair() {
  if(activeCreatePair) {
    if(storeBuffer != undefined) {
      const tempBuffer = new Buffer.from(lastMessage, "hex");
      pairs[storeBuffer.toString()] = tempBuffer;
      console.log("[PAIRS] KEYPAIR ADDED: " + storeBuffer.toString() + " : " + tempBuffer.toString());
      activeCreatePair = false;
      console.log("[PAIRS] EXITING PAIRS! BUFFERS WILL BE CLEARED!");
      lastMessage = "";
    }
  } else {
    console.log("[PAIRS] No Active Pair Creation. Please Type '/pair create' first!");
  }
}


function SetUpPort(data,i) {
  var sPortName = data[i].path;
  port = new SerialPort(sPortName, {
  baudRate: 4800
})
  var lineStream = port.pipe(new Readline());
  console.log("Port has Been Set To: " + sPortName);
}


function CreatePrompt(prmpt) {
  if(!isPrompt){

  isPrompt = true;
  const rl = prompt.createInterface({
  input: process.stdin,
  output: process.stdout
  });

  rl.question(prmpt, (answer) => {


    if(answer.includes('/')) {
      CommandParse(answer);
    } else {
    port.write(answer);

  }





rl.close();
isPrompt = false;
CreatePrompt("Enter Data To Send: ");
  });
}
}



function SaveData(data) {
  let now = new Date();
  const buff = Buffer.from(lastMessage, "utf-8");
  echoList += "[H"+ now.getHours() + ":M" + now.getMinutes() + ":S" + now.getSeconds() + "] [ECHO] " + buff.inspect() + " " + lastMessage + "\n";

}

String.prototype.hexEncode = function() {
    var hex, i;

    var result = "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }

    return result
}

function SaveAndShutdown() {


  try {
  var filename = Date.now() + ".txt";
  const data = fs.writeFileSync( filename , echoList);
  console.log("Data Saved As " + filename);
  Shutdown();
  //file written successfully
} catch (err) {
  console.error(err)
}
}


//Closes The Program
function Shutdown() {
  process.exit(1);
}


//Echos The Data Last Received Clears Data Once Called
function Echo() {
  if(lastMessage != '') {
    console.log("[ECHO] " + lastMessage);
    port.write(lastMessage);
    console.log("[ECHO] Clearing Last Message");
    SaveData();
    lastMessage = "";
  } else {
    console.log("[ECHO] Echo Buffer Empty, No Recent Data")
  }
}


//Write A String To The Tool
function Write(str) {
  port.write(answer);

}

//Clears The Console Only, Logs Are Kept
function ClearConsole() {
  ClearTitle();
}



//Takes A Raw String And Breaks It Into An Array Based On Spaces

function CommandParse(cmdStr) {
  var args = [];
  var lastPos = 0;
  var cmd = cmdStr;

  for(var i = 0; i < cmdStr.length; i++) {
    if(cmdStr.charAt(i) == ' ') {
      if(args.length == 0) {
        cmd = mdStr.slice(lastPos, i - 1);
      } else {
        args.push(cmdStr.slice(lastPos, i - 1));
      }

      lastPos = i + 1;
    }
  }


  FindCommand(cmd,args);
}

function FindCommand(cmd, args) {

  if(cmd != '') {
  cmd = cmd.replace("/", "");
  switch(cmd) {
    case "echo":
      Echo();
    break;
    case "stop":
      SaveAndShutdown();
    break;
    default:
    console.log("Error: Command /" + cmd + " Is Not Recognized");
  }
}

}
