'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import io from 'socket.io-client';

let socket;

export default function AdminChatPage() {
  const { data: session } = useSession();

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [customerContext, setCustomerContext] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineCustomers, setOnlineCustomers] = useState([]);

  const messagesEndRef = useRef(null);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/chat/conversations');
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
        if (!selectedConv && data.length > 0) {
          setSelectedConv(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Connect socket
  useEffect(() => {
    socket = io({
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('admin:join');
    });

    socket.on('conversation:updated', (data) => {
      fetchConversations();
    });

    socket.on('message:new', (msg) => {
      if (selectedConv && String(msg.conversation_id) === String(selectedConv.id)) {
        setMessages((prev) => [...prev, msg]);
      }
      fetchConversations();
    });

    socket.on('online:customers', (ids) => {
      setOnlineCustomers(ids);
    });

    fetchConversations();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [selectedConv]);

  // Load messages & customer context for selected conversation
  useEffect(() => {
    if (selectedConv) {
      if (socket) {
        socket.emit('conversation:join', selectedConv.id);
      }

      fetch(`/api/chat/messages?conversationId=${selectedConv.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch(console.error);

      // Fetch customer orders context
      if (selectedConv.user_id) {
        fetch(`/api/admin/customers/${selectedConv.user_id}`)
          .then((r) => r.json())
          .then((data) => setCustomerContext(data))
          .catch(() => setCustomerContext(null));
      }
    }
  }, [selectedConv]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv) return;

    const text = inputText.trim();
    setInputText('');

    const newMsg = {
      id: 'temp-' + Date.now(),
      conversation_id: selectedConv.id,
      sender_id: session?.user?.id || 1,
      sender_type: 'admin',
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          message: text,
          senderType: 'admin',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (socket) {
          socket.emit('message:send', {
            conversationId: selectedConv.id,
            message: data.message || newMsg,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendQuickReply = (text) => {
    setInputText(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', color: 'var(--navy)' }}>Customer Live Support Desk</h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Real-time chat with customers with order history context and instant WhatsApp bridge
        </p>
      </div>

      <div
        className="data-card"
        style={{
          display: 'grid',
          gridTemplateColumns: '300px minmax(0, 1fr) 280px',
          height: 'calc(100vh - 220px)',
          minHeight: '600px',
        }}
      >
        {/* ── Col 1: Conversations List ── */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <strong>Active Conversations ({conversations.length})</strong>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active conversations.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                const isOnline = onlineCustomers.includes(String(c.user_id));

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConv(c)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border-light)',
                      background: isSelected ? 'var(--primary-wash)' : '#fff',
                      cursor: 'pointer',
                      borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: isOnline ? '#22C55E' : 'var(--text-light)',
                          }}
                        ></span>
                        <strong style={{ fontSize: '13.5px', color: 'var(--navy)' }}>
                          {c.customer_name || 'Guest Customer'}
                        </strong>
                      </div>

                      {c.unread_admin > 0 && (
                        <span
                          style={{
                            background: 'var(--primary)',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            fontSize: '10px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {c.unread_admin}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.last_message || 'Started conversation'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Col 2: Chat Messages Stream ── */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--paper-2)' }}>
          {selectedConv ? (
            <>
              {/* Header */}
              <div
                style={{
                  padding: '14px 20px',
                  background: '#fff',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>
                    {selectedConv.customer_name || 'Customer'}
                  </strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Phone: {selectedConv.customer_phone || 'N/A'}
                  </div>
                </div>

                {selectedConv.customer_phone && (
                  <a
                    href={`https://wa.me/${selectedConv.customer_phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                    style={{ background: '#25D366', color: '#fff' }}
                  >
                    <i className="ri-whatsapp-line"></i> Open in WhatsApp
                  </a>
                )}
              </div>

              {/* Message List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((m, idx) => {
                  const isAdmin = m.sender_type === 'admin';

                  return (
                    <div
                      key={m.id || idx}
                      style={{
                        alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        background: isAdmin ? 'var(--primary)' : '#fff',
                        color: isAdmin ? '#fff' : 'var(--text-main)',
                        boxShadow: isAdmin ? 'none' : 'var(--shadow-sm)',
                        borderBottomRightRadius: isAdmin ? '2px' : '12px',
                        borderBottomLeftRadius: !isAdmin ? '2px' : '12px',
                      }}
                    >
                      <div>{m.message}</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.7, textAlign: 'right', marginTop: '4px' }}>
                        {new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies Strip */}
              <div style={{ padding: '8px 16px', background: '#fff', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', alignSelf: 'center', whiteSpace: 'nowrap' }}>
                  Quick Reply:
                </span>
                <button
                  type="button"
                  onClick={() => sendQuickReply('Hello! Yes, cash on delivery is available across Bangladesh.')}
                  style={{ fontSize: '11.5px', background: 'var(--paper-2)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}
                >
                  COD Available
                </button>
                <button
                  type="button"
                  onClick={() => sendQuickReply('Your order has been confirmed and packed for courier dispatch!')}
                  style={{ fontSize: '11.5px', background: 'var(--paper-2)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}
                >
                  Order Confirmed
                </button>
                <button
                  type="button"
                  onClick={() => sendQuickReply('What size are you looking for? We have sizes 38 to 52 in stock.')}
                  style={{ fontSize: '11.5px', background: 'var(--paper-2)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}
                >
                  Size Inquiry
                </button>
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: '#fff', borderTop: '1px solid var(--border)' }}
              >
                <input
                  type="text"
                  placeholder="Reply to customer..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-dark)',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
                <button type="submit" className="btn btn-primary">
                  <i className="ri-send-plane-fill"></i> Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a conversation to start chatting.
            </div>
          )}
        </div>

        {/* ── Col 3: Customer Context & Order History ── */}
        <div style={{ borderLeft: '1px solid var(--border)', padding: '20px', overflowY: 'auto', background: '#fff' }}>
          <strong style={{ fontSize: '14px', color: 'var(--navy)', display: 'block', marginBottom: '14px' }}>
            Customer Profile & Orders
          </strong>

          {customerContext ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Name</span>
                <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{customerContext.name}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</span>
                <div>{customerContext.phone}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lifetime COD Spend</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)', fontSize: '15px' }}>
                  ৳{(customerContext.total_spent || 0).toLocaleString('en-BD')}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--navy)', display: 'block', marginBottom: '8px' }}>
                  Past Orders ({(customerContext.orders || []).length})
                </span>

                {(customerContext.orders || []).map((o) => (
                  <div
                    key={o.id}
                    style={{
                      padding: '8px',
                      background: 'var(--paper-2)',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{o.order_number}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span>৳{o.total}</span>
                      <span style={{ textTransform: 'capitalize' }}>{o.order_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Select a customer to view their previous purchases & profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
