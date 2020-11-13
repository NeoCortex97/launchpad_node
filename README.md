# launchpad_node

This project is just a hacked together script to control OBS-Studio via a novation Launchpad.

__Note:__ This repository is the rewrite to make it more usable for people that are neither me nor know javascript verry well.

## Hardware

You obviewously need a novation Launchpad.
I used a Launchpad mk2 to test, but it should work with the other versions as well.

## Software

You need to install node js, but I won't explain how you install this becasue this depends on your operating system.  
[Here is the official node js documentation](https://nodejs.org/en/download/)
Getting some launchpad midi documentation should come in handy too.  
[Here is a document that explains the Launchpad mk2](https://d2xhy469pqj8rc.cloudfront.net/sites/default/files/novation/downloads/10529/launchpad-mk2-programmers-reference-guide-v1-02.pdf)  
[This document explains the Launchpad mk1](https://d2xhy469pqj8rc.cloudfront.net/sites/default/files/novation/downloads/4080/launchpad-programmers-reference.pdf)  
[Here is the obs-websocket documentation](https://github.com/Palakis/obs-websocket/blob/4.x-current/docs/generated/protocol.md)

## Configuration

### Main.json

The main configuration File is located under `config/main.json`.
You will need to change the password to fit the password you set in OBS-Websocket. Not using a password is not advised.  

The `mapping-file` key points to a json file that describes your Layout. You will need to change this if you write your own instead of modifying the default one.  
You can change the speed that the keys blink at with the `blink-bpm` key.

However you should not need to change the `modes` key if you are using the Launchpad mk2. There should be some documantation if you are using a different generation.

The `default-mode` key tells the script which mode it should switch the launchpad to on initialisation. Session mode should be the simplest.

### mapping

You can configure your keys by adding the respective note or controller number to the `keys` object in your mapping file.
A key looks like this: 

```json
 "11":{
      "toggle": true,
      "inactive": {
        "type": "noteon",
        "color": 2,
        "blink": false,
        "pulse": false,
        "alt_color": 0,
        "action": {
          "type": "",
          "params":{}
        }
      },
      "active":{
        "type": "noteon",
        "color": 2,
        "blink": false,
        "pulse": true,
        "alt_color": 5,
        "action": {
          "type": "",
          "params":{}
        }
      }
    },
```

The `toggle` key sets if this key is toggeling states.  
The `inactive` key specifies the led state and actions if the key deactivates.
The `active` key specifies the led state and the actions if the key activates.  
The `color` is a value beween 0 and 127 that specifies the color. 
The `type` key should be `noteon` if the key is not in the top row. If your key is in the top Row this value should be `cc`
The `blink` key tells the script to flash the key between `color` and `alt_color`.
The `pulse` key tells the script to pulse in the `alt_color`.
The `action` specifies what should happen if the key is pressed or released.  
  The `type` key inside `action` is to specify the request send to obs.  
  The `params` key inside `action` is to specify the parameters send with te request.
