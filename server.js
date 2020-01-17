// server.js
// where your node app starts

// init project
const express = require("express");
const app = express();

const server = require("http").createServer(app);
const io = require('socket.io')(server);

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});


let queued = null;

io.on('connection', client => {
  let usuario = Usuario(client);
  if (queued != null) makePair(usuario, queued)
  else queued = usuario;
  
  console.log(client.id+" conectou")
  
  client.on('mensagem', data => {
    if (usuario.pair) {
      [usuario.pair.socket, usuario.socket].forEach((socket) => {
        socket.emit('mensagem', {name:usuario.name, text:data.text});
      })
    }
  });
  client.on('change_name', data => {
    console.log('Usuario '+usuario.name+' mudou seu nome para '+data.name)
    usuario.name = data.name
    if (usuario.pair)
      usuario.pair.socket.emit('pair', {name:usuario.name})
  });
  client.on('disconnect', () => {
    console.log(usuario.name+" desconectou")
    if (queued == usuario) queued = null
    else if (usuario.pair) {
        if (queued == null) queued = usuario.pair
        else queued = usuario.pair
        usuario.unpair();
    }
  });
});
  
function makePair(a, b) {
  queued = null;
  
  a.pair = b;
  b.pair = a;
  a.socket.emit('pair', {name:b.name})
  b.socket.emit('pair', {name:a.name})
}

function Usuario(socket) {
  return {
    name:socket.id,
    pair:false,
    socket:socket,
    unpair: function () {
      this.pair.socket.emit('unpair', {})
      this.pair.pair = false
      this.pair = false
    }};
}

const listener = server.listen(3000, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
