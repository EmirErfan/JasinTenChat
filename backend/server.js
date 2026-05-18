const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let waitingUser = null; 
const roomTimers = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('find_match', (username) => {
    socket.username = username;

    if (waitingUser) {
      const roomName = 'room_' + waitingUser.id + '_' + socket.id;
      waitingUser.join(roomName);
      socket.join(roomName);
      io.to(roomName).emit('matched', roomName, waitingUser.username, socket.username);
      startTimer(roomName, 600000);
      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on('send_message', (data) => {
    io.to(data.room).emit('receive_message', data);
  });

  socket.on('extend_time', (data) => {
    clearTimeout(roomTimers[data.room]);
    const newTimeInMilliseconds = (data.timeLeft * 1000) + 300000; 
    startTimer(data.room, newTimeInMilliseconds);
    io.to(data.room).emit('time_extended', 300); 
  });

  // --- NEW: MUTUAL END CHAT FEATURES ---
  
  // 1. User A wants to end
  socket.on('request_end', (data) => {
    // We use socket.to() to send a message ONLY to the other person in the room
    socket.to(data.room).emit('partner_requested_end');
  });

  // 2. User B says NO
  socket.on('decline_end', (data) => {
    socket.to(data.room).emit('partner_declined_end');
  });

  // 3. User B says YES
  socket.on('accept_end', (data) => {
    // Tell both users the chat is over, then destroy the room
    io.to(data.room).emit('chat_ended', "Chat ended by mutual agreement.");
    endRoom(data.room); 
  });

  // --- NEW: IDLE TIMEOUT FEATURE ---
  socket.on('idle_timeout_end', (data) => {
    io.to(data.room).emit('chat_ended', "Chat ended because someone was idle for too long.");
    endRoom(data.room);
  });

  socket.on('disconnect', () => {
    console.log('User left:', socket.id);
    if (waitingUser === socket) waitingUser = null;
  });

  // Helper function for the 10-minute timer
  function startTimer(roomName, duration) {
    roomTimers[roomName] = setTimeout(() => {
      io.to(roomName).emit('chat_ended', "Time is up! The chat has ended.");
      endRoom(roomName);
    }, duration);
  }

  // New Helper function to clean up a room when it ends
  function endRoom(roomName) {
    clearTimeout(roomTimers[roomName]); // Stop the 10-minute timer
    io.socketsLeave(roomName);          // Kick both users out of the room
    delete roomTimers[roomName];        // Delete the memory
  }
});

server.listen(3001, () => {
  console.log('JasinTenChat Server is running on port 3001!');
});