var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var child_process = require('child_process');
var hashcash = require("./hashcash");

app.use(express.static('static'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
io.on('connection', function (socket) {
    let aiProcess = "";
    let isAuthed = false;
    let ip = socket.request.connection.remoteAddress;
    let challenge = hashcash.getChallenge(ip, "othello");

    console.log(ip+' connected');

    socket.on('request_auth',  () =>{
        console.log(ip+' request auth');
        socket.emit('challenge',challenge)
    });

    

    socket.on('auth',  (data) =>{
        if(isAuthed) return;
        console.log(ip+' start auth');
        if(!data){
            return ;
        }

        if(hashcash.isSolution(challenge,data)){
            console.log(ip+' authed success!');
            challenge = hashcash.getChallenge(ip, "othello");
            if (aiProcess === ""){
                aiProcess = child_process.spawn('/home/othello/Othello_Server', [1], {
                    stdio: ['pipe', 'pipe', process.stderr]
                });
                isAuthed = true;
                aiProcess.stdout.on('data', (data) => {            
                    data = data.toString('ascii').trim();
                    if (data.indexOf("WHITEWIN") != -1) {
                        socket.emit('showmessage', "N1CTF{Oh!you_1ose_t0_AI_hhhhhh}");
                        aiProcess.kill();
                        isAuthed = false;
                        return;
                    }
                    console.log(ip+' stdout: ' + data);
                    pos = data.split(',');
                    socket.emit('choose', {
                        "row": pos[0],
                        "col": pos[1]
                    });
                });
                socket.emit('start')
            }
        }else{
            console.log(ip+" wrong nonce");
            socket.emit('showmessage', "wrong nonce");
        }
    });

    

    socket.on('disconnect', ()=> {
        console.log(ip+' user disconnected');
        if(!isAuthed) return;
        if(aiProcess!=="")
            aiProcess.kill();
    });
    socket.on('choose', (msg) => {
        if(!isAuthed) return;
        if( !("row" in msg) || !("col") in msg ){
            return ;
        }
        console.log(ip+' human choose:' + msg["row"] + "," + msg["col"]);
        if (msg["row"] < 0 || msg["row"] > 7) msg["row"] = 0;
        if (msg["col"] < 0 || msg["col"] > 7) msg["col"] = 0;
        aiProcess.stdin.write(msg["row"] + " " + msg["col"] + "\n");
    });


});

http.listen(4000, function () {
    process.on('uncaughtException', function (err) {
    console.log(err);
    console.log(err.stack);
    });
    console.log('listening on *:4000');
});