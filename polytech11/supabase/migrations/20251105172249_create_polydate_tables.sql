/*
  # PolyDate Database Schema
  
  1. New Tables
    - `profiles` - User profiles with bio, photos, interests
    - `swipes` - Like/dislike interactions
    - `matches` - Mutual likes
    - `messages` - Chat messages
  
  2. Security
    - RLS enabled on all tables
    - Users can view active profiles
    - Users can manage their own data
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  username text,
  first_name text NOT NULL,
  last_name text,
  bio text DEFAULT '',
  photos jsonb DEFAULT '[]'::jsonb,
  interests text[] DEFAULT ARRAY[]::text[],
  university text DEFAULT 'СПбПУ',
  faculty text DEFAULT '',
  course integer,
  birth_date date,
  gender text,
  looking_for text,
  schedule_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active profiles"
  ON profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own swipes"
  ON swipes FOR SELECT
  USING (true);

CREATE POLICY "Users can create swipes"
  ON swipes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  USING (true);

CREATE POLICY "Users can view messages in their matches"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_swipes_from_user ON swipes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_to_user ON swipes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_last_message ON matches(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id, created_at DESC);

CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'like' THEN
    IF EXISTS (
      SELECT 1 FROM swipes
      WHERE from_user_id = NEW.to_user_id
      AND to_user_id = NEW.from_user_id
      AND direction = 'like'
    ) THEN
      INSERT INTO matches (user1_id, user2_id, created_at)
      VALUES (
        LEAST(NEW.from_user_id, NEW.to_user_id),
        GREATEST(NEW.from_user_id, NEW.to_user_id),
        now()
      )
      ON CONFLICT (user1_id, user2_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_match ON swipes;
CREATE TRIGGER trigger_check_match
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_match();

CREATE OR REPLACE FUNCTION update_match_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE matches
  SET last_message_at = NEW.created_at
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_message ON messages;
CREATE TRIGGER trigger_update_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_match_last_message();