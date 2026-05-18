import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  const [status, setStatus] = useState('idle'); 
  const [username, setUsername] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); 
  
  // --- NEW STATES ---
  const [endState, setEndState] = useState('none'); // 'none', 'waiting_for_partner', 'partner_requested'
  const [idleTime, setIdleTime] = useState(0); // Counts how many seconds user is inactive

  // --- BACKGROUND LISTENERS ---
  useEffect(() => {
    socket.on('matched', (roomName, user1, user2) => {
      setStatus('matched');
      setRoom(roomName);
      setPartnerName(username === user1 ? user2 : user1);
      setMessages([]); 
      setTimeLeft(600); 
      
      // Reset new features for the new chat
      setEndState('none');
      setIdleTime(0); 
    });

    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('time_extended', (addedSeconds) => {
      setTimeLeft((prev) => prev + addedSeconds);
    });

    // --- NEW: LISTENERS FOR ENDING CHAT ---
    socket.on('partner_requested_end', () => setEndState('partner_requested'));
    
    socket.on('partner_declined_end', () => {
      alert("Your partner declined to end the chat.");
      setEndState('none'); // Go back to normal
    });

    // This handles ALL chat endings (Time out, Mutual End, and Idle)
    socket.on('chat_ended', (reasonMessage) => {
      setStatus('idle');
      setRoom(null);
      alert(reasonMessage);
    });

    return () => {
      socket.off('matched');
      socket.off('receive_message');
      socket.off('time_extended');
      socket.off('partner_requested_end');
      socket.off('partner_declined_end');
      socket.off('chat_ended');
    };
  }, [username]);

  // --- 10 MINUTE TIMER LOGIC ---
  useEffect(() => {
    let timer;
    if (status === 'matched' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  // --- NEW: IDLE TIMER LOGIC ---
  useEffect(() => {
    let timer;
    if (status === 'matched') {
      // Add 1 to idleTime every single second
      timer = setInterval(() => setIdleTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  // Check if we hit the idle limits (30s warning, 35s kick)
  useEffect(() => {
    if (idleTime >= 35) {
      socket.emit('idle_timeout_end', { room: room });
      setIdleTime(0); // Reset to prevent multiple kicks
    }
  }, [idleTime, room]);


  // --- BUTTON ACTIONS ---
  const startSearch = () => {
    if (username.trim() === '') return alert("Please enter a name first!");
    setStatus('waiting');
    socket.emit('find_match', username);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() !== '') {
      socket.emit('send_message', { room: room, sender: username, text: messageInput });
      setMessageInput('');
      setIdleTime(0); // If they send a message, they are not idle!
    }
  };

  // NEW: When the user types anything, they are no longer idle
  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    setIdleTime(0); 
  };

  const extendTime = () => socket.emit('extend_time', { room: room, timeLeft: timeLeft });

  // --- NEW: MUTUAL END ACTIONS ---
  const requestEnd = () => {
    setEndState('waiting_for_partner');
    socket.emit('request_end', { room: room });
  };
  const acceptEnd = () => socket.emit('accept_end', { room: room });
  const declineEnd = () => {
    setEndState('none');
    socket.emit('decline_end', { room: room });
  };


  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={styles.container}>
      <h1 style={{ color: '#333' }}>JasinTenChat</h1>
      
      {status === 'idle' && (
        <div style={styles.card}>
          <h3>Welcome!</h3>
          <input type="text" placeholder="Enter your name..." value={username} onChange={(e) => setUsername(e.target.value)} style={styles.nameInput}/>
          <br/>
          <button onClick={startSearch} style={styles.primaryButton}>Search for Chat</button>
        </div>
      )}

      {status === 'waiting' && (
        <div style={styles.card}>
          <h3>Looking for a stranger...</h3>
          <p>Please wait while we connect you.</p>
        </div>
      )}

      {status === 'matched' && (
        <div style={styles.chatBox}>
          
          {/* HEADER */}
          <div style={styles.header}>
            <span>Chatting with: <strong>{partnerName}</strong></span>
            <div>
              <span style={styles.timer}>Time: {formatTime(timeLeft)}</span>
              <button onClick={extendTime} style={styles.extendButton}>+5 Min</button>
            </div>
          </div>

          {/* MUTUAL END CHAT BAR */}
          <div style={styles.endChatBar}>
            {endState === 'none' && (
              <button onClick={requestEnd} style={styles.requestEndBtn}>End Chat Early</button>
            )}
            {endState === 'waiting_for_partner' && (
              <span style={{color: 'gray'}}>Waiting for partner to accept...</span>
            )}
            {endState === 'partner_requested' && (
              <div>
                <span style={{color: '#d9534f', fontWeight: 'bold', marginRight: '10px'}}>Partner wants to end:</span>
                <button onClick={acceptEnd} style={styles.acceptBtn}>Accept</button>
                <button onClick={declineEnd} style={styles.declineBtn}>Decline</button>
              </div>
            )}
          </div>
          
          {/* MESSAGES */}
          <div style={styles.messageContainer}>
            {/* IDLE WARNING POPUP */}
            {idleTime >= 30 && idleTime < 35 && (
              <div style={styles.idleWarning}>
                <strong>Are you still there?</strong>
                <p>Chat ending in {35 - idleTime} seconds due to inactivity!</p>
                <button onClick={() => setIdleTime(0)} style={styles.imHereBtn}>I'm still here!</button>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} style={{ textAlign: msg.sender === username ? 'right' : 'left' }}>
                <div style={styles.messageBubble(msg.sender === username)}>
                  <small style={{display: 'block', fontSize: '10px', color: '#666'}}>
                    {msg.sender === username ? 'You' : msg.sender}
                  </small>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* TYPE MESSAGE */}
          <form onSubmit={sendMessage} style={{ display: 'flex' }}>
            <input 
              value={messageInput} 
              onChange={handleTyping} // <-- Uses our new handleTyping function
              placeholder="Type a message..." 
              style={styles.chatInput} 
            />
            <button type="submit" style={styles.sendButton}>Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: { fontFamily: 'Arial', maxWidth: '500px', margin: '50px auto', textAlign: 'center' },
  card: { padding: '40px', border: '1px solid #ddd', borderRadius: '10px', backgroundColor: '#f9f9f9' },
  nameInput: { padding: '10px', fontSize: '16px', width: '80%', marginBottom: '20px', borderRadius: '5px', border: '1px solid #ccc' },
  primaryButton: { padding: '12px 24px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', width: '85%' },
  chatBox: { border: '1px solid #ccc', borderRadius: '10px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', position: 'relative' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f1f1f1', borderBottom: '1px solid #ccc' },
  timer: { color: 'red', fontWeight: 'bold', marginRight: '10px' },
  extendButton: { padding: '5px 10px', backgroundColor: '#ffc107', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' },
  
  // New Styles for the End Bar
  endChatBar: { padding: '10px', backgroundColor: '#ffeeba', borderBottom: '1px solid #ccc', minHeight: '30px' },
  requestEndBtn: { padding: '5px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  acceptBtn: { padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' },
  declineBtn: { padding: '5px 10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },

  // New Styles for the Idle Warning
  idleWarning: { position: 'absolute', top: '40%', left: '10%', right: '10%', backgroundColor: 'rgba(220, 53, 69, 0.95)', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 10 },
  imHereBtn: { padding: '10px 20px', backgroundColor: 'white', color: '#dc3545', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },

  messageContainer: { height: '350px', overflowY: 'auto', padding: '15px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', position: 'relative' },
  messageBubble: (isMe) => ({
    display: 'inline-block', padding: '10px 15px', borderRadius: '15px', margin: '5px 0',
    backgroundColor: isMe ? '#dcf8c6' : '#ffffff', border: '1px solid #eee', textAlign: 'left', maxWidth: '80%'
  }),
  chatInput: { flex: 1, padding: '15px', border: 'none', borderTop: '1px solid #ccc', outline: 'none', fontSize: '16px' },
  sendButton: { padding: '15px 25px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }
};

export default App;