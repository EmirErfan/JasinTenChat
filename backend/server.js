// 1. Import the tools we downloaded
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// 2. Set up the basic server
const app = express();
app.use(cors());
const server = http.createServer(app);

// 3. Set up Socket.io for real-time messaging
const io = new Server(server, {
  cors: {
    origin: "*", // Allow our frontend website to connect to this server
  }
});

// We will use this to remember if someone is waiting for a chat
let waitingUser = null; 

// We will use this to keep track of the timers for each room
const roomTimers = {};

// 4. What happens when a user connects to the website
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When a user types their name and clicks "Search for Chat"
  socket.on('find_match', (username) => {
    // Save their username to their connection
    socket.username = username;

    if (waitingUser) {
      // YES! Someone is waiting. Let's match them.
      const roomName = 'room_' + waitingUser.id + '_' + socket.id;
      
      // Put both users into this private room
      waitingUser.join(roomName);
      socket.join(roomName);

      // Tell both users they are matched and send them each other's names
      io.to(roomName).emit('matched', roomName, waitingUser.username, socket.username);

      // Start the 10-minute countdown timer (10 minutes = 600,000 milliseconds)
      startTimer(roomName, 600000);

      // Clear the waiting room so the next person starts a new line
      waitingUser = null;
    } else {
      // NOBODY is waiting. This person has to wait.
      waitingUser = socket;
    }
  });

  // When a user sends a text message
  socket.on('send_message', (data) => {
    // Send that message to the specific room they are in
    io.to(data.room).emit('receive_message', data);
  });

  // NEW FEATURE: When a user clicks "Extend Time"
  socket.on('extend_time', (data) => {
    // Stop the current timer for this room
    clearTimeout(roomTimers[data.room]);
    
    // We add 5 more minutes (300,000 milliseconds) to whatever time they had left
    const newTimeInMilliseconds = (data.timeLeft * 1000) + 300000; 
    
    // Start a new timer with the extended time
    startTimer(data.room, newTimeInMilliseconds);

    // Tell both users in the room that the time was extended by 5 minutes (300 seconds)
    io.to(data.room).emit('time_extended', 300); 
  });

  // When a user closes the website
  socket.on('disconnect', () => {
    console.log('User left:', socket.id);
    if (waitingUser === socket) {
      waitingUser = null; // Take them out of the waiting line
    }
  });

  // A helper function to start the kick-out timer
  function startTimer(roomName, duration) {
    roomTimers[roomName] = setTimeout(() => {
      io.to(roomName).emit('timeout'); // Tell them time is up
      io.socketsLeave(roomName);       // Kick them out of the room
      delete roomTimers[roomName];     // Delete the timer memory
    }, duration);
  }
});

// 5. Turn the server on (port 3001)
server.listen(3001, () => {
  console.log('JasinTenChat Server is running on port 3001!');
});