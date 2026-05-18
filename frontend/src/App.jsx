import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('https://jasintenchat-backend.onrender.com');

// ─── Global CSS ───────────────────────────────────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ══ DARK theme (default) ══════════════════════════════════════════════════ */
  :root {
    --bg:                  #0d0e14;
    --surface:             #13151f;
    --surface2:            #1a1d2a;
    --surface3:            #222537;
    --border:              rgba(255,255,255,0.07);
    --accent:              #7c6af7;
    --accent2:             #5de0b3;
    --accent-glow:         rgba(124,106,247,0.35);
    --danger:              #e05d6f;
    --warn:                #f0a04b;
    --success:             #5de0b3;
    --text:                #e8eaf2;
    --text-muted:          #6b6f8a;
    --text-dim:            #3e4260;
    --bubble-me-bg:        linear-gradient(135deg,#3d2e8c,#2a2556);
    --bubble-me-text:      #fff;
    --bubble-me-border:    rgba(124,106,247,0.28);
    --bubble-me-shadow:    rgba(124,106,247,0.15);
    --bubble-them:         #1e2032;
    --bubble-them-border:  rgba(255,255,255,0.06);
    --idle-bg:             rgba(20,16,40,0.97);
    --noise-opacity:       0.4;
    --card-shadow:         0 32px 80px rgba(0,0,0,0.55);
    --grad-bg:             radial-gradient(ellipse 80% 60% at 50% -10%,rgba(124,106,247,0.18) 0%,transparent 70%), #0d0e14;
    --font-display:        'Syne', sans-serif;
    --font-body:           'DM Sans', sans-serif;
    --radius:              16px;
    --radius-sm:           8px;
    --transition:          0.2s cubic-bezier(0.4,0,0.2,1);
  }

  /* ══ LIGHT theme (system preference) ══════════════════════════════════════ */
  @media (prefers-color-scheme: light) {
    :root {
      --bg:                  #eef0f8;
      --surface:             #ffffff;
      --surface2:            #f4f5fb;
      --surface3:            #e8eaf5;
      --border:              rgba(0,0,0,0.09);
      --accent:              #6154e8;
      --accent2:             #0faa7e;
      --accent-glow:         rgba(97,84,232,0.28);
      --danger:              #d6344a;
      --warn:                #c97a0c;
      --success:             #0faa7e;
      --text:                #18192c;
      --text-muted:          #757898;
      --text-dim:            #b4b7d0;
      --bubble-me-bg:        linear-gradient(135deg,#6a5bf0,#8472f7);
      --bubble-me-text:      #fff;
      --bubble-me-border:    rgba(97,84,232,0.18);
      --bubble-me-shadow:    rgba(97,84,232,0.12);
      --bubble-them:         #eceef9;
      --bubble-them-border:  rgba(0,0,0,0.07);
      --idle-bg:             rgba(248,248,255,0.97);
      --noise-opacity:       0.12;
      --card-shadow:         0 12px 40px rgba(80,70,160,0.1),0 2px 6px rgba(0,0,0,0.06);
      --grad-bg:             radial-gradient(ellipse 80% 60% at 50% -10%,rgba(97,84,232,0.1) 0%,transparent 70%), #eef0f8;
    }
  }

  /* ══ Base ══════════════════════════════════════════════════════════════════ */
  html {
    /* Older iOS Safari */
    height: -webkit-fill-available;
  }
  body {
    min-height: 100%;
    min-height: -webkit-fill-available;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    overscroll-behavior: none;       /* no bounce/pull-to-refresh */
  }
  #root {
    height: 100%;
    height: 100dvh;                  /* dvh shrinks when keyboard opens */
    display: flex;
    flex-direction: column;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 99px; }

  /* ══ Keyframe animations ═══════════════════════════════════════════════════ */
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pulse-ring {
    0%   { transform:scale(0.92); opacity:0.6; }
    50%  { transform:scale(1.06); opacity:1; }
    100% { transform:scale(0.92); opacity:0.6; }
  }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes slideDown {
    from { opacity:0; transform:translateY(-6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes msgIn-right {
    from { opacity:0; transform:translateX(10px) scale(0.97); }
    to   { opacity:1; transform:translateX(0) scale(1); }
  }
  @keyframes msgIn-left {
    from { opacity:0; transform:translateX(-10px) scale(0.97); }
    to   { opacity:1; transform:translateX(0) scale(1); }
  }
  @keyframes warningPop {
    from { opacity:0; transform:translate(-50%,-50%) scale(0.88); }
    to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
  }
  @keyframes dotBounce {
    0%,80%,100% { transform:translateY(0); }
    40%         { transform:translateY(-5px); }
  }

  .card-enter { animation: fadeUp 0.4s ease both; }
  .msg-right  { animation: msgIn-right 0.2s ease both; }
  .msg-left   { animation: msgIn-left  0.2s ease both; }

  /* Noise overlay */
  .noise::after {
    content:'';
    position:fixed; inset:0;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
    pointer-events:none; z-index:0; opacity:var(--noise-opacity);
  }

  /* ══ Button system ═════════════════════════════════════════════════════════ */
  .btn {
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    font-family:var(--font-body); font-weight:500; font-size:14px;
    border:none; border-radius:var(--radius-sm); cursor:pointer;
    transition:all var(--transition); user-select:none;
    -webkit-tap-highlight-color:transparent;
    touch-action:manipulation;
  }
  .btn:active { transform:scale(0.95); }

  .btn-primary {
    background:var(--accent); color:#fff;
    padding:14px 32px; font-size:15px; border-radius:var(--radius);
    box-shadow:0 0 28px var(--accent-glow);
    font-family:var(--font-display); font-weight:600; letter-spacing:0.3px;
  }
  .btn-primary:hover { filter:brightness(1.1); }

  .btn-danger  { background:var(--danger);  color:#fff;      padding:7px 14px; }
  .btn-success { background:var(--success); color:#0d1a14;   padding:7px 14px; font-weight:600; }
  .btn-ghost   { background:var(--surface3);color:var(--text-muted); padding:7px 14px; }
  .btn-ghost:hover { background:var(--surface2); color:var(--text); }
  .btn-warn    {
    background:rgba(240,160,75,0.12); color:var(--warn);
    padding:5px 10px; border:1px solid rgba(240,160,75,0.28);
    border-radius:8px; font-size:12px;
  }
  .btn-warn:hover { background:rgba(240,160,75,0.22); }

  /* ══ Chat layout: KEYBOARD-SAFE mobile approach ════════════════════════════
     100dvh (dynamic viewport height) automatically accounts for the
     on-screen keyboard on Android Chrome and iOS Safari 15.4+.
     For older iOS we fall back to 100vh + safe-area padding.

     The message list gets flex:1 + overflow:auto so it shrinks to fit
     the remaining space and scrolls internally — the input bar stays
     glued to the bottom of the viewport at all times.
  ══════════════════════════════════════════════════════════════════════════════ */
  .chat-shell {
    flex:1;
    display:flex;
    flex-direction:column;
    overflow:hidden;
    max-width:560px;
    width:100%;
    margin:0 auto;
    border-left:1px solid var(--border);
    border-right:1px solid var(--border);
    background:var(--surface);
  }

  .msg-scroll {
    flex:1;
    overflow-y:auto;
    overflow-x:hidden;
    -webkit-overflow-scrolling:touch;  /* smooth momentum scroll on iOS */
    padding:16px;
    display:flex;
    flex-direction:column;
    position:relative;
  }

  /* Input bar: safe-area padding for iPhone notch/home indicator */
  .input-bar {
    flex-shrink:0;
    border-top:1px solid var(--border);
    background:var(--surface2);
    padding:10px 12px;
    padding-bottom:max(10px, env(safe-area-inset-bottom, 10px));
  }

  /* font-size >=16px prevents iOS from auto-zooming on input focus */
  .msg-input { font-size:16px !important; }
`;

function injectStyles() {
  if (!document.getElementById('jt-styles')) {
    const s = document.createElement('style');
    s.id = 'jt-styles';
    s.textContent = globalCSS;
    document.head.appendChild(s);
  }
}

// ─── Small components ─────────────────────────────────────────────────────────

function Avatar({ name, size = 36, glow = false }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';
  const hue = name ? (name.charCodeAt(0) * 47) % 360 : 200;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue},55%,48%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.37, fontWeight: 700, color: '#fff',
      fontFamily: 'var(--font-display)', flexShrink: 0,
      boxShadow: glow ? `0 0 12px hsl(${hue},55%,48%)` : 'none',
      transition: 'box-shadow 0.3s',
    }}>
      {initials}
    </div>
  );
}

function StatusDot() {
  return (
    <span style={{
      width: 8, height: 8, borderRadius: '50%',
      background: 'var(--success)', display: 'inline-block',
      boxShadow: '0 0 5px var(--success)',
    }} />
  );
}

function Spinner() {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%',
      border: '3px solid var(--surface3)',
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.75s linear infinite',
      margin: '0 auto',
    }} />
  );
}

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

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [status,         setStatus]         = useState('idle');
  const [username,       setUsername]       = useState('');
  const [partnerName,    setPartnerName]    = useState('');
  const [room,           setRoom]           = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [messageInput,   setMessageInput]   = useState('');
  const [timeLeft,       setTimeLeft]       = useState(600);
  const [endState,       setEndState]       = useState('none');
  const [idleTime,       setIdleTime]       = useState(0);
  const [isPartnerTyping,setIsPartnerTyping]= useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  injectStyles();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  // Re-scroll when visual viewport resizes (keyboard open/close)
  useEffect(() => {
    const onVPResize = () => {
      if (status === 'matched') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }
    };
    window.visualViewport?.addEventListener('resize', onVPResize);
    return () => window.visualViewport?.removeEventListener('resize', onVPResize);
  }, [status]);

  // ── Socket listeners ────────────────────────────────────────────────────────
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
      setMessages(prev => [...prev, data]);
      if (data.sender !== username) setIsPartnerTyping(false);
    });

    socket.on('time_extended',       (s) => setTimeLeft(p => p + s));
    socket.on('partner_requested_end',()  => setEndState('partner_requested'));
    socket.on('partner_declined_end', ()  => setEndState('none'));

    socket.on('chat_ended', (msg) => {
      setStatus('ended');
      setTimeout(() => { setStatus('idle'); setRoom(null); alert(msg); }, 100);
    });

    socket.on('you_were_reported', () => {
      setStatus('idle'); setRoom(null);
      localStorage.setItem('jasin_chat_cooldown', Date.now() + 30 * 60 * 1000);
      alert('You have been reported. You are blocked for 30 minutes.');
    });

    return () => {
      ['matched','receive_message','time_extended','partner_requested_end',
       'partner_declined_end','chat_ended','you_were_reported'].forEach(e => socket.off(e));
    };
  }, [username]);

  // ── Timers ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let t;
    if (status === 'matched' && timeLeft > 0) t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [status, timeLeft]);

  useEffect(() => {
    let t;
    if (status === 'matched') t = setInterval(() => setIdleTime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (idleTime >= 35) { socket.emit('idle_timeout_end', { room }); setIdleTime(0); }
  }, [idleTime, room]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const startSearch = () => {
    if (!username.trim()) return alert('Please enter a name first!');
    const cd = localStorage.getItem('jasin_chat_cooldown');
    if (cd && Date.now() < +cd) {
      const m = Math.ceil((+cd - Date.now()) / 60000);
      return alert(`Blocked. Try again in ${m} minute(s).`);
    }
    setStatus('waiting');
    socket.emit('find_match', username);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      socket.emit('send_message', { room, sender: username, text: messageInput });
      setMessageInput('');
      setIdleTime(0);
    }
  };

  const handleTyping = (e) => { setMessageInput(e.target.value); setIdleTime(0); };

  const extendTime = () => socket.emit('extend_time', { room, timeLeft });
  const requestEnd = () => { setEndState('waiting_for_partner'); socket.emit('request_end', { room }); };
  const acceptEnd  = () => socket.emit('accept_end',  { room });
  const declineEnd = () => { setEndState('none'); socket.emit('decline_end', { room }); };
  const reportUser = () => {
    if (window.confirm('Report this user and end the chat?')) socket.emit('report_user', { room });
  };

  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const timerColor = timeLeft < 60 ? 'var(--danger)' : timeLeft < 180 ? 'var(--warn)' : 'var(--accent2)';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="noise"
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--grad-bg)',
        position: 'relative',
        zIndex: 1,
      }}
    >

      {/* ══ IDLE ══════════════════════════════════════════════════════════════ */}
      {status === 'idle' && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', overflowY: 'auto',
        }}>
          <div className="card-enter" style={{
            width: '100%', maxWidth: 420,
            background: 'var(--surface)', borderRadius: 24,
            border: '1px solid var(--border)', padding: '44px 34px',
            boxShadow: 'var(--card-shadow)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative blob */}
            <div style={{
              position: 'absolute', top: -60, right: -60, width: 200, height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(124,106,247,0.22),transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                color: 'var(--accent)', textTransform: 'uppercase',
                background: 'rgba(124,106,247,0.1)', padding: '4px 10px',
                borderRadius: 99, border: '1px solid rgba(124,106,247,0.22)',
                display: 'inline-block', marginBottom: 18,
              }}>
                Anonymous Chat
              </span>

              <h1 style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: 34, lineHeight: 1.1, marginBottom: 10,
                background: 'linear-gradient(135deg, var(--text) 30%, var(--accent))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                JasinTen<br />Chat
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 30, lineHeight: 1.65 }}>
                Connect with a random stranger for a&nbsp;10‑minute conversation.
              </p>

              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.08em',
              }}>
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter a display name (Do not use personally identifiable information)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startSearch()}
                className="msg-input"
                style={{
                  width: '100%', padding: '13px 15px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 12, color: 'var(--text)',
                  outline: 'none', marginBottom: 18,
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color var(--transition)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'}
              />

              <button onClick={startSearch} className="btn btn-primary" style={{ width: '100%' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Find a Stranger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ WAITING ═══════════════════════════════════════════════════════════ */}
      {status === 'waiting' && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div className="card-enter" style={{
            textAlign: 'center', padding: '56px 36px',
            background: 'var(--surface)', borderRadius: 24,
            border: '1px solid var(--border)', width: '100%', maxWidth: 340,
            boxShadow: 'var(--card-shadow)',
          }}>
            <div style={{
              width: 62, height: 62, borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(124,106,247,0.28),transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 26px', animation: 'pulse-ring 2s ease infinite',
              border: '2px solid rgba(124,106,247,0.38)',
            }}>
              <Spinner />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 8, color: 'var(--text)' }}>
              Searching…
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
              Looking for someone as <strong style={{ color: 'var(--text)' }}>{username}</strong>
            </p>
          </div>
        </div>
      )}

      {/* ══ CHAT ══════════════════════════════════════════════════════════════
          .chat-shell fills the remaining flex space.
          Message list scrolls inside; input bar is always at bottom.
      ════════════════════════════════════════════════════════════════════════ */}
      {status === 'matched' && (
        <div className="chat-shell card-enter">

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface2)', flexShrink: 0,
          }}>
            {/* Partner info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={partnerName} size={38} glow />
                <span style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'var(--success)', border: '2px solid var(--surface2)',
                  boxShadow: '0 0 5px var(--success)',
                }} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                  {partnerName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                  <StatusDot /> Online · Anonymous
                </div>
              </div>
            </div>

            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--surface3)', borderRadius: 99,
                padding: '5px 12px', border: '1px solid var(--border)',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={timerColor} strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: 13, color: timerColor, minWidth: 34,
                }}>
                  {fmt(timeLeft)}
                </span>
              </div>
              <button onClick={extendTime} className="btn btn-warn">+5m</button>
            </div>
          </div>

          {/* End-chat request bar */}
          {endState !== 'none' && (
            <div style={{
              padding: '9px 16px',
              background: 'rgba(224,93,111,0.07)',
              borderBottom: '1px solid rgba(224,93,111,0.18)',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
              animation: 'slideDown 0.2s ease',
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

          {/* Message list — scrollable, shrinks when keyboard opens */}
          <div className="msg-scroll">

            {/* Idle warning overlay */}
            {idleTime >= 30 && idleTime < 35 && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                background: 'var(--idle-bg)', backdropFilter: 'blur(10px)',
                border: '1px solid var(--danger)', borderRadius: 20,
                padding: '28px 24px', textAlign: 'center', zIndex: 20, width: 272,
                boxShadow: '0 0 40px rgba(224,93,111,0.28)',
                animation: 'warningPop 0.22s ease both',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(224,93,111,0.12)', border: '2px solid var(--danger)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px', fontSize: 20,
                }}>⏳</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                  Still there?
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>
                  Chat ends in <strong style={{ color: 'var(--danger)' }}>{35 - idleTime}s</strong> due to inactivity
                </p>
                <button onClick={() => setIdleTime(0)} className="btn btn-primary" style={{ width: '100%', padding: '11px' }}>
                  I'm still here!
                </button>
              </div>
            )}

            {/* Empty state */}
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, margin: 'auto' }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>👋</div>
                Say hello to <strong style={{ color: 'var(--text-muted)' }}>{partnerName}</strong>!
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => {
              const isMe      = msg.sender === username;
              const sameGroup = i > 0 && messages[i - 1].sender === msg.sender;
              return (
                <div
                  key={i}
                  className={isMe ? 'msg-right' : 'msg-left'}
                  style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end', gap: 8,
                    marginTop: sameGroup ? 3 : 14,
                  }}
                >
                  {!isMe && !sameGroup && <Avatar name={msg.sender} size={26} />}
                  {!isMe &&  sameGroup && <div style={{ width: 26, flexShrink: 0 }} />}

                  <div style={{
                    maxWidth: '74%',
                    background: isMe ? 'var(--bubble-me-bg)' : 'var(--bubble-them)',
                    borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    padding: '9px 13px',
                    border: `1px solid ${isMe ? 'var(--bubble-me-border)' : 'var(--bubble-them-border)'}`,
                    boxShadow: isMe
                      ? '0 2px 10px var(--bubble-me-shadow)'
                      : '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    {!sameGroup && !isMe && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 3, letterSpacing: '0.04em' }}>
                        {msg.sender}
                      </div>
                    )}
                    <span style={{
                      fontSize: 14, lineHeight: 1.55,
                      color: isMe ? 'var(--bubble-me-text)' : 'var(--text)',
                      wordBreak: 'break-word',
                    }}>
                      {msg.text}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isPartnerTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 14 }}>
                <Avatar name={partnerName} size={26} />
                <div style={{
                  background: 'var(--bubble-them)', borderRadius: '4px 18px 18px 18px',
                  padding: '10px 14px', border: '1px solid var(--bubble-them-border)',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} style={{ height: 1 }} />
          </div>

          {/* Input bar — always pinned above keyboard */}
          <div className="input-bar">

            {/* End / Report row */}
            {endState === 'none' && (
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={requestEnd} className="btn btn-ghost" style={{
                  fontSize: 12, border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  End Chat
                </button>
                <button onClick={reportUser} className="btn" style={{
                  fontSize: 12, color: 'var(--danger)',
                  border: '1px solid rgba(224,93,111,0.22)',
                  background: 'rgba(224,93,111,0.07)',
                  borderRadius: 8, padding: '7px 12px',
                }}>
                  🚨 Report
                </button>
              </div>
            )}

            {/* Message input row */}
            <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                ref={inputRef}
                value={messageInput}
                onChange={handleTyping}
                placeholder={`Message ${partnerName}…`}
                className="msg-input"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="on"
                style={{
                  flex: 1, padding: '11px 15px',
                  background: 'var(--surface3)', border: '1px solid var(--border)',
                  borderRadius: 99, color: 'var(--text)',
                  outline: 'none', fontFamily: 'var(--font-body)',
                  transition: 'border-color var(--transition)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                type="submit"
                className="btn"
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  padding: 0, flexShrink: 0,
                  background: messageInput.trim() ? 'var(--accent)' : 'var(--surface3)',
                  boxShadow: messageInput.trim() ? '0 0 14px var(--accent-glow)' : 'none',
                  color: messageInput.trim() ? '#fff' : 'var(--text-muted)',
                  transition: 'background 0.15s, box-shadow 0.15s, color 0.15s',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
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