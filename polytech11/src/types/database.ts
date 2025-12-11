export interface Profile {
  id: string;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  bio: string;
  photos: string[];
  interests: string[];
  university: string;
  faculty: string;
  course?: number;
  birth_date?: string;
  gender?: string;
  looking_for?: string;
  schedule_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Swipe {
  id: string;
  from_user_id: string;
  to_user_id: string;
  direction: 'like' | 'dislike';
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}
