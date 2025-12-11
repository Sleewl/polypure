import { MessageCircle } from 'lucide-react';
import type { Match, Profile } from '../types/database';

interface ChatListProps {
  matches: Array<Match & { profile: Profile; lastMessage?: string }>;
  onSelectChat: (match: Match) => void;
}

export default function ChatList({ matches, onSelectChat }: ChatListProps) {
  const formatTime = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins}м`;
    if (diffHours < 24) return `${diffHours}ч`;
    if (diffDays < 7) return `${diffDays}д`;
    return messageDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MessageCircle size={64} className="text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Пока нет совпадений</h3>
        <p className="text-gray-500">Начните свайпать анкеты, чтобы найти совпадения!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {matches.map((match) => {
        const photo = Array.isArray(match.profile.photos) && match.profile.photos[0]
          ? match.profile.photos[0]
          : 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200';

        return (
          <button
            key={match.id}
            onClick={() => onSelectChat(match)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition"
          >
            <div className="relative">
              <img
                src={photo}
                alt={match.profile.first_name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </div>

            <div className="flex-1 text-left">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">
                  {match.profile.first_name} {match.profile.last_name?.[0]}.
                </h4>
                <span className="text-xs text-gray-500">
                  {formatTime(match.last_message_at)}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {match.lastMessage || 'Новое совпадение!'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
