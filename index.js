var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var child_process = require('child_process');

app.use(express.static('static'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
io.on('connection', function(socket){
  console.log('a user connected');
  var aiProcess = child_process.spawn('/Users/wxy/Projects/cpp/Othello_Server/main',[1]
    , { stdio: ['pipe', 'pipe', process.stderr] });
  aiProcess.stdout.on('data', function (data) {
    
    data = data.toString('ascii').trim();
    console.log('stdout: ' + data);
    pos = data.split(',');
    socket.emit('choose',{
        "row":pos[0],
        "col":pos[1]
    });
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
    aiProcess.kill();
  });
  socket.on('choose', function(msg){
    console.log('human choose:' + msg["row"]+","+msg["col"]);
    aiProcess.stdin.write(msg["row"]+" "+msg["col"] + "\n");
  });


});

http.listen(4000, function(){
  console.log('listening on *:4000');
});