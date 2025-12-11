import { useState, useEffect } from 'react';
import { Heart, MessageCircle, User, Flame } from 'lucide-react';
import { supabase } from './lib/supabase';
import { initTelegramWebApp, useTelegramWebApp } from './lib/telegram';
import SwipeCard from './components/SwipeCard';
import ProfileForm from './components/ProfileForm';
import ChatList from './components/ChatList';
import Chat from './components/Chat';
import type { Profile, Match, Message } from './types/database';

type View = 'swipe' | 'matches' | 'profile' | 'chat';

function App() {
  const { webApp, user } = useTelegramWebApp();
  const [currentView, setCurrentView] = useState<View>('swipe');
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [matches, setMatches] = useState<Array<Match & { profile: Profile; lastMessage?: string }>>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initTelegramWebApp();
    const timer = setTimeout(() => {
      if (user) {
        loadUserProfile();
      } else {
        setLoading(false);
        setCurrentView('profile');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (currentProfile) {
      loadProfiles();
      loadMatches();
    }
  }, [currentProfile]);

  const loadUserProfile = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        setCurrentProfile(existingProfile);
        setCurrentView('swipe');
      } else {
        setCurrentView('profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      if (!currentProfile) return;

      const { data: swipedProfiles } = await supabase
        .from('swipes')
        .select('to_user_id')
        .eq('from_user_id', currentProfile.id);

      const swipedIds = new Set(swipedProfiles?.map(s => s.to_user_id) || []);

      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .neq('id', currentProfile.id);

      if (currentProfile.looking_for && currentProfile.looking_for !== 'all') {
        query = query.eq('gender', currentProfile.looking_for);
      }

      const { data } = await query.limit(50);

      if (data) {
        const filtered = data.filter(p => !swipedIds.has(p.id));
        setProfiles(filtered);
        setCurrentProfileIndex(0);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadMatches = async () => {
    try {
      if (!currentProfile) return;

      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at,
          last_message_at
        `)
        .or(`user1_id.eq.${currentProfile.id},user2_id.eq.${currentProfile.id}`)
        .order('last_message_at', { ascending: false });

      if (data && data.length > 0) {
        const otherUserIds = data.map(match =>
          match.user1_id === currentProfile.id ? match.user2_id : match.user1_id
        );

        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', otherUserIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const matchesWithProfiles = data.map(match => {
          const otherUserId = match.user1_id === currentProfile.id ? match.user2_id : match.user1_id;
          const otherProfile = profileMap.get(otherUserId);
          return {
            ...match,
            profile: otherProfile as Profile,
          };
        });
        setMatches(matchesWithProfiles);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const handleSwipe = async (direction: 'like' | 'dislike') => {
    try {
      if (!currentProfile || currentProfileIndex >= profiles.length) return;

      const targetProfile = profiles[currentProfileIndex];

      await supabase.from('swipes').insert({
        from_user_id: currentProfile.id,
        to_user_id: targetProfile.id,
        direction,
      });

      if (direction === 'like') {
        try {
          webApp?.HapticFeedback.impactOccurred('medium');
        } catch (e) {
          // Haptic not available
        }

        const { data: mutualMatch } = await supabase
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${currentProfile.id},user2_id.eq.${currentProfile.id}`)
          .or(`user1_id.eq.${targetProfile.id},user2_id.eq.${targetProfile.id}`)
          .maybeSingle();

        if (mutualMatch) {
          const message = `🎉 Новое совпадение с ${targetProfile.first_name}!`;
          webApp?.showAlert?.(message) || alert(message);
          loadMatches();
        }
      }

      setCurrentProfileIndex(prev => prev + 1);

      if (currentProfileIndex >= profiles.length - 3) {
        loadProfiles();
      }
    } catch (error) {
      console.error('Error swiping:', error);
    }
  };

  const handleSaveProfile = async (profileData: Partial<Profile>) => {
    try {
      const telegramId = user?.id || Math.floor(Math.random() * 1000000) + 100000;
      const userId = user?.id ? `user_${user.id}` : `demo_${telegramId}`;

      const fullProfile = {
        ...profileData,
        id: userId as any,
        telegram_id: telegramId,
        username: user?.username || 'demo_user',
        first_name: profileData.first_name || user?.first_name || 'User',
        is_active: true,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(fullProfile)
        .select()
        .single();

      if (error) throw error;

      setCurrentProfile(data);
      setCurrentView('swipe');
      webApp?.showAlert?.('Профиль сохранен!') || alert('Профиль сохранен!');
    } catch (error) {
      console.error('Error saving profile:', error);
      webApp?.showAlert?.('Ошибка при сохранении профиля') || alert('Ошибка при сохранении профиля');
    }
  };

  const handleSelectChat = async (match: Match) => {
    setSelectedMatch(match);
    setCurrentView('chat');

    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', match.id)
        .order('created_at', { ascending: true });

      if (data) {
        setChatMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      if (!selectedMatch || !currentProfile) return;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: selectedMatch.id,
          sender_id: currentProfile.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setChatMessages(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Flame className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  const currentCard = profiles[currentProfileIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50">
      <div className="max-w-md mx-auto h-screen flex flex-col">
        {currentView === 'profile' && (
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                Создайте профиль
              </h1>
              <p className="text-gray-600 mt-1">Расскажите о себе</p>
            </div>
            <ProfileForm
              profile={currentProfile || undefined}
              onSave={handleSaveProfile}
            />
          </div>
        )}

        {currentView === 'swipe' && (
          <div className="flex-1 flex flex-col">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-8 h-8 text-pink-500" />
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                  PolyDate
                </span>
              </div>
            </div>

            <div className="flex-1 px-4 pb-32 flex items-center justify-center">
              {currentCard ? (
                <div className="w-full h-full max-w-sm max-h-[600px]">
                  <SwipeCard
                    profile={currentCard}
                    onSwipe={handleSwipe}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Heart size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Анкеты закончились</p>
                  <p className="text-sm mt-2">Вернитесь позже</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'matches' && (
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold">Совпадения</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatList matches={matches} onSelectChat={handleSelectChat} />
            </div>
          </div>
        )}

        {currentView === 'chat' && selectedMatch && (
          <Chat
            match={selectedMatch}
            profile={matches.find(m => m.id === selectedMatch.id)?.profile!}
            currentUserId={currentProfile?.id || ''}
            messages={chatMessages}
            onBack={() => setCurrentView('matches')}
            onSendMessage={handleSendMessage}
          />
        )}

        {currentView !== 'chat' && (
          <div className="bg-white border-t border-gray-200 px-8 py-4 flex justify-around">
            <button
              onClick={() => setCurrentView('swipe')}
              className={`p-3 rounded-full transition ${
                currentView === 'swipe'
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Flame size={28} />
            </button>
            <button
              onClick={() => setCurrentView('matches')}
              className={`p-3 rounded-full transition relative ${
                currentView === 'matches'
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <MessageCircle size={28} />
              {matches.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {matches.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`p-3 rounded-full transition ${
                currentView === 'profile'
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <User size={28} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
