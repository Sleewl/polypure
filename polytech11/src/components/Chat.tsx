import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import type { Match, Message, Profile } from '../types/database';

interface ChatProps {
  match: Match;
  profile: Profile;
  currentUserId: string;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (content: string) => void;
}

export default function Chat({
  profile,
  currentUserId,
  messages,
  onBack,
  onSendMessage
}: ChatProps) {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  const photo = Array.isArray(profile.photos) && profile.photos[0]
    ? profile.photos[0]
    : 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200';

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white shadow-sm">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ArrowLeft size={24} />
        </button>
        <img
          src={photo}
          alt={profile.first_name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold">
            {profile.first_name} {profile.last_name?.[0]}.
          </h3>
          {profile.university && (
            <p className="text-xs text-gray-500">{profile.faculty || profile.university}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-2">🎉 Новое совпадение!</p>
            <p className="text-sm">Начните разговор первым</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      isOwn ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="p-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
