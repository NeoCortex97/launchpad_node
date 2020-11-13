// import libraries
const easymidi = require("easymidi");
const OBSWebSocket = require("obs-websocket-js");
const fs = require("fs");
const path = require("path");

// load config
const config = require(path.join(__dirname, "..", "config", "main.json"));
const mappings = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config", config["mappings-file"])));
let activeKeys = [];

// global vaiables
let stopping = true;

// connect to websocket
const obs = new OBSWebSocket();
obs.connect(config["ws-connection"]).then(() => {
  console.log("Sucessfully conntected to OBS");
}).then(() => {
  console.log(`Success! We're connected & authenticated.`);

  return obs.send('GetSceneList');
})
.then(data => {
  console.log(`${data.scenes.length} Available Scenes!`);

  data.scenes.forEach(scene => {
      if (scene.name !== data.currentScene) {
          console.log(`Found a different scene! Switching to Scene: ${scene.name}`);

          obs.send('SetCurrentScene', {
              'scene-name': scene.name
          });
      }
  });
}).catch(err => { // Promise convention dicates you have a catch on every chain.
  console.log(err);
});

// Attach obs listener
obs.on('error', err => {
  console.error('socket error:', err);
});

// enumerate midi devices
const devices = easymidi.getInputs()
const deviceName = devices.find(a => a.includes("Launchpad"));
if(!deviceName){
  console.log("Did not find device that identidies as a Launchpad");
  handleQuit();
}
console.log('Found the following device: "' + deviceName + '"');

// Open midi device and send setup commands
const input = new easymidi.Input(deviceName);
const output = new easymidi.Output(deviceName);
stopping = false;
output.send("sysex", config["modes"][config["default-mode"]]);
Object.keys(mappings["keys"]).forEach((key) =>{
  if (mappings["keys"][key]["inactive"]["type"] === "noteon") {
    parseState(mappings["keys"][key]["inactive"], key).forEach((item) => {
      output.send("noteon", item);
    });
  }
});

// Attach event handler
input.on("noteon", msg => handleMessage("noteon", msg));
input.on("cc", msg => handleMessage("cc", msg));

// Set blink interval
setInterval(() => {
  output.send("clock");
}, config["blink-bpm"] / (1000 * 60));


// make this run endlessly
const blinkInterval = setInterval(function() {
  console.log("timer that keeps nodejs processing running");
}, 1000 * 60 * 60);

// Set quit listener
process.on('SIGINT', handleQuit);
process.on('SIGTERM', handleQuit);


// Functions
function handleMessage (type, msg) {
  console.log(msg);
  if(type === "noteon" && mappings["keys"][msg.note]){
    if(msg.velocity >= 64){
      if (mappings["keys"][msg.note]["toggle"] && !activeKeys.includes(msg.note)) {
        parseState(mappings["keys"][msg.note]["active"], msg.note).forEach((item) => {
          output.send("noteon", item);
          if (mappings["keys"][msg.note]["active"]["action"]) {
            obs.send(mappings["keys"][msg.note]["active"]["action"]["type"],
            mappings["keys"][msg.note]["active"]["action"]["params"]);
          }
        });
        activeKeys.push(msg.note);
      }else if (mappings["keys"][msg.note]["toggle"] && activeKeys.includes(msg.note)){
        parseState(mappings["keys"][msg.note]["inactive"], msg.note).forEach((item) => {
          output.send("noteon", item);
        });
        activeKeys.splice(activeKeys.indexOf(msg.note));
      }else{
        parseState(mappings["keys"][msg.note]["active"], msg.note).forEach((item) => {
          if (mappings["keys"][msg.note]["active"]["action"]) {
            obs.send(mappings["keys"][msg.note]["active"]["action"]["type"],
                     mappings["keys"][msg.note]["active"]["action"]["params"]);
          }
          output.send("noteon", item);
        });
      }
    }else if (!mappings["keys"][msg.note]["toggle"]){
      parseState(mappings["keys"][msg.note]["inactive"], msg.note).forEach((item) => {
        output.send("noteon", item);
      });
    }
  }
  // output.send(type, msg);
}

function handleQuit() {
  if (!stopping) {
      stopping = true;

      // Close midi devices
      input.close();
      output.close();

      // clear intervals
      clearInterval(blinkInterval);

      console.log("Bye bye");
      process.exit();
  }
}

function parseState(config, key) {
  let res = [];
  res.push(mkMeassage(config["type"], 0, key, config["color"]));
  if(config["blink"] === true){
    res.push(mkMeassage(config["type"], 1, key, config["alt_color"]));
  }else if(config["pulse"] === true){
    res.push(mkMeassage(config["type"], 2, key, config["alt_color"]));
  }
  return res;
}

function mkMeassage(type, channel, key, val){
  if(type === "noteon"){
    return {channel: channel, note: key, velocity: val};
  }else if(type === "cc"){
    return {channel: channel, controller: key, value: val};
  }
}