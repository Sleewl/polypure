/*
  # Recreate tables with TEXT IDs
  
  Drops and recreates all tables with text-based IDs for better compatibility
*/

DROP TRIGGER IF EXISTS trigger_update_last_message ON messages;
DROP TRIGGER IF EXISTS trigger_check_match ON swipes;
DROP FUNCTION IF EXISTS check_and_create_match();
DROP FUNCTION IF EXISTS update_match_last_message();

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS swipes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,
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
  from_user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

CREATE OR REPLACE FUNCTION update_match_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE matches
  SET last_message_at = NEW.created_at
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_match
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_match();

CREATE TRIGGER trigger_update_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_match_last_message();

INSERT INTO profiles (id, telegram_id, first_name, last_name, bio, photos, interests, faculty, course, birth_date, gender, looking_for, is_active) 
VALUES 
('user_111111', 111111, 'Мария', 'Петрова', 'Люблю путешествия и кино 🎬', '["https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=600"]', ARRAY['Кино', 'Путешествия', 'Музыка'], 'ИКН', 2, '2003-05-15', 'female', 'male', true),
('user_222222', 222222, 'Александр', 'Иванов', 'Программист, занимаюсь спортом', '["https://images.pexels.com/photos/1080873/pexels-photo-1080873.jpeg?auto=compress&cs=tinysrgb&w=600"]', ARRAY['Программирование', 'Спорт', 'Игры'], 'ИКН', 3, '2002-03-22', 'male', 'female', true),
('user_333333', 333333, 'Елена', 'Сидорова', 'Художница и фотограф 📸', '["https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600"]', ARRAY['Фотография', 'Искусство', 'Кулинария'], 'Гуманитарный', 2, '2003-08-10', 'female', 'all', true),
('user_444444', 444444, 'Дмитрий', 'Козлов', 'Студент физфака, люблю науку', '["https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600"]', ARRAY['Наука', 'Спорт', 'Чтение'], 'Физический факультет', 1, '2004-01-30', 'male', 'female', true),
('user_555555', 555555, 'Виктория', 'Смирнова', 'Танцовщица, люблю движение 💃', '["https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=600"]', ARRAY['Танцы', 'Музыка', 'Йога'], 'ИКН', 3, '2002-11-20', 'female', 'male', true),
('user_666666', 666666, 'Павел', 'Ульянов', 'Геймер и киноман', '["https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600"]', ARRAY['Игры', 'Кино', 'Аниме'], 'ИКН', 2, '2003-07-14', 'male', 'female', true),
('user_777777', 777777, 'Кристина', 'Волкова', 'Биолог, люблю животных 🐾', '["https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=600"]', ARRAY['Животные', 'Наука', 'Путешествия'], 'Биологический', 3, '2002-04-08', 'female', 'all', true),
('user_888888', 888888, 'Максим', 'Авдеев', 'Музыкант, играю в группе 🎸', '["https://images.pexels.com/photos/1080873/pexels-photo-1080873.jpeg?auto=compress&cs=tinysrgb&w=600"]', ARRAY['Музыка', 'Путешествия', 'Кино'], 'ИКН', 1, '2004-09-25', 'male', 'female', true),
('user_999999', 999999, 'Алиса', 'Морозова', 'Модница и шопоголик 👗', '["https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600"]', ARRAY['Мода', 'Шоппинг', 'Красота'], 'Гуманитарный', 2, '2003-12-03', 'female', 'male', true),
('user_101010', 101010, 'Евгений', 'Семёнов', 'Путешественник и рэпер', '["https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=600"]', ARRAY['Путешествия', 'Музыка', 'Хип-хоп'], 'ИКН', 3, '2002-06-11', 'male', 'female', true);