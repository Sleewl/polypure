import { useState } from 'react';
import { Heart, X, GraduationCap } from 'lucide-react';
import type { Profile } from '../types/database';

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: 'like' | 'dislike') => void;
}

export default function SwipeCard({ profile, onSwipe }: SwipeCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const age = profile.birth_date
    ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear()
    : null;

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const startX = window.innerWidth / 2;
    setDragOffset(touch.clientX - startX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) > 100) {
      onSwipe(dragOffset > 0 ? 'like' : 'dislike');
    }
    setDragOffset(0);
  };

  const photos = Array.isArray(profile.photos) && profile.photos.length > 0
    ? profile.photos
    : ['https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600'];

  return (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl transition-transform"
        style={{
          transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full h-full">
          <img
            src={photos[currentPhotoIndex]}
            alt={profile.first_name}
            className="w-full h-full object-cover"
          />

          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4">
            {photos.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                }`}
                onClick={() => setCurrentPhotoIndex(index)}
              />
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="mb-3">
              <h2 className="text-3xl font-bold mb-1">
                {profile.first_name} {profile.last_name?.[0]}.{age ? `, ${age}` : ''}
              </h2>

              {profile.university && (
                <div className="flex items-center gap-2 text-sm mb-1">
                  <GraduationCap size={16} />
                  <span>{profile.faculty || profile.university}</span>
                  {profile.course && <span>• {profile.course} курс</span>}
                </div>
              )}

              {profile.bio && (
                <p className="text-sm opacity-90 line-clamp-2 mt-2">{profile.bio}</p>
              )}
            </div>

            {profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.interests.slice(0, 5).map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>

          {dragOffset !== 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              {dragOffset > 0 ? (
                <div className="px-8 py-4 bg-green-500 rounded-2xl rotate-12 border-4 border-white">
                  <Heart className="text-white" size={48} />
                </div>
              ) : (
                <div className="px-8 py-4 bg-red-500 rounded-2xl -rotate-12 border-4 border-white">
                  <X className="text-white" size={48} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="absolute -bottom-20 left-0 right-0 flex justify-center gap-6">
        <button
          onClick={() => onSwipe('dislike')}
          className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <X className="text-red-500" size={32} />
        </button>
        <button
          onClick={() => onSwipe('like')}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-red-500 shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <Heart className="text-white" size={32} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
