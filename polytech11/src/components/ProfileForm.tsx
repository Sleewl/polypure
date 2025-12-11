import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import type { Profile } from '../types/database';

interface ProfileFormProps {
  profile?: Partial<Profile>;
  onSave: (profile: Partial<Profile>) => void;
  onCancel?: () => void;
}

const INTERESTS_OPTIONS = [
  'Спорт', 'Музыка', 'Кино', 'Путешествия', 'Чтение', 'Игры',
  'Программирование', 'Искусство', 'Фотография', 'Кулинария',
  'Танцы', 'Йога', 'Наука', 'Мода', 'Животные'
];

export default function ProfileForm({ profile, onSave, onCancel }: ProfileFormProps) {
  const [formData, setFormData] = useState<Partial<Profile>>({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    bio: profile?.bio || '',
    photos: profile?.photos || [],
    interests: profile?.interests || [],
    university: profile?.university || 'СПбПУ',
    faculty: profile?.faculty || '',
    course: profile?.course,
    birth_date: profile?.birth_date || '',
    gender: profile?.gender || '',
    looking_for: profile?.looking_for || '',
  });

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests?.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...(prev.interests || []), interest]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Фотографии</label>
        <div className="grid grid-cols-3 gap-3">
          {formData.photos?.map((photo, index) => (
            <div key={index} className="relative aspect-square">
              <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    photos: prev.photos?.filter((_, i) => i !== index)
                  }));
                }}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          ))}
          {(formData.photos?.length || 0) < 6 && (
            <button
              type="button"
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition"
            >
              <Camera className="text-gray-400" size={32} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Имя</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Фамилия</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">О себе</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
          placeholder="Расскажите о себе..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Дата рождения</label>
          <input
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Пол</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          >
            <option value="">Выберите</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Университет</label>
        <input
          type="text"
          value={formData.university}
          onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="СПбПУ"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Факультет</label>
          <input
            type="text"
            value={formData.faculty}
            onChange={(e) => setFormData(prev => ({ ...prev, faculty: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Институт компьютерных наук"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Курс</label>
          <select
            value={formData.course || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, course: Number(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Выберите</option>
            {[1, 2, 3, 4, 5, 6].map(c => (
              <option key={c} value={c}>{c} курс</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Кого ищете</label>
        <select
          value={formData.looking_for}
          onChange={(e) => setFormData(prev => ({ ...prev, looking_for: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          required
        >
          <option value="">Выберите</option>
          <option value="male">Парней</option>
          <option value="female">Девушек</option>
          <option value="all">Всех</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Интересы</label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS_OPTIONS.map(interest => (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                formData.interests?.includes(interest)
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
        >
          Сохранить
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
