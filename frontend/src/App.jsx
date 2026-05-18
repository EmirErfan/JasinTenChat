import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('https://jasintenchat-backend.onrender.com');

// ─── Inject global styles ───────────────────────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:           #0d0e14;
    --surface:      #13151f;
    --surface2:     #1a1d2a;
    --surface3:     #222537;
    --border:       rgba(255,255,255,0.06);
    --accent:       #7c6af7;
    --accent2:      #5de0b3;
    --accent-glow:  rgba(124,106,247,0.35);
    --danger:       #e05d6f;
    --warn:         #f0a04b;
    --success:      #5de0b3;
    --text:         #e8eaf2;
    --text-muted:   #6b6f8a;
    --text-dim:     #3e4260;
    --bubble-me:    #2a2556;
    --bubble-them:  #1e2032;
    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
    --radius:       16px;
    --radius-sm:    8px;
    --transition:   0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  html, body, #root {
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 99px; }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.9); opacity: 0.7; }
    50%  { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.9); opacity: 0.7; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes msgIn-right {
    from { opacity: 0; transform: translateX(12px) scale(0.96); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes msgIn-left {
    from { opacity: 0; transform: translateX(-12px) scale(0.96); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes warningPop {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  @keyframes dotBounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
  }

  .card-enter { animation: fadeUp 0.45s ease both; }

  .msg-right { animation: msgIn-right 0.22s ease both; }
  .msg-left  { animation: msgIn-left  0.22s ease both; }

  /* Noise texture overlay */
  .noise::after {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 0; opacity: 0.4;
  }

  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    font-family: var(--font-body); font-weight: 500; font-size: 14px;
    border: none; border-radius: var(--radius-sm); cursor: pointer;
    transition: all var(--transition); user-select: none;
  }
  .btn:active { transform: scale(0.97); }

  .btn-primary {
    background: var(--accent); color: #fff;
    padding: 14px 32px; font-size: 15px; border-radius: var(--radius);
    box-shadow: 0 0 28px var(--accent-glow);
    font-family: var(--font-display); font-weight: 600; letter-spacing: 0.3px;
  }
  .btn-primary:hover { background: #8f80f9; box-shadow: 0 0 36px var(--accent-glow); }

  .btn-danger  { background: var(--danger);  color: #fff; padding: 7px 14px; }
  .btn-danger:hover  { background: #e8708090; }
  .btn-success { background: var(--success); color: #0d1a14; padding: 7px 14px; font-weight: 600; }
  .btn-success:hover { background: #6defc0; }
  .btn-ghost   { background: var(--surface3); color: var(--text-muted); padding: 7px 14px; }
  .btn-ghost:hover   { background: #2c3050; color: var(--text); }
  .btn-warn    { background: rgba(240,160,75,0.15); color: var(--warn); padding: 6px 12px; border: 1px solid rgba(240,160,75,0.3); }
  .btn-warn:hover    { background: rgba(240,160,75,0.25); }
`;

function injectStyles() {
  if (!document.getElementById('jt-styles')) {
    const tag = document.createElement('style');
    tag.id = 'jt-styles';
    tag.textContent = globalCSS;
    document.head.appendChild(tag);
  }
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36, glow = false }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';
  const hue = name ? (name.charCodeAt(0) * 47) % 360 : 200;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue}, 60%, 45%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      fontFamily: 'var(--font-display)', flexShrink: 0,
      boxShadow: glow ? `0 0 14px hsl(${hue}, 60%, 45%)` : 'none',
      transition: 'box-shadow 0.3s',
    }}>
      {initials}
    </div>
  );
}

// ─── StatusDot ───────────────────────────────────────────────────────────────
function StatusDot({ color = 'var(--success)' }) {
  return (
    <span style={{
      width: 9, height: 9, borderRadius: '50%',
      background: color, display: 'inline-block',
      boxShadow: `0 0 6px ${color}`,
    }} />
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      border: '3px solid var(--surface3)',
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.75s linear infinite',
      margin: '0 auto',
    }} />
  );
}

// ─── Typing dots ─────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 4px' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--text-muted)',
          animation: `dotBounce 1.2s ease ${i * 0.2}s infinite`,
          display: 'inline-block',
        }} />
      ))}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
function App() {
  const [status, setStatus] = useState('idle');
  const [username, setUsername] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(600);
  const [endState, setEndState] = useState('none');
  const [idleTime, setIdleTime] = useState(0);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  injectStyles();

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    socket.on('matched', (roomName, user1, user2) => {
      setStatus('matched');
      setRoom(roomName);
      setPartnerName(username === user1 ? user2 : user1);
      setMessages([]);
      setTimeLeft(600);
      setEndState('none');
      setIdleTime(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    });

    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
      if (data.sender !== username) setIsPartnerTyping(false);
    });

    socket.on('time_extended', (addedSeconds) => {
      setTimeLeft((prev) => prev + addedSeconds);
    });

    socket.on('partner_requested_end', () => setEndState('partner_requested'));

    socket.on('partner_declined_end', () => {
      setEndState('none');
    });

    socket.on('chat_ended', (reasonMessage) => {
      setStatus('ended');
      setTimeout(() => {
        setStatus('idle');
        setRoom(null);
        alert(reasonMessage);
      }, 100);
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

  // ── Timers ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let timer;
    if (status === 'matched' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  useEffect(() => {
    let timer;
    if (status === 'matched') {
      timer = setInterval(() => setIdleTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (idleTime >= 35) {
      socket.emit('idle_timeout_end', { room });
      setIdleTime(0);
    }
  }, [idleTime, room]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const startSearch = () => {
    if (username.trim() === '') return alert('Please enter a name first!');
    setStatus('waiting');
    socket.emit('find_match', username);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() !== '') {
      socket.emit('send_message', { room, sender: username, text: messageInput });
      setMessageInput('');
      setIdleTime(0);
    }
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    setIdleTime(0);
  };

  const extendTime = () => socket.emit('extend_time', { room, timeLeft });

  const requestEnd = () => { setEndState('waiting_for_partner'); socket.emit('request_end', { room }); };
  const acceptEnd  = () => socket.emit('accept_end', { room });
  const declineEnd = () => { setEndState('none'); socket.emit('decline_end', { room }); };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const timerColor = timeLeft < 60 ? 'var(--danger)' : timeLeft < 180 ? 'var(--warn)' : 'var(--accent2)';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="noise" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,106,247,0.18) 0%, transparent 70%), var(--bg)',
    }}>

      {/* ── IDLE ── */}
      {status === 'idle' && (
        <div className="card-enter" style={{
          width: '100%', maxWidth: 420,
          background: 'var(--surface)', borderRadius: 24,
          border: '1px solid var(--border)', padding: '48px 40px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* accent blob */}
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 200, height: 200,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,106,247,0.25), transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                color: 'var(--accent)', textTransform: 'uppercase',
                background: 'rgba(124,106,247,0.12)', padding: '4px 10px',
                borderRadius: 99, border: '1px solid rgba(124,106,247,0.25)',
              }}>
                Anonymous Chat
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 36, lineHeight: 1.1, marginTop: 16, marginBottom: 8,
              background: 'linear-gradient(135deg, #e8eaf2 30%, var(--accent))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              JasinTen<br />Chat
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
              Connect with a random stranger for a 10‑minute conversation.
            </p>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.06em' }}>
              YOUR NAME
            </label>
            <input
              type="text"
              placeholder="Enter a display name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startSearch()}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 16, color: 'var(--text)',
                fontSize: 15, outline: 'none', marginBottom: 20,
                fontFamily: 'var(--font-body)',
                transition: 'border-color var(--transition)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />

            <button onClick={startSearch} className="btn btn-primary" style={{ width: '100%' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Find a Stranger
            </button>
          </div>
        </div>
      )}

      {/* ── WAITING ── */}
      {status === 'waiting' && (
        <div className="card-enter" style={{
          textAlign: 'center', padding: '64px 40px',
          background: 'var(--surface)', borderRadius: 24,
          border: '1px solid var(--border)', width: '100%', maxWidth: 360,
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,106,247,0.3), transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px', animation: 'pulse-ring 2s ease infinite',
            border: '2px solid rgba(124,106,247,0.4)',
          }}>
            <Spinner />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
            Searching…
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Looking for someone to chat with as <strong style={{ color: 'var(--text)' }}>{username}</strong>
          </p>
        </div>
      )}

      {/* ── MATCHED / CHAT ── */}
      {status === 'matched' && (
        <div className="card-enter" style={{
          width: '100%', maxWidth: 520,
          background: 'var(--surface)', borderRadius: 24,
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', height: 'min(680px, 90vh)',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface2)', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={partnerName} size={40} glow />
                <span style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 11, height: 11, borderRadius: '50%',
                  background: 'var(--success)', border: '2px solid var(--surface2)',
                  boxShadow: '0 0 6px var(--success)',
                }} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
                  {partnerName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <StatusDot /> Online · Anonymous Chat
                </div>
              </div>
            </div>

            {/* Timer + extend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--surface3)', borderRadius: 99,
                padding: '6px 14px', border: '1px solid var(--border)',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={timerColor} strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: timerColor, minWidth: 38 }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button onClick={extendTime} className="btn btn-warn" style={{ fontSize: 12, padding: '6px 10px' }}>
                +5m
              </button>
            </div>
          </div>

          {/* End-chat bar */}
          {endState !== 'none' && (
            <div style={{
              padding: '10px 20px', background: 'rgba(224,93,111,0.08)',
              borderBottom: '1px solid rgba(224,93,111,0.2)',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
              animation: 'slideDown 0.25s ease',
            }}>
              {endState === 'waiting_for_partner' && (
                <>
                  <TypingDots />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Waiting for partner to respond…</span>
                </>
              )}
              {endState === 'partner_requested' && (
                <>
                  <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, flex: 1 }}>
                    Partner wants to end the chat
                  </span>
                  <button onClick={acceptEnd}  className="btn btn-success" style={{ fontSize: 12, padding: '6px 12px' }}>Accept</button>
                  <button onClick={declineEnd} className="btn btn-ghost"   style={{ fontSize: 12, padding: '6px 12px' }}>Decline</button>
                </>
              )}
            </div>
          )}

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: 4,
            position: 'relative',
          }}>

            {/* Idle warning overlay */}
            {idleTime >= 30 && idleTime < 35 && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(20,16,40,0.97)', backdropFilter: 'blur(8px)',
                border: '1px solid var(--danger)', borderRadius: 20,
                padding: '32px 28px', textAlign: 'center', zIndex: 10, width: 280,
                boxShadow: '0 0 40px rgba(224,93,111,0.3)',
                animation: 'warningPop 0.25s ease both',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(224,93,111,0.15)', border: '2px solid var(--danger)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 22,
                }}>⏳</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>
                  Still there?
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                  Chat ends in <strong style={{ color: 'var(--danger)' }}>{35 - idleTime}s</strong> due to inactivity
                </p>
                <button onClick={() => setIdleTime(0)} className="btn btn-primary" style={{ width: '100%', padding: '11px' }}>
                  I'm still here!
                </button>
              </div>
            )}

            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, margin: 'auto', paddingBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>👋</div>
                Say hello to <strong style={{ color: 'var(--text-muted)' }}>{partnerName}</strong>!
              </div>
            )}

            {messages.map((msg, index) => {
              const isMe = msg.sender === username;
              const prevMsg = messages[index - 1];
              const sameGroup = prevMsg && prevMsg.sender === msg.sender;
              return (
                <div key={index}
                  className={isMe ? 'msg-right' : 'msg-left'}
                  style={{
                    display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end', gap: 8,
                    marginTop: sameGroup ? 2 : 12,
                  }}
                >
                  {!isMe && !sameGroup && <Avatar name={msg.sender} size={28} />}
                  {!isMe && sameGroup  && <div style={{ width: 28 }} />}

                  <div style={{
                    maxWidth: '72%',
                    background: isMe ? 'linear-gradient(135deg, #3d2e8c, var(--bubble-me))' : 'var(--bubble-them)',
                    borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    padding: '10px 14px',
                    border: `1px solid ${isMe ? 'rgba(124,106,247,0.25)' : 'var(--border)'}`,
                    boxShadow: isMe ? '0 2px 12px rgba(124,106,247,0.15)' : '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    {!sameGroup && !isMe && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 4, letterSpacing: '0.04em' }}>
                        {msg.sender}
                      </div>
                    )}
                    <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)', wordBreak: 'break-word' }}>
                      {msg.text}
                    </span>
                  </div>
                </div>
              );
            })}

            {isPartnerTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 8 }}>
                <Avatar name={partnerName} size={28} />
                <div style={{
                  background: 'var(--bubble-them)', borderRadius: '4px 18px 18px 18px',
                  padding: '10px 14px', border: '1px solid var(--border)',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div style={{
            borderTop: '1px solid var(--border)', background: 'var(--surface2)',
            padding: '12px 16px', flexShrink: 0,
          }}>
            {/* End chat button row */}
            {endState === 'none' && (
              <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={requestEnd} className="btn btn-ghost" style={{
                  fontSize: 12, color: 'var(--danger)', gap: 5,
                  border: '1px solid rgba(224,93,111,0.2)',
                  background: 'rgba(224,93,111,0.06)',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  End Chat
                </button>
              </div>
            )}

            <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                ref={inputRef}
                value={messageInput}
                onChange={handleTyping}
                placeholder={`Message ${partnerName}…`}
                style={{
                  flex: 1, padding: '12px 16px',
                  background: 'var(--surface3)', border: '1px solid var(--border)',
                  borderRadius: 99, color: 'var(--text)', fontSize: 14,
                  outline: 'none', fontFamily: 'var(--font-body)',
                  transition: 'border-color var(--transition)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button type="submit" className="btn" style={{
                width: 44, height: 44, borderRadius: '50%', padding: 0, flexShrink: 0,
                background: messageInput.trim() ? 'var(--accent)' : 'var(--surface3)',
                boxShadow: messageInput.trim() ? '0 0 16px var(--accent-glow)' : 'none',
                transition: 'all var(--transition)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;