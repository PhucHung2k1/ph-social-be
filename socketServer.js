let users = [];

const EditData = (data, id, call) => {
  const newData = data.map((item) =>
    item.id === id ? { ...item, call } : item
  );
  return newData;
};

const SocketServer = (socket) => {
  // connect - disconnect
  socket.on('joinUser', (user) => {
    users.push({
      id: user._id,
      socketId: socket.id,
      followers: user.followers,
    });
    // console.log({ users });
    // console.log(socket.id);
  });

  socket.on('disconnect', () => {
    const data = users.find((user) => user.socketId === socket.id);
    if (data) {
      const clients = users.filter((user) =>
        data.followers.find((item) => item._id === user.id)
      );

      if (clients.length > 0) {
        clients.forEach((client) => {
          socket.to(`${client.socketId}`).emit('CheckUserOffline', data.id);
        });
      }

      if (data.call) {
        const callUser = users.find((user) => user.id === data.call);
        if (callUser) {
          users = EditData(users, callUser.id, null);
          socket.to(`${callUser.socketId}`).emit('callerDisconnect');
        }
      }
    }

    users = users.filter((user) => user.socketId !== socket.id);
  });

  //post
  socket.on('updatePost', (newPost) => {
    const ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));

    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit('updatePostToClient', newPost);
      });
    }
  });
  // likes

  socket.on('likePost', (newPost) => {
    const ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));

    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit('likeToClient', newPost);
      });
    }
  });
  socket.on('unLikePost', (newPost) => {
    const ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));

    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit('unLikeToClient', newPost);
      });
    }
  });
  // Comments
  socket.on('createComment', (newPost) => {
    const ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));

    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit('createCommentToClient', newPost);
      });
    }
  });

  socket.on('deleteComment', (newPost) => {
    const ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));

    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit('deleteCommentToClient', newPost);
      });
    }
  });

  socket.on('updateComment', (newPost) => {
    const ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));

    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit('updateCommentToClient', newPost);
      });
    }
  });

  socket.on('likeComment', (newPost) => {
    const ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));

    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit('likeCommentToClient', newPost);
      });
    }
  });

  socket.on('unLikeComment', (newPost) => {
    const ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));

    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit('unLikeCommentToClient', newPost);
      });
    }
  });
  // follow

  socket.on('follow', (newUser) => {
    const user = users.find((user) => user.id === newUser._id);
    user && socket.to(`${user.socketId}`).emit('followToClient', newUser);
  });

  socket.on('unFollow', (newUser) => {
    const user = users.find((user) => user.id === newUser._id);
    user && socket.to(`${user.socketId}`).emit('unFollowToClient', newUser);
  });

  // Notification
  socket.on('createNotify', (msg) => {
    console.log('🚀 ~ file: socketServer.js:149 ~ socket.on ~ msg:', msg);
    const client = users.find((user) => msg.recipients.includes(user.id));
    client && socket.to(`${client.socketId}`).emit('createNotifyToClient', msg);
  });

  socket.on('removeNotify', (msg) => {
    const client = users.find((user) => msg.recipients.includes(user.id));
    client && socket.to(`${client.socketId}`).emit('removeNotifyToClient', msg);
  });
  // message
  socket.on('addMessage', (msg) => {
    const user = users.find((item) => item.id === msg.recipient);
    user && socket.to(`${user.socketId}`).emit('addMessageToClient', msg);
  });
  socket.on('removeMessage', (msg) => {
    const user = users.find((item) => item.id === msg.recipient);
    user && socket.to(`${user.socketId}`).emit('removeMessageToClient', msg);
  });

  // Check User Online / Offline
  socket.on('checkUserOnline', (data) => {
    const following = users.filter((user) =>
      data.following.find((item) => item._id === user.id)
    );
    socket.emit('checkUserOnlineToMe', following);

    const clients = users.filter((user) =>
      data.followers.find((item) => item._id === user.id)
    );

    if (clients.length > 0) {
      clients.forEach((client) => {
        socket
          .to(`${client.socketId}`)
          .emit('checkUserOnlineToClient', data._id);
      });
    }
  });

  //call
  socket.on('callUser', (data) => {
    users = EditData(users, data.sender, data.recipient);

    const client = users.find((user) => user.id === data.recipient);

    if (client) {
      if (client.call) {
        socket.emit('userBusy', data);
        users = EditData(users, data.sender, null);
      } else {
        users = EditData(users, data.recipient, data.sender);
        socket.to(`${client.socketId}`).emit('callUserToClient', data);
      }
    }
  });
  //end call
  socket.on('endCall', (data) => {
    const client = users.find((user) => user.id === data.sender);

    if (client) {
      socket.to(`${client.socketId}`).emit('endCallToClient', data);
      users = EditData(users, client.id, null);

      if (client.call) {
        const clientCall = users.find((user) => user.id === client.call);
        clientCall &&
          socket.to(`${clientCall.socketId}`).emit('endCallToClient', data);

        users = EditData(users, client.call, null);
      }
    }
  });
};
module.exports = SocketServer;
