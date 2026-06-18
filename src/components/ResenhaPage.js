'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Avatar from './Avatar';

export default function ResenhaPage({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadMessages();
    // Subscribe to realtime messages
    const channel = supabase
      .channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadMessages() {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, users(name, avatar_choice, avatar_url_1, avatar_url_2, avatar_url_3)')
      .order('created_at', { ascending: true })
      .limit(200);

    if (data) setMessages(data);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function sendMessage() {
    if (!newMsg.trim()) return;

    const { error } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      message_type: 'user',
      content: newMsg.trim(),
    });

    if (!error) setNewMsg('');
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isOwnMessage = (msg) => msg.user_id === user.id;

  return (
    <div className="max-w-[900px] mx-auto p-5">
      <div className="card p-0 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 160px)', minHeight: 400 }}>
        {/* Header */}
        <div className="p-4 pb-2 border-b border-dark-200 bg-dark-50">
          <h3 className="section-title mb-0.5 text-base">💬 Resenha dos Meladores</h3>
          <span className="text-xs text-dark-500">Zoeira, provocações e sofrimento coletivo</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          {loading && (
            <div className="text-center py-10 text-dark-500 text-sm">Carregando mensagens...</div>
          )}

          {messages.map((msg, i) => {
            const isSystem = msg.message_type === 'system' || msg.message_type === 'zoeira';
            const isSummary = msg.message_type === 'summary';
            const isOwn = isOwnMessage(msg);
            const name = msg.users?.name || msg.user_name || 'Sistema';
            const time = new Date(msg.created_at).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            });

            if (isSummary) {
              return (
                <div key={msg.id || i} className="self-center max-w-[95%] animate-fade-in">
                  <div style={{
                    background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)',
                    border: '2px solid #F59E0B',
                    borderRadius: 12, padding: '16px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 8, textAlign: 'center' }}>🍯 RESUMO DA RODADA 🍯</div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#1C1917',
                      lineHeight: 1.7, whiteSpace: 'pre-wrap',
                    }}>{msg.content.replace(/###\s?/g, '').replace(/\*\*/g, '').replace(/<!-- .* -->/g, '').trim()}</div>
                    <div style={{ fontSize: 9, color: '#A16207', marginTop: 8, textAlign: 'right' }}>{time}</div>
                  </div>
                </div>
              );
            }

            if (isSystem) {
              return (
                <div key={msg.id || i} className="self-center max-w-[90%] animate-fade-in">
                  <div className={`rounded-xl px-3 py-2 text-center ${
                    msg.message_type === 'zoeira'
                      ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200'
                      : 'bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200'
                  }`}>
                    <div className="text-xs leading-relaxed text-dark-800">{msg.content}</div>
                    <div className="text-[9px] text-dark-400 mt-1">{time}</div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id || i}
                className={`flex gap-2 max-w-[80%] animate-fade-in ${
                  isOwn ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                <Avatar name={name} size={30} />
                <div className={`rounded-xl px-3 py-2 ${
                  isOwn
                    ? 'bg-primary-600 text-white rounded-tr-none'
                    : 'bg-dark-100 text-dark-900 rounded-tl-none'
                }`}>
                  <div className={`text-[11px] font-bold mb-0.5 ${
                    isOwn ? 'text-primary-200' : 'text-primary-600'
                  }`}>{name}</div>
                  <div className="text-sm leading-relaxed">{msg.content}</div>
                  <div className={`text-[9px] mt-1 text-right ${
                    isOwn ? 'text-primary-300' : 'text-dark-400'
                  }`}>{time}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-dark-200 bg-dark-50 flex gap-2 items-center">
          <input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Manda a resenha..."
            className="input-field flex-1 py-2.5 bg-white"
          />
          <button onClick={sendMessage} className="bg-primary-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-primary-700 transition-all whitespace-nowrap">
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
