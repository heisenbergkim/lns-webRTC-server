const buttons = document.querySelector('button');
const input = document.querySelector('input');

buttons.addEventListener('click', updateName);

var strRoomName ;
// console.log(myinput.textContent);

// mybutton.addEventListener('click', my_init );
function updateName() {
    // let name = prompt('Enter a new name');
    strRoomName = input.value;
    // para.textContent = 'Player 1: ' + name;

     connect();
}



function my_init() {
         easyrtc.setRoomOccupantListener( loggedInListener);
         easyrtc.easyApp(strRoomName, "self", ["caller"],
             function(myId) {
                console.log("My easyrtcid is " + myId);
             }
         );
     }


     function loggedInListener(roomName, otherPeers) {
        var otherClientDiv = document.getElementById('otherClients');
        while (otherClientDiv.hasChildNodes()) {
            otherClientDiv.removeChild(otherClientDiv.lastChild);
        }
        for(var i in otherPeers) {
            var button = document.createElement('button');
            button.onclick = function(easyrtcid) {
                return function() {
                    performCall(easyrtcid);
                }
            }(i);

            label = document.createTextNode(i);
            button.appendChild(label);
            otherClientDiv.appendChild(button);
        }
    }


    function performCall(easyrtcid) {
        easyrtc.call(
           easyrtcid,
           function(easyrtcid) { console.log("completed call to " + easyrtcid);},
           function(errorMessage) { console.log("err:" + errorMessage);},
           function(accepted, bywho) {
              console.log((accepted?"accepted":"rejected")+ " by " + bywho);
           }
       );
    }
// <!-- instant message -->
var selfEasyrtcid = "";

function connect() {
    easyrtc.setPeerListener(addToConversation);
    easyrtc.setRoomOccupantListener(convertListToButtons);

    my_init();
    easyrtc.connect("easyrtc.instantMessaging", loginSuccess, loginFailure);
}



function addToConversation(who, msgType, content) {
  // Escape html special characters, then add linefeeds.
  content = content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  content = content.replace(/\n/g, "<br />");
  document.getElementById("conversation").innerHTML +=
  "<b>" + who + ":</b>&nbsp;" + content + "<br />";
}




function convertListToButtons (roomName, occupants2, isPrimary) {
  var otherClientDiv = document.getElementById("otherClientsIM");
  while (otherClientDiv.hasChildNodes()) {
    otherClientDiv.removeChild(otherClientDiv.lastChild);
  }

  for(var easyrtcid2 in occupants2) {
    var button = document.createElement("button");
    button.onclick = function(easyrtcid) {
      return function() {
        sendStuffWS(easyrtcid2);
      };
    }(easyrtcid2);
    var label = document.createTextNode("Send to " + easyrtc.idToName(easyrtcid2));
    button.appendChild(label);

    otherClientDiv.appendChild(button);
  }
  if( !otherClientDiv.hasChildNodes() ) {
    otherClientDiv.innerHTML = "<em>Nobody else logged in to talk to...</em>";
  }
}


function sendStuffWS(otherEasyrtcid) {
  var text = document.getElementById("sendMessageText").value;
  if(text.replace(/\s/g, "").length === 0) { // Don"t send just whitespace
    return;
  }

  easyrtc.sendDataWS(otherEasyrtcid, "message",  text);
  addToConversation("Me", "message", text);
  document.getElementById("sendMessageText").value = "";
}


function loginSuccess(easyrtcid2) {
  selfEasyrtcid = easyrtcid2;
  document.getElementById("iam").innerHTML = "I am " + easyrtcid2;
}


function loginFailure(errorCode, message) {
  easyrtc.showError(errorCode, message);
}