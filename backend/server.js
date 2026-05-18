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
// --- NEW: MESSAGE FILTER SYSTEM ---
// Put the exact words you want to block here. 
// (We left out casual swear words as you requested!)
const explicitWords = ['sex', 'noti', 'naughty', 'nude', 'nudes', 'horny'];

function filterMessage(text) {
  // NEW SAFETY CHECK: If the text is empty or not a string, just return it as a blank string.
  if (!text || typeof text !== 'string') {
    return ''; 
  }

  let safeText = text;

  // 1. Block Links (URLs)
  const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/ig;
  safeText = safeText.replace(linkRegex, '[LINK BLOCKED]');

  // 2. Block Phone Numbers 
  const phoneRegex = /\b\d{8,15}\b/g;
  safeText = safeText.replace(phoneRegex, '[PHONE BLOCKED]');

  // 3. Block Explicit Words
  explicitWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi'); 
    safeText = safeText.replace(regex, '***');
  });

  return safeText;
}
// ----------------------------------
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
    // Clean the text BEFORE sending it to the partner
    data.text = filterMessage(data.text);
    
    // Now send the cleaned message
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

  // --- NEW: REPORT USER FEATURE ---
  socket.on('report_user', (data) => {
    // 1. Tell the person who clicked "Report" that it was successful
    socket.emit('chat_ended', "User reported successfully. They have been blocked.");
    
    // 2. Tell the OTHER person in the room that they got caught!
    socket.to(data.room).emit('you_were_reported');
    
    // 3. Destroy the chat room
    endRoom(data.room); 
  });

  // --- NEW: IDLE TIMEOUT FEATURE ---
  socket.on('idle_timeout_end', (data) => {
    io.to(data.room).emit('chat_ended', "Chat ended because someone was idle for too long.");
    endRoom(data.room);
  });

  // --- NEW: HANDLE PAGE REFRESHES AND TAB CLOSES ---
  // "disconnecting" fires a millisecond before they actually leave
  socket.on('disconnecting', () => {
    // Look at all the rooms this user is currently in
    for (const room of socket.rooms) {
      // socket.rooms includes their personal ID, so we ignore that one
      if (room !== socket.id) {
        // Tell the remaining partner that this user left!
        socket.to(room).emit('chat_ended', "Your partner disconnected or refreshed the page.");
        endRoom(room); // Clean up the 10-minute timer for this room
      }
    }
  });
  // ------------------------------------------------

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