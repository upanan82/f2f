const initModal = document.querySelector('#init-modal');
const loaderModal = document.querySelector('#loading-modal');
const chatroom = document.querySelector('#chatroom');
const newMessageBar = document.querySelector('#new-message-bar');


const room = document.querySelector('#room-key');
const online = document.querySelector('#online-users');
const message = document.querySelector('#message');

let typingTimeout = {};
let stopAutoScroll = false;
let unreadMessageCount = 0;

var user;

var start = glob => {
  showLoaderModal();

  const socket = io.connect('http://localhost:5000');

  socket.on('get users', data => {
    hideLoaderModal();
    hideInitModal();

    const html = data.users.map(e => {
      return `<span id="id-${e.id}" class="list-item" style="color: ${e.color}">${e.username}</span>`;
    });

    online.innerHTML = html.join('');
  });

  socket.on('user', data => {console.log(data)
    user = data.user;
  });

  socket.on('room', data => {console.log(data)
    if (data.error) {
      hideLoaderModal(() => {
        setTimeout(() => {
          alert(data.error);
        }, 100);
      });

      return;
    }

    room.innerHTML = data.room;

    document.title = `${data.room} - Face to Face`

    socket.emit('user', {
      username: glob.username,
      room: data.room,
    });
  });

  socket.emit('room', {
    flow: glob.flow,
    room: glob.room || null,
  });

  const sendMessage = () => {
    const value = message.value;

    if (!value) {
      return;
    }

    socket.emit('message', { message: { content: CryptoJS.AES.encrypt(value, user.room).toString() }});

    message.value = '';
  };

  message.addEventListener('keydown', e => {
    const keyCode = (e.keyCode ? e.keyCode : e.which);

    if (keyCode == '13') {
      sendMessage();
    } else {
      socket.emit('typing');
    }
  });

  socket.on('message', data => {
    const usernameElement = document.querySelector(`#id-${data.user.id}`);

    usernameElement.classList.remove('typing');

    chatroom.innerHTML += (`
      <div class="msg ${data.user.id === user.id ? 'right' : ''}">
        <div class="box3">
          <p style='color:${data.user.color}' class="chat-text user-nickname" data-time="${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}">${data.user.name}</p>
          <p class="chat-text">${CryptoJS.AES.decrypt(data.message.content, user.room).toString(CryptoJS.enc.Utf8)}</p>
        </div>
      </div>
    `);

    if (!stopAutoScroll || data.userId === user.id) {
      unreadMessageCount = 0;

      hideNewMessageBar();
      keepTheChatRoomToTheBottom();
    } else {
      unreadMessageCount++;

      showNewMessageBar();
    }
  });

  chatroom.addEventListener('scroll', () => {
    if (Math.abs(chatroom.scrollHeight - chatroom.clientHeight - chatroom.scrollTop) >= 35) {
      stopAutoScroll = true;
    } else {
      stopAutoScroll = false;

      unreadMessageCount = 0;
      hideNewMessageBar();
    }
  });

  newMessageBar.addEventListener('click', () => {
    keepTheChatRoomToTheBottom();
  });

  socket.on('typing', data => {
    const usernameElement = document.querySelector(`#id-${data.userId}`);

    if (data.userId === user.id) {
      return;
    }

    usernameElement.classList.add('typing');

    if (typingTimeout[data.userId]) {
      clearTimeout(typingTimeout[data.userId]);
    }

    typingTimeout[data.userId] = setTimeout(() => {
      usernameElement.classList.remove('typing');
    }, 2000);
  });
};

// function thats keeps the chatbox stick to the bottom
const keepTheChatRoomToTheBottom = () => {
  chatroom.scrollTop = chatroom.scrollHeight - chatroom.clientHeight;
}

const hideInitModal = callback => {
  setTimeout(() => {
    initModal.style.display = 'none';

    if (callback) {
      callback();
    }
  });
};

const hideLoaderModal = callback => {
  setTimeout(() => {
    loaderModal.style.display = 'none';

    if (callback) {
      callback();
    }
  }, 500);
};

const showLoaderModal = () => {
  loaderModal.style.display = 'flex';
};

const showNewMessageBar = () => {
  newMessageBar.innerHTML = `New message (${unreadMessageCount})`;
  newMessageBar.style.display = 'flex';
}

const hideNewMessageBar = () => {
  newMessageBar.style.display = 'none';
}
