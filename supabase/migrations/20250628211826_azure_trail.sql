/*
  # Complete Database Schema for Diaspora Connect

  1. New Tables
    - `profiles` - User profile information extending auth.users
    - `cultural_backgrounds` - Cultural heritage and preferences
    - `personality_assessments` - Big Five personality model scores
    - `cultural_quiz_results` - Cultural knowledge quiz results
    - `user_preferences` - Matching preferences and criteria
    - `matches` - User matching records with compatibility scores
    - `conversations` - Chat conversations between matched users
    - `messages` - Individual messages in conversations
    - `endorsements` - Community endorsements for users
    - `verification_documents` - Identity verification documents
    - `cultural_events` - Community cultural events
    - `event_attendees` - Event attendance tracking
    - `user_activities` - User activity tracking for recommendations

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access control
    - Ensure users can only access their own data and public information

  3. Performance
    - Add indexes for location-based queries
    - Add full-text search indexes
    - Add indexes for matching and compatibility queries

  4. Functions & Triggers
    - Auto-update timestamp triggers
    - Helper functions for data management
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'non-binary', 'other')),
  location_city text NOT NULL,
  location_country text NOT NULL,
  location_coordinates geography(POINT, 4326),
  occupation text,
  education_level text,
  bio text,
  profile_photo_url text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cultural backgrounds table
CREATE TABLE IF NOT EXISTS cultural_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  primary_tribe text NOT NULL,
  secondary_tribes text[],
  birth_country text NOT NULL,
  languages_spoken text[] NOT NULL DEFAULT '{}',
  language_fluency jsonb DEFAULT '{}', -- {"english": 5, "yoruba": 4, "french": 3}
  religion text,
  religious_importance integer CHECK (religious_importance BETWEEN 1 AND 5),
  traditional_values_importance integer CHECK (traditional_values_importance BETWEEN 1 AND 5),
  family_involvement_preference integer CHECK (family_involvement_preference BETWEEN 1 AND 5),
  cultural_practices jsonb DEFAULT '{}', -- Array of cultural practices they follow
  dietary_restrictions text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Personality assessments (Big Five model)
CREATE TABLE IF NOT EXISTS personality_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  openness_score decimal(3,2) CHECK (openness_score BETWEEN 0 AND 5),
  conscientiousness_score decimal(3,2) CHECK (conscientiousness_score BETWEEN 0 AND 5),
  extraversion_score decimal(3,2) CHECK (extraversion_score BETWEEN 0 AND 5),
  agreeableness_score decimal(3,2) CHECK (agreeableness_score BETWEEN 0 AND 5),
  neuroticism_score decimal(3,2) CHECK (neuroticism_score BETWEEN 0 AND 5),
  assessment_version text DEFAULT 'v1.0',
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Cultural quiz results
CREATE TABLE IF NOT EXISTS cultural_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_version text DEFAULT 'v1.0',
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  score_percentage decimal(5,2) NOT NULL,
  category_scores jsonb DEFAULT '{}', -- {"west_african": 85, "traditions": 90, "values": 80}
  time_taken_seconds integer,
  passed boolean GENERATED ALWAYS AS (score_percentage >= 60) STORED,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- User preferences for matching
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  age_min integer DEFAULT 18,
  age_max integer DEFAULT 65,
  max_distance_km integer DEFAULT 100,
  preferred_genders text[] DEFAULT '{}',
  preferred_tribes text[] DEFAULT '{}',
  preferred_religions text[] DEFAULT '{}',
  education_importance integer CHECK (education_importance BETWEEN 1 AND 5) DEFAULT 3,
  location_flexibility integer CHECK (location_flexibility BETWEEN 1 AND 5) DEFAULT 3,
  cultural_similarity_importance integer CHECK (cultural_similarity_importance BETWEEN 1 AND 5) DEFAULT 4,
  family_involvement_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  compatibility_score decimal(5,2) NOT NULL,
  cultural_compatibility decimal(5,2) NOT NULL,
  personality_compatibility decimal(5,2) NOT NULL,
  location_compatibility decimal(5,2) NOT NULL,
  user1_action text CHECK (user1_action IN ('like', 'pass', 'super_like', 'pending')) DEFAULT 'pending',
  user2_action text CHECK (user2_action IN ('like', 'pass', 'super_like', 'pending')) DEFAULT 'pending',
  is_mutual_match boolean GENERATED ALWAYS AS (user1_action = 'like' AND user2_action = 'like') STORED,
  matched_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  user1_unread_count integer DEFAULT 0,
  user2_unread_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'video', 'translation')),
  original_language text,
  translated_content jsonb DEFAULT '{}', -- {"en": "Hello", "fr": "Bonjour"}
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Endorsements table
CREATE TABLE IF NOT EXISTS endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  endorsed_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  endorsement_type text NOT NULL CHECK (endorsement_type IN ('cultural_knowledge', 'character', 'family_values', 'community_service')),
  message text NOT NULL,
  is_verified boolean DEFAULT false,
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(endorser_id, endorsed_id, endorsement_type)
);

-- Verification documents table
CREATE TABLE IF NOT EXISTS verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('government_id', 'profile_photo', 'video_selfie')),
  file_url text NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_by uuid REFERENCES profiles(id),
  verification_notes text,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Cultural events table
CREATE TABLE IF NOT EXISTS cultural_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('cultural', 'social', 'educational', 'religious')),
  event_date timestamptz NOT NULL,
  location_name text NOT NULL,
  location_address text,
  location_coordinates geography(POINT, 4326),
  max_attendees integer,
  current_attendees integer DEFAULT 0,
  is_public boolean DEFAULT true,
  target_tribes text[] DEFAULT '{}',
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES cultural_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  attendance_status text DEFAULT 'going' CHECK (attendance_status IN ('going', 'maybe', 'not_going')),
  registered_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- User activities for recommendation engine
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('profile_view', 'like', 'pass', 'message_sent', 'event_join', 'quiz_complete')),
  target_user_id uuid REFERENCES profiles(id),
  target_event_id uuid REFERENCES cultural_events(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view public profile data" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own cultural background" ON cultural_backgrounds;
DROP POLICY IF EXISTS "Users can manage own cultural background" ON cultural_backgrounds;
DROP POLICY IF EXISTS "Users can view their matches" ON matches;
DROP POLICY IF EXISTS "Users can update their match actions" ON matches;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view public events" ON cultural_events;
DROP POLICY IF EXISTS "Users can create events" ON cultural_events;

-- RLS Policies for profiles
CREATE POLICY "Users can view public profile data"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for cultural_backgrounds
CREATE POLICY "Users can view own cultural background"
  ON cultural_backgrounds
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cultural background"
  ON cultural_backgrounds
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for matches
CREATE POLICY "Users can view their matches"
  ON matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their match actions"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- RLS Policies for cultural_events
CREATE POLICY "Users can view public events"
  ON cultural_events
  FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = organizer_id);

CREATE POLICY "Users can create events"
  ON cultural_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST (location_coordinates);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles (is_active, last_active_at);
CREATE INDEX IF NOT EXISTS idx_cultural_backgrounds_tribe ON cultural_backgrounds (primary_tribe);
CREATE INDEX IF NOT EXISTS idx_cultural_backgrounds_languages ON cultural_backgrounds USING GIN (languages_spoken);
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches (user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_compatibility ON matches (compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date_location ON cultural_events (event_date, location_coordinates);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING GIN (to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(bio, '')));
CREATE INDEX IF NOT EXISTS idx_events_search ON cultural_events USING GIN (to_tsvector('english', title || ' ' || description));

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_cultural_backgrounds_updated_at ON cultural_backgrounds;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
DROP TRIGGER IF EXISTS update_cultural_events_updated_at ON cultural_events;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_backgrounds_updated_at BEFORE UPDATE ON cultural_backgrounds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_events_updated_at BEFORE UPDATE ON cultural_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();