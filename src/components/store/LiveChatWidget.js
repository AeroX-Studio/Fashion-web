'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import io from 'socket.io-client';

let socket;

export function LiveChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isGuestRegistered, setIsGuestRegistered] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const conversationIdRef = useRef(null);
  const isOpenRef = useRef(false);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Initialize guest info from localStorage
  useEffect(() => {
    try {
      const storedGuest = localStorage.getItem('nobo_chat_guest') || localStorage.getItem('priyo_chat_guest');
      if (storedGuest) {
        const parsed = JSON.parse(storedGuest);
        setGuestName(parsed.name || '');
        setGuestPhone(parsed.phone || '');
        setIsGuestRegistered(true);
      }
      const storedConvId = localStorage.getItem('nobo_conv_id') || localStorage.getItem('priyo_conv_id');
      if (storedConvId) {
        setConversationId(storedConvId);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Connect to Socket.IO
  useEffect(() => {
    if (session?.user?.userType === 'admin') return undefined;

    const chatSocket = io({
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      auth: { guestPhone },
    });
    socket = chatSocket;

    chatSocket.on('connect', () => {
      chatSocket.emit('user:online');
      if (conversationIdRef.current) {
        chatSocket.emit('conversation:join', conversationIdRef.current);
      }
    });

    chatSocket.on('message:new', (msg) => {
      if (String(msg.conversation_id) !== String(conversationIdRef.current)) return;
      setMessages((prev) => {
        const pendingIndex = prev.findIndex((item) => String(item.id).startsWith('temp-') && item.message === msg.message && item.sender_type === msg.sender_type);
        if (pendingIndex >= 0) {
          const next = [...prev];
          next[pendingIndex] = msg;
          return next;
        }
        return prev.some((item) => String(item.id) === String(msg.id)) ? prev : [...prev, msg];
      });
      if (!isOpenRef.current && msg.sender_type === 'admin') {
        setUnreadCount((prev) => prev + 1);
      }
    });

    chatSocket.on('typing:show', (data) => {
      if (data.userType === 'admin') {
        setIsTyping(true);
      }
    });

    chatSocket.on('typing:stop', (data) => {
      if (data.userType === 'admin') {
        setIsTyping(false);
      }
    });

    return () => {
      chatSocket.disconnect();
      if (socket === chatSocket) socket = null;
    };
  }, [session?.user?.id, session?.user?.userType, guestPhone]);

  useEffect(() => {
    if (isOpen && conversationId && socket?.connected) {
      socket.emit('conversation:join', conversationId);
    }
  }, [conversationId, isOpen]);

  // Load chat history
  useEffect(() => {
    if (isOpen && conversationId) {
      const params = new URLSearchParams({ conversationId });
      if (!session?.user?.id && guestPhone) params.set('guestPhone', guestPhone);
      fetch(`/api/chat/messages?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMessages(data);
          }
        })
        .catch(console.error);
      setUnreadCount(0);
    }
  }, [isOpen, conversationId, guestPhone, session?.user?.id]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleStartGuestChat = (e) => {
    e.preventDefault();
    if (!guestName || !guestPhone) return;

    localStorage.setItem('nobo_chat_guest', JSON.stringify({ name: guestName, phone: guestPhone }));
    setIsGuestRegistered(true);

    // Initial greeting
    setMessages([
      {
        id: 'welcome',
        sender_type: 'admin',
        message: 'Hi! Welcome to Nobo Fashion. How can we help you today?',
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const msgText = inputText.trim();
    setInputText('');

    const newMsg = {
      id: 'temp-' + Date.now(),
      conversation_id: conversationId,
      sender_id: session?.user?.id || 0,
      sender_name: session?.user?.name || guestName || 'Customer',
      sender_phone: session?.user?.phone || guestPhone || '',
      sender_type: 'customer',
      message: msgText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: msgText,
          guestName: session?.user?.name || guestName,
          guestPhone: session?.user?.phone || guestPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => prev.filter((item) => item.id !== newMsg.id));
        setInputText(msgText);
        window.alert(data.error || 'Unable to send your message. Please try again.');
        return;
      }

      setMessages((prev) => prev.map((item) => item.id === newMsg.id ? data.message : item));
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem('nobo_conv_id', data.conversationId);
      }
      if (socket) {
        socket.emit('user:online');
        socket.emit('conversation:join', data.conversationId || conversationId);
        socket.emit('message:send', {
          conversationId: data.conversationId || conversationId,
          message: data.message || newMsg,
        });
      }
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages((prev) => prev.filter((item) => item.id !== newMsg.id));
      setInputText(msgText);
      window.alert('Unable to send your message. Please check your connection and try again.');
    }
  };

  if (session?.user?.userType === 'admin') return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          type="button"
          className="chat-float"
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          title="Chat with Nobo Fashion Support"
        >
          <i className="ri-chat-3-line" style={{ fontSize: '20px' }}></i>
          <span>Live Chat</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: 'var(--primary)',
                color: '#fff',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#22C55E',
                  boxShadow: '0 0 8px #22C55E',
                }}
              ></div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Nobo Fashion Support</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Online • Replies typically in minutes</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ color: '#fff', fontSize: '20px' }}
              title="Minimize chat"
            >
              <i className="ri-subtract-line"></i>
            </button>
          </div>

          {/* Body: Guest Registration Form if not logged in & not registered */}
          {!session && !isGuestRegistered ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', margin: 'auto' }}>
              <div style={{ textAlign: 'center' }}>
                <i className="ri-customer-service-2-line" style={{ fontSize: '36px', color: 'var(--accent)' }}></i>
                <h4 style={{ fontSize: '16px', color: 'var(--navy)', marginTop: '8px' }}>Chat with Support</h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Please enter your details to start the conversation.</p>
              </div>

              <form onSubmit={handleStartGuestChat} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <input
                  type="tel"
                  required
                  placeholder="Your Phone Number (01XXXXXXXXX)"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <button type="submit" className="btn btn-accent" style={{ marginTop: '6px' }}>
                  Start Chat &rarr;
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Message List */}
              <div className="chat-messages">
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    margin: '8px 0',
                  }}
                >
                  🔒 Messages are encrypted & saved
                </div>

                {messages.length === 0 && (
                  <div className="chat-bubble admin">
                    Hi! Welcome to Nobo Fashion. How can we help you today?
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div key={m.id || idx} className={`chat-bubble ${m.sender_type}`}>
                    {m.message}
                    <div
                      style={{
                        fontSize: '9.5px',
                        opacity: 0.7,
                        textAlign: 'right',
                        marginTop: '3px',
                      }}
                    >
                      {new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="chat-bubble admin" style={{ fontStyle: 'italic', opacity: 0.8 }}>
                    Admin is typing...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form className="chat-input-row" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: 'var(--radius-full)', padding: '0 16px' }}
                >
                  <i className="ri-send-plane-fill"></i>
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
