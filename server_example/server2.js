// Load required modules
var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var serveStatic = require('serve-static');  // serve static files
var socketIo = require("socket.io");        // web socket external module

// This sample is using the easyrtc from parent folder.
// To use this server_example folder only without parent folder:
// 1. you need to replace this "require("../");" by "require("easyrtc");"
// 2. install easyrtc (npm i easyrtc --save) in server_example/package.json

var easyrtc = require("../"); // EasyRTC internal module

// Set process name
process.title = "node-easyrtc";

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var app = express();
// var router = require('./router/main')(app);
app.use(serveStatic('static', {'index': ['index.html']}));

var strRoomName;

app.get('/demos', function(request, response) {
    var id = request.query.name;
    console.log("id=",id);
    strRoomName = id;

    response.end(`
     <!DOCTYPE html>
<html>
    <head>
        <title>LNSCity Chatroom</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
         <link rel="stylesheet" type="text/css" href="../easyrtc/easyrtc.css" />

        <meta name="viewport" content="width=device-width, minimum-scale=1, maximum-scale=1">
        <script src="/socket.io/socket.io.js"></script>
        <script type="text/javascript" src="../easyrtc/easyrtc.js"></script>
        <link rel="stylesheet" type="text/css" href="css/demo_room.css" />
        <script type="text/javascript" src="js/multiApp.js"></script>
    </head>

       <body onload="appInit('${strRoomName}')">
        <div id="fullpage"  class="boxCommon" style="background-image:url(images/irongrip.png)">
            <video id="box0" class="transit boxCommon thumbCommon easyrtcMirror" muted="muted" volume="0" autoplay="autoplay" playsinline="playsinline"></video>
            <video id="box1" class="transit boxCommon thumbCommon" style="visibility:hidden" autoplay="autoplay" playsinline="playsinline"></video>
            <video id="box2" class="transit boxCommon thumbCommon" style="visibility:hidden" autoplay="autoplay" playsinline="playsinline"></video>
            <video id="box3" class="transit boxCommon thumbCommon" style="visibility:hidden" autoplay="autoplay" playsinline="playsinline"></video>
            <div id="textentryBox" onsubmit="sendText()" style="display:none" >
                <input type="text" id="textentryField"  class="transit boxcommon" /><br>
                <button id="textentrySubmit" style="float:right;margin-right:1em" onclick="sendText()">Send</button>
                <button id="textentryCancel" style="float:left;margin-left:1em" onclick="cancelText()">Cancel</button>
            </div>

            <img id="killButton" class="transit boxCommon" onclick="killActiveBox()" src="images/button_close.png" style="display:none;z-index:3" alt="close button" />
            <img id="muteButton" class="transit boxCommon" onclick ="muteActiveBox()" src="images/button_mute.png" style="display:none;z-index:3" alt="mute button" />
            <img id="textEntryButton" class="transit boxCommon" onclick ="showTextEntry()" src="images/textEntry.png" style="z-index:3;display:none" alt="text button" />
        </div>
    </body>
</html>
    `);


    //  response.end(`
    // <!DOCTYPE html>
    // <html lang="en-US">
    //   <head>
    //     <meta charset="utf-8">
    //     <title>Apply JavaScript example</title>
    //     <link rel="stylesheet" type="text/css" href="/easyrtc/easyrtc.css" />
    //     <script src="/socket.io/socket.io.js"></script>
    //     <script type="text/javascript" src="/easyrtc/easyrtc.js"></script>
    //     <script src="./js/tmpApp.js" async></script>

    //      <!--hide-->
    //      <link rel="stylesheet" type="text/css" href="css/landing.css" />

    //      <!-- Prettify Code -->
    //      <script type="text/javascript" src="js/prettify/prettify.js"></script>
    //      <link rel="stylesheet" type="text/css" href="js/prettify/prettify.css" />
    //      <script type="text/javascript" src="js/prettify/loadAndFilter.js"></script>
    //      <script type="text/javascript" src="js/prettify/jquery.min.js"></script>

    //      <style type="text/css">
    //       .alert img {
    //           float:left;
    //           padding-right: 10px;
    //       }
    //       #sendMessageArea{
    //           float:left;
    //           width:400px;
    //           padding-right:20px;
    //       }
    //       #sendMessageText{
    //           width:100%;
    //       }
    //       #conversation {
    //           height:300px;
    //           border:solid 1px gray;
    //           overflow-y:scroll;
    //       }
    //   </style>
    //   </head>
    //   <body onload="my_init('${strRoomName}')">
    //     <button>Click me</button>

    //     <label for="">Room Name is .....</label>

    //     <input type="text" value='${strRoomName}'>

    //     <div id="otherClients"> </div>
    //     <video  style="float:left" id="self" width="600" height="400"></video>
    //     <div style="position:relative;float:left;width:600px">
    //         <video id="caller" width="600" height="400"></video>
    //     </div>
    //   </body>
    // </html>
    //     `);

});



// Start Express http server on port 8080
var webServer = http.createServer(app);



// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, {"log level":1});


easyrtc.setOption("logLevel", "debug");

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});

        console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});

// Listen on port 8080


webServer.listen(8080, function () {
    console.log('listening on http://localhost:8080');
});
