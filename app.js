const express = require('express');
const randomcolor = require('randomcolor');
// const CryptoJS = require('crypto-js');

const { ROOM_FLOW_CREATE, ROOM_FLOW_JOIN, SOCKET_HUB_CONNECTION, SOCKET_HUB_ROOM, SOCKET_HUB_ROOM_STATUS, SOCKET_HUB_USER, SOCKET_HUB_USER_STATUS, SOCKET_HUB_GET_USERS, SOCKET_HUB_MESSAGE, SOCKET_HUB_TYPING, SOCKET_HUB_DISCONNECT, ERROR_MESSAGE_ROOM_NOT_FOUND, ERROR_MESSAGE_INVALID_ROOM_FLOW, GUID_PREFIX_MESSAGE } = require('./shared/constants');
const { generate_guid } = require('./shared/utils');

const app = express();

// disable x-powered-by header
app.disable('x-powered-by');

// middlewares
app.use(express.static('client'));

// routes
app.get('/', (_, res) => {
  res.sendFile(__dirname + '/client/index.html');
});

const server = app.listen(process.env.PORT || 5000);
const io = require('socket.io')(server);

let users = [];
let rooms = [];
let connections = [];

// manage every connection
io.on(SOCKET_HUB_CONNECTION, socket => {
  connections.push(socket);

  socket.username = 'Anonymous';
  socket.color = randomcolor({
    luminosity: 'light',
  });

  const syncUsers = room => {
    io.sockets.in(room).emit(SOCKET_HUB_GET_USERS, {
      users: users.filter(e => e.room === room)
    });
  }

  // init room for new connection
  socket.on(SOCKET_HUB_ROOM, data => {
    switch (data.flow) {
      case ROOM_FLOW_CREATE: {
        const room = generate_guid(6);

        rooms.push(room);

        socket.room = room;

        socket.emit(SOCKET_HUB_ROOM, {
          room,
        });

        break;
      }

      case ROOM_FLOW_JOIN: {
        const room = rooms.find(e => e === data.room);

        if (!room) {
          socket.emit(SOCKET_HUB_ROOM, {
            error: ERROR_MESSAGE_ROOM_NOT_FOUND,
          });

          return;
        }

        socket.room = room;

        socket.emit(SOCKET_HUB_ROOM, {
          room,
        });

        break;
      }

      default: {
        socket.emit(SOCKET_HUB_ROOM, {
          error: ERROR_MESSAGE_INVALID_ROOM_FLOW,
        });

        return;
      }
    }

    socket.join(socket.room);
  });

  // init user for new connection
  socket.on(SOCKET_HUB_USER, data => {
    const user = {
      id: generate_guid(10),
      username: data.username,
      color: socket.color,
      room: data.room,
    };

    socket.id = user.id;
    socket.username = user.username;

    users.push(user);

    socket.emit(SOCKET_HUB_USER, { user });

    syncUsers(user.room);
  });

  // manage message transfer
  socket.on(SOCKET_HUB_MESSAGE, data => {
    io.sockets.in(socket.room).emit(SOCKET_HUB_MESSAGE, {
      message: {
        ...data.message,
        id: generate_guid(10, GUID_PREFIX_MESSAGE),
      },
      user: {
        id: socket.id,
        name: socket.username,
        color: socket.color,
      },
    });
  });

  // manage typing status transfer
  socket.on(SOCKET_HUB_TYPING, () => {
    socket.broadcast.to(socket.room).emit(SOCKET_HUB_TYPING, {
      userId: socket.id,
    });
  });

  // manage every disconnection
  socket.on(SOCKET_HUB_DISCONNECT, () => {
    users = users.filter(e => e.id !== socket.id);

    const room_empty = !users.find(e => e.room === socket.room);

    if (room_empty) {
      rooms.splice(rooms.indexOf(socket.room), 1);
    } else {
      syncUsers(socket.room);
    }

    connections.splice(connections.indexOf(socket), 1);
  });
});
