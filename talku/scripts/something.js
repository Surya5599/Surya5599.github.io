// alert("WebSocket is supported by your Browser!");   ALKA: 14513829137484867  MOM SIGN: 9d00bdaedb2b130262f04fdcf93fa3ae    ASHU: 14513822531255167

var UID = '14513829137484867';
var currentQ = 0;
var time = .1;
var answerCorrect = 0;
var maxScore = 1;
    // Let us open a web socket
var ws = new WebSocket('wss://d15wptekiod8mq.cloudfront.net/ws');
ws.onopen = function() {
    // Web Socket is connected, send data using send()

};
function beginChallenge() {

    var yourSelect = document.getElementById( "who" );
    var person =  yourSelect.options[ yourSelect.selectedIndex ].value;
    if(person == "Ashu"){
      UID = '14513822531255167';
    }
    else if(person == "Alka"){
      UID = '14513829137484867'
    }

    currentQ = 0;
    time = .1;
    answerCorrect = 0;
    maxScore = 1;
    finished();
    var e = 'action=challengeGameBegin&uid='.concat(UID);
    var newHash = CryptoJS.MD5(CryptoJS.MD5(e).toString() + '8TB{9Iz7');
    var data = JSON.stringify({
        action: 'challengeGameBegin',
        uid: UID,
        sign: newHash.toString()
    });
    console.log('SENDING: ' + data);
    document.getElementById("question").innerHTML = currentQ;
    maxScore = document.getElementById("myText").value;
    console.log(maxScore);
    ws.send(data);

}

function sendData() {
  console.log("SENDING");
    var t = {
        timeOut: 0,
        answer: answerCorrect,
        totalSpendTime: time * currentQ,
        questionSort: currentQ
    }
    var e = 'action=challengeReport&answer='.concat(t.answer, '&questionSort=').concat(t.questionSort, '&timeOut=').concat(t.timeOut, '&totalSpendTime=').concat(t.totalSpendTime, '&uid=' + UID);
    newHash = CryptoJS.MD5(CryptoJS.MD5(e).toString() + '8TB{9Iz7');
    var some = {
        action: 'challengeReport',
        uid: UID,
        sign: newHash.toString()
    }
    var data = JSON.stringify(Object.assign(t, some));
    console.log('SENDING: ' + data);
    ws.send(data);
}

function endData() {
    if (parseInt(answerCorrect) == 1) {
        answerCorrect = 0;
    } else {
        answerCorrect = 1;
    }
    var t = {
        timeOut: 0,
        answer: answerCorrect,
        totalSpendTime: time * currentQ,
        questionSort: currentQ
    }
    var e = 'action=challengeReport&answer='.concat(t.answer, '&questionSort=').concat(t.questionSort, '&timeOut=').concat(t.timeOut, '&totalSpendTime=').concat(t.totalSpendTime, '&uid=' + UID)
    var newHash = CryptoJS.MD5(CryptoJS.MD5(e).toString() + '8TB{9Iz7')
    var some = {
        action: 'challengeReport',
        uid: UID,
        sign: newHash.toString()
    }
    var data = JSON.stringify(Object.assign(t, some))
    console.log('Sending: ' + data)
    ws.send(data);
    finished();
}

ws.onmessage = function(evt) {
    var str = evt.data;
    console.log('Received: ' + str);
    if (str.search('gameOver') != -1) {
      console.log("GAME OVER");
    } else if (str.search('chooseWhetherToContinue') != -1) {
        var some = { action: 'challengeCancelContinueGame', sign: '423dd3570e2442beef922ad0515cf9a4' }
        var data = JSON.stringify(some);
        console.log("Sending: " + data);
        ws.send(data);
    } else if (str.search('Result":1,"data":"ping') != -1) {
        console.log('everything Good');
    } else {
        var question = str.match(/question":"(.*)","ques/)[1]
        if (question.search('=') != -1) {
            question = question.replace('=', '==');
        }
        if (math.evaluate(question) == true) {
            answerCorrect = 1;
        } else {
            answerCorrect = 0;
        }
        var patt = /questionSort":([1-9][0-9]*)/i;
        var result = str.match(patt);
        currentQ = result[0].replace(/questionSort":/, '');
        console.log("Question: " + currentQ);
        if (parseInt(currentQ) <= parseInt(maxScore)) {
            console.log("Called Sending");
            sendData();
            document.getElementById("question").innerHTML = currentQ;
        }
        if (parseInt(currentQ) > parseInt(maxScore)) {
            endData();
        }
    }
}

function finished() {
  var x = document.getElementById("done");
  if (x.innerHTML === "DONE") {
    x.innerHTML = "RUNNING....";
  } else {
    x.innerHTML = "DONE";
  }
}

ws.onclose = function() {
    // websocket is closed.
    console.log('Connection is closed...')
};
