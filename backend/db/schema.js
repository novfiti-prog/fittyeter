const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../fitmeet.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      language TEXT DEFAULT 'tr',
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_active INTEGER DEFAULT 1
    );

    -- User profiles (fitness data)
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      age INTEGER,
      gender TEXT CHECK(gender IN ('male','female','other')),
      height_cm REAL,
      weight_kg REAL,
      target_weight_kg REAL,
      fitness_goal TEXT CHECK(fitness_goal IN ('lose_weight','gain_muscle','maintain','general_fitness','endurance')),
      fitness_level TEXT CHECK(fitness_level IN ('beginner','intermediate','advanced')),
      job_type TEXT CHECK(job_type IN ('sedentary','light_active','moderate_active','very_active')),
      weekly_workout_hours INTEGER DEFAULT 3,
      workout_location TEXT CHECK(workout_location IN ('home','gym','both')),
      equipment TEXT, -- JSON array of available equipment
      health_notes TEXT,
      dietary_restrictions TEXT, -- JSON array
      onboarding_completed INTEGER DEFAULT 0,
      profile_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- Weekly weight logs
    CREATE TABLE IF NOT EXISTS weight_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      weight_kg REAL NOT NULL,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    );

    -- AI Generated Programs
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      start_date DATE NOT NULL,
      end_date DATE,
      duration_weeks INTEGER DEFAULT 4,
      is_active INTEGER DEFAULT 1,
      workout_plan TEXT NOT NULL, -- JSON
      meal_plan TEXT NOT NULL, -- JSON
      ai_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Daily workout logs
    CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      program_id INTEGER REFERENCES programs(id),
      log_date DATE NOT NULL,
      day_number INTEGER,
      exercises_completed TEXT, -- JSON array of completed exercise IDs
      workout_completed INTEGER DEFAULT 0,
      duration_minutes INTEGER,
      difficulty_rating INTEGER CHECK(difficulty_rating BETWEEN 1 AND 5),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Meal logs
    CREATE TABLE IF NOT EXISTS meal_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      program_id INTEGER REFERENCES programs(id),
      log_date DATE NOT NULL,
      meal_type TEXT CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
      meal_completed INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Achievements/Badges
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name_tr TEXT NOT NULL,
      name_en TEXT NOT NULL,
      description_tr TEXT,
      description_en TEXT,
      icon TEXT,
      points INTEGER DEFAULT 10
    );

    -- User achievements
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_id INTEGER NOT NULL REFERENCES achievements(id),
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id)
    );

    -- Friends system
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT CHECK(status IN ('pending','accepted','blocked')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(requester_id, addressee_id)
    );

    -- AI Chat history
    CREATE TABLE IF NOT EXISTS ai_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT CHECK(role IN ('user','assistant')) NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title_tr TEXT,
      title_en TEXT,
      message_tr TEXT,
      message_en TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert default achievements
    INSERT OR IGNORE INTO achievements (key, name_tr, name_en, description_tr, description_en, icon, points) VALUES
      ('first_workout', 'İlk Antrenman', 'First Workout', 'İlk antrenmanını tamamladın!', 'You completed your first workout!', '🏋️', 10),
      ('week_streak', '7 Gün Serisi', '7 Day Streak', '7 gün üst üste antrenman yaptın!', 'Worked out 7 days in a row!', '🔥', 50),
      ('month_warrior', 'Ay Savaşçısı', 'Month Warrior', '30 günlük programı tamamladın!', 'Completed a 30-day program!', '⚔️', 100),
      ('weight_goal', 'Hedefe Ulaştın', 'Goal Reached', 'Hedef kilona ulaştın!', 'You reached your target weight!', '🎯', 200),
      ('social_butterfly', 'Sosyal Kelebek', 'Social Butterfly', '5 arkadaş edinin!', 'Added 5 friends!', '🦋', 30),
      ('early_bird', 'Erken Kuş', 'Early Bird', '10 sabah antrenmanı yaptın!', 'Completed 10 morning workouts!', '🌅', 40),
      ('consistency_king', 'Tutarlılık Kralı', 'Consistency King', '30 antrenman tamamladın!', 'Completed 30 workouts!', '👑', 150),
      ('meal_master', 'Beslenme Ustası', 'Meal Master', '7 gün beslenme planına uydun!', 'Followed meal plan for 7 days!', '🥗', 60);
  `);
}

module.exports = { getDB };
