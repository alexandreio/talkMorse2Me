const path = require('path');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const bodyParser = require('body-parser');

const getTime = () => {
  const d = new Date();

  return `[${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}]`;
}

const log = (msg) => {
  const t = getTime();
  console.log(`${t}: ${msg}`);
}

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res, next) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', socket => {
  socket.username = '';


  socket.on('setUsername', username => {
    socket.username = username;
    log(`Set username: ${username}`);
    socket.broadcast.emit('userConnected', {
      username: socket.username
    });
  });

  socket.on('disconnect', () => {
    log(`The user ${socket.username} disconnect`);
  });

  socket.on('typing', () => {
    log(`${socket.username} are typing...`);
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  socket.on('stopTyping', () => {
    log(`${socket.username} stop typing`);
    socket.broadcast.emit('stopTyping', {
      username: socket.username
    });
  });

  socket.on('sendMessage', msg => {
    socket.broadcast.emit('reciveMessage', msg);
  });
  

});

http.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});