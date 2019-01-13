const LETTERS = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', ',', ':', '?', '\'', '-', '/', '(', ')', '"', '@', '=', ' '];
const CODES = [ '.-', '-...', '-.-.', '-..', '.', '..-.', '--.', '....', '..', '.---', '-.-', '.-..', '--', '-.', '---', '.--.', '--.-', '.-.', '...', '-', '..-', '...-', '.--', '-..-', '-.--', '--..', '.----', '..---', '...--', '....-', '.....', '-....', '--...', '---..', '----.', '-----', '.-.-.-', '--..--', '---...', '..--..', '.----.', '-....-', '-..-.', '-.--.-', '-.--.-', '.-..-.', '.--.-.', '-...-', '/'];

const morseToText = message => {
  return message.split('').map((l, i) => {
    const letterIndex = LETTERS.findIndex(i => i === l);
    return CODES[letterIndex];
  }).join(' ');
}

const createUsername = (cb) => {
  const usernameForm = document.querySelector('.username-form');
  const b = document.querySelector('#create-username');

  usernameForm.className = 'username-form';
  
  b.addEventListener('click', e => {
    e.preventDefault();
    const usernameInput = document.querySelector('#u');
    const formUsername = document.querySelector('.form-username');
    const username = usernameInput
      .value
      .trim()
      .toLowerCase()
      .split(' ')
      .join('-');

    formUsername.className = 'form-control form-username';

    if(username.length <= 0) {
      username = '';
      formUsername.className += ' shake-div';
    }
    else {
      localStorage.setItem('username', username);
      usernameForm.className += ' hide';
      return cb(); 
    }
  });
}

const updateInnerHTML = (el, html) => {
  const elDiv = document.querySelector(el);
  elDiv.innerHTML = html;
}

const createLi = data => {
  const {op, username, normalMsg, morseMsg} = data;
  
  const li = document.createElement('li');
  li.dataset.username = username;
  li.dataset.normalMsg = normalMsg;
  li.dataset.morseMsg = morseMsg;

  li.innerHTML = `<b>${username}:</b> ${op === 0 ? morseMsg : normalMsg}`;
  return li;
}

const playNotification = () => {
  const context = new AudioContext();
  const o = context.createOscillator();
  const  g = context.createGain();
  o.type = "triangle";
  o.connect(g);
  g.connect(context.destination);
  o.start(0);
  g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2);
  o.stop(2);
}

const getSwapMsgOp = () => {
  const swapMsg = document.querySelector('#swapMsg');
  return parseInt(swapMsg.dataset.op);
}

const userConnectedHandler = (data, username) => {
  if(data.username !== username) {
    updateInnerHTML('.chatInfo', `${data.username} has joined...`);
    setTimeout(() => {
      updateInnerHTML('.chatInfo', '');
    }, 1200);
  }
}

const userIsTypingHandler = (e, socket) => {
  let typing = false;
  let msg = e.target.value.trim();

  if(!typing && msg.length > 0) {
    typing = true;
    socket.emit('typing');
  }else {
    socket.emit('stopTyping');
    typing = false;
  }

  let = lastTypingTime = (new Date()).getTime();
  setTimeout(() => {
    const typingTimer = (new Date()).getTime();
    const timeDiff = typingTimer - lastTypingTime;

    if(timeDiff > 500 && typing) {
      socket.emit('stopTyping');
      typing = false;
    }

  }, 500);

}

const sendMessageHandler = (e, username, socket) => {
  e.preventDefault();
  
  const m = document.querySelector('#m');
  const ul = document.querySelector('ul');
  const op = getSwapMsgOp();
  const normalMsg = m.value.normalize('NFD').replace(/[\u0300-\u036f]/g, "");

  if(normalMsg.length <= 0) {
    return false;
  }

  const morseMsg = morseToText(normalMsg);

  const li = createLi({op, username, normalMsg, morseMsg});
  ul.appendChild(li);
  socket.emit('sendMessage', {username, normalMsg, morseMsg});
  m.value = '';

  return false;
}

const reciveMessageHandler = data => {
  const op = getSwapMsgOp();
  const ul = document.querySelector('ul');
  const {username, normalMsg, morseMsg} = data;
  const li = createLi({op, username, normalMsg, morseMsg});
  playNotification();
  ul.append(li);
}

const swapMsgsHandler = e => {
  e.preventDefault();

  const op = getSwapMsgOp();
  const liEls = document.querySelectorAll('li');
  
  liEls.forEach(li => {
    const {username, normalMsg, morseMsg} = li.dataset;
    li.innerHTML = `<b>${username}:</b> ${op === 0 ? normalMsg: morseMsg}`;
  });

  e.target.parentNode.dataset.op = op ^ 1;
  if(parseInt(e.target.parentNode.dataset.op) === 1) {
    e.target.parentNode.innerHTML = '<i class="fas fa-eye-slash"></i>';
  }else {
    e.target.parentNode.innerHTML = '<i class="fas fa-eye"></i>';
  }

  return false;
}

const displayUserIsTyping = data => {
  updateInnerHTML('.chatInfo', `${data.username} is typing...`);
}

const userStoppedTyping = () => {
  updateInnerHTML('.chatInfo', '');
}

{
  const socket = io();
  const m = document.querySelector('#m');
  let username = localStorage.getItem('username');
  const swapMsg = document.querySelector('#swapMsg');
  const sendMessage = document.querySelector('#send-message');
  

  if(!username) {
    createUsername(() => {
      username = localStorage.getItem('username');
      socket.emit('setUsername', username);
    });
  }else {
    socket.emit('setUsername', username);
  }

  m.addEventListener('keydown', e => userIsTypingHandler(e, socket));
  sendMessage.addEventListener('click', e => sendMessageHandler(e, username, socket));
  swapMsg.addEventListener('click', swapMsgsHandler);

  socket.on('userConnected', data => userConnectedHandler(data, username));
  socket.on('typing', data => displayUserIsTyping(data));
  socket.on('stopTyping', _ => userStoppedTyping());
  socket.on('reciveMessage', reciveMessageHandler);


}