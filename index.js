const path = require('path');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res, next) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', socket => {
  socket.username = '';

  socket.on('disconnect', () => {
    console.log(`The user ${socket.username} disconnect`);
  });

  socket.on('setUsername', username => {
    console.log(`A new user was added with the name: ${username}`);
    socket.username = username;
    socket.broadcast.emit('userConnected', {
      username: socket.username
    });
  });

  socket.on('typing', () => {
    console.log(`${socket.username} are typing...`);
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  socket.on('stopTyping', () => {
    console.log(`${socket.username} stop typing`);
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