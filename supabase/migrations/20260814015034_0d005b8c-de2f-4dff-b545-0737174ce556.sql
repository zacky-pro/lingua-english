
-- ========== helpers ==========
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- ========== profiles ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Learner',
  avatar_emoji TEXT NOT NULL DEFAULT '🦊',
  level_code TEXT NOT NULL DEFAULT 'A0',
  goals TEXT[] NOT NULL DEFAULT '{}',
  focus_skills TEXT[] NOT NULL DEFAULT '{}',
  daily_goal_minutes INT NOT NULL DEFAULT 15,
  xp INT NOT NULL DEFAULT 0,
  streak_count INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  interface_language TEXT NOT NULL DEFAULT 'id',
  theme TEXT NOT NULL DEFAULT 'system',
  reduce_motion BOOLEAN NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  leaderboard_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "leaderboard profiles readable" ON public.profiles FOR SELECT TO authenticated USING (leaderboard_opt_in = true);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ========== content ==========
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_code TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  objective TEXT,
  objective_id TEXT,
  skill TEXT NOT NULL DEFAULT 'vocabulary',
  level_code TEXT NOT NULL DEFAULT 'A0',
  estimated_minutes INT NOT NULL DEFAULT 5,
  xp_reward INT NOT NULL DEFAULT 20,
  teach JSONB NOT NULL DEFAULT '[]',
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons ON DELETE CASCADE,
  kind TEXT NOT NULL,
  prompt TEXT NOT NULL,
  prompt_id TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  answer TEXT NOT NULL,
  explanation TEXT,
  audio_text TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  ipa TEXT,
  word_type TEXT,
  meaning_id TEXT NOT NULL,
  meaning_en TEXT,
  example TEXT,
  example_id TEXT,
  category TEXT NOT NULL DEFAULT 'Daily Life',
  level_code TEXT NOT NULL DEFAULT 'A0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.grammar_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  level_code TEXT NOT NULL DEFAULT 'A0',
  summary TEXT NOT NULL,
  summary_id TEXT,
  explanation JSONB NOT NULL DEFAULT '[]',
  examples JSONB NOT NULL DEFAULT '[]',
  exercises JSONB NOT NULL DEFAULT '[]',
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.listening_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  level_code TEXT NOT NULL DEFAULT 'A0',
  transcript TEXT NOT NULL,
  translation TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.reading_passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  level_code TEXT NOT NULL DEFAULT 'A0',
  body TEXT NOT NULL,
  glossary JSONB NOT NULL DEFAULT '[]',
  questions JSONB NOT NULL DEFAULT '[]',
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.writing_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  level_code TEXT NOT NULL DEFAULT 'A0',
  prompt TEXT NOT NULL,
  guidance TEXT,
  min_words INT NOT NULL DEFAULT 20,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.conversation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  situation TEXT NOT NULL,
  partner_style TEXT NOT NULL DEFAULT 'Friendly',
  difficulty TEXT NOT NULL DEFAULT 'A1',
  icon TEXT NOT NULL DEFAULT 'MessageCircle',
  opener TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  metric TEXT NOT NULL,
  target INT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0
);

GRANT SELECT ON public.courses, public.modules, public.lessons, public.exercises, public.vocabulary,
  public.grammar_topics, public.listening_exercises, public.reading_passages, public.writing_prompts,
  public.conversation_scenarios, public.achievements TO anon, authenticated;
GRANT ALL ON public.courses, public.modules, public.lessons, public.exercises, public.vocabulary,
  public.grammar_topics, public.listening_exercises, public.reading_passages, public.writing_prompts,
  public.conversation_scenarios, public.achievements TO service_role;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read courses" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read modules" ON public.modules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read lessons" ON public.lessons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read exercises" ON public.exercises FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read vocabulary" ON public.vocabulary FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read grammar" ON public.grammar_topics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read listening" ON public.listening_exercises FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read reading" ON public.reading_passages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read writing" ON public.writing_prompts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read scenarios" ON public.conversation_scenarios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read achievements" ON public.achievements FOR SELECT TO anon, authenticated USING (true);

-- ========== user data ==========
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  accuracy INT NOT NULL DEFAULT 0,
  xp_earned INT NOT NULL DEFAULT 0,
  seconds_spent INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE TABLE public.user_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES public.vocabulary ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new',
  ease NUMERIC NOT NULL DEFAULT 2.5,
  interval_days NUMERIC NOT NULL DEFAULT 0,
  reps INT NOT NULL DEFAULT 0,
  lapses INT NOT NULL DEFAULT 0,
  favorite BOOLEAN NOT NULL DEFAULT false,
  due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vocabulary_id)
);
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'lesson',
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.speaking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  transcript TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}',
  feedback TEXT,
  seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  scenario_id UUID REFERENCES public.conversation_scenarios ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Conversation',
  partner_style TEXT NOT NULL DEFAULT 'Friendly',
  difficulty TEXT NOT NULL DEFAULT 'A1',
  review JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);
CREATE TABLE public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.conversation_sessions ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.writing_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  prompt_id UUID REFERENCES public.writing_prompts ON DELETE SET NULL,
  prompt_text TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements ON DELETE CASCADE,
  progress INT NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMPTZ,
  UNIQUE (user_id, achievement_id)
);
CREATE TABLE public.daily_activity (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes INT NOT NULL DEFAULT 0,
  xp INT NOT NULL DEFAULT 0,
  lessons_completed INT NOT NULL DEFAULT 0,
  words_reviewed INT NOT NULL DEFAULT 0,
  speaking_minutes INT NOT NULL DEFAULT 0,
  listening_minutes INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, activity_date)
);
CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount INT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.placement_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  level_code TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress, public.user_vocabulary, public.quiz_attempts,
  public.speaking_sessions, public.conversation_sessions, public.conversation_messages, public.writing_submissions,
  public.user_achievements, public.daily_activity, public.xp_transactions, public.placement_results TO authenticated;
GRANT ALL ON public.lesson_progress, public.user_vocabulary, public.quiz_attempts,
  public.speaking_sessions, public.conversation_sessions, public.conversation_messages, public.writing_submissions,
  public.user_achievements, public.daily_activity, public.xp_transactions, public.placement_results TO service_role;

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own lesson_progress" ON public.lesson_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own user_vocabulary" ON public.user_vocabulary FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own quiz_attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own speaking_sessions" ON public.speaking_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own conversation_sessions" ON public.conversation_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own conversation_messages" ON public.conversation_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own writing_submissions" ON public.writing_submissions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own user_achievements" ON public.user_achievements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own daily_activity" ON public.daily_activity FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own xp_transactions" ON public.xp_transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own placement_results" ON public.placement_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_lessons_module ON public.lessons(module_id, sort_order);
CREATE INDEX idx_exercises_lesson ON public.exercises(lesson_id, sort_order);
CREATE INDEX idx_uv_due ON public.user_vocabulary(user_id, due_at);
CREATE INDEX idx_conv_msgs ON public.conversation_messages(session_id, created_at);
CREATE INDEX idx_daily ON public.daily_activity(user_id, activity_date DESC);
