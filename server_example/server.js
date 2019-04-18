// Load required modules
var http    = require("http");              // http server core module
var https   = require("https");             // https server core module
var express = require("express");           // web framework external module
var serveStatic = require('serve-static');  // serve static files
var socketIo = require("socket.io");        // web socket external module
var easyrtc = require("../");               // EasyRTC external module

var fs = require("fs");



// Development===================
// var privateKey  = fs.readFileSync('/home/ericnjin/lnscity-webrtc-server/key.pem', 'utf8');
// var certificate = fs.readFileSync('/home/ericnjin/lnscity-webrtc-server/cert.pem', 'utf8');

// production ==================
var privateKey  = fs. readFileSync('/etc/letsencrypt/live/rtc.ailns.com/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/letsencrypt/live/rtc.ailns.com/fullchain.pem', 'utf8');

var credentials = {key: privateKey, cert: certificate};

// Set process name
process.title = "node-easyrtc";

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var app = express();
// app.use(serveStatic('static', {'index': ['index.html']}));

//Router
var router = require('./router/main')(app);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.static('public'));

var strRoomName;



// Start Express http server on port 8080
var webServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(/*webServer*/httpsServer, {"log level":1});

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

//listen on port 80
//webServer.listen(80, function () {
//    console.log('listening on http://rtc.ailns.com:80');
//});

//listen on port 443
httpsServer.listen(443, function () {
    console.log('listening on http://rtc.ailns.com:443');
});

