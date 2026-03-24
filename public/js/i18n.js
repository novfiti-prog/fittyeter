/* ══════════════════════════════════════════
   FITMEET — i18n MODULE
   Turkish / English support
══════════════════════════════════════════ */

const I18N = {
  lang: 'tr',

  init(lang) {
    this.lang = lang || localStorage.getItem('fm_lang') || 'tr';
    this.apply();
  },

  set(lang) {
    this.lang = lang;
    localStorage.setItem('fm_lang', lang);
    document.documentElement.lang = lang;
    this.apply();
    // Update active lang buttons
    document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.textContent.trim().toLowerCase() === lang);
    });
  },

  apply() {
    const attr = `data-${this.lang}`;
    document.querySelectorAll(`[${attr}]`).forEach(el => {
      el.textContent = el.getAttribute(attr);
    });
    // Update placeholder texts if needed
    document.querySelectorAll('[data-placeholder-tr], [data-placeholder-en]').forEach(el => {
      const ph = el.getAttribute(`data-placeholder-${this.lang}`);
      if (ph) el.placeholder = ph;
    });
  },

  t(key) {
    return TRANSLATIONS[this.lang]?.[key] || TRANSLATIONS['tr']?.[key] || key;
  },
};

const TRANSLATIONS = {
  tr: {
    // Common
    'save': 'Kaydet', 'cancel': 'İptal', 'delete': 'Sil', 'edit': 'Düzenle',
    'loading': 'Yükleniyor...', 'error': 'Hata', 'success': 'Başarılı',
    'confirm': 'Onayla', 'back': 'Geri', 'next': 'Devam', 'done': 'Tamamlandı',
    'kg': 'kg', 'cm': 'cm',

    // Days
    'monday': 'Pazartesi', 'tuesday': 'Salı', 'wednesday': 'Çarşamba',
    'thursday': 'Perşembe', 'friday': 'Cuma', 'saturday': 'Cumartesi', 'sunday': 'Pazar',
    'mon': 'Pzt', 'tue': 'Sal', 'wed': 'Çar', 'thu': 'Per', 'fri': 'Cum', 'sat': 'Cmt', 'sun': 'Paz',

    // Dashboard
    'good_morning': 'Günaydın', 'good_afternoon': 'İyi Günler', 'good_evening': 'İyi Akşamlar',
    'total_workouts': 'Toplam Antrenman', 'this_week': 'Bu Hafta', 'current_streak': 'Seri',
    'days': 'gün', 'achievements': 'Başarı',

    // Fitness goals
    'lose_weight': 'Kilo Ver', 'gain_muscle': 'Kas Kazan', 'maintain': 'Formu Koru',
    'general_fitness': 'Genel Sağlık', 'endurance': 'Dayanıklılık',

    // Fitness levels
    'beginner': 'Başlangıç', 'intermediate': 'Orta', 'advanced': 'İleri',

    // Job types
    'sedentary': 'Hareketsiz', 'light_active': 'Hafif Aktif',
    'moderate_active': 'Orta Aktif', 'very_active': 'Çok Aktif',

    // Workout location
    'home': 'Ev', 'gym': 'Spor Salonu', 'both': 'Her İkisi',

    // Meal types
    'breakfast': 'Kahvaltı', 'lunch': 'Öğle', 'dinner': 'Akşam', 'snack': 'Ara Öğün',

    // Messages
    'workout_completed': 'Antrenman tamamlandı! 💪', 
    'meal_completed': 'Öğün tamamlandı! 🥗',
    'weight_logged': 'Kilo kaydedildi!',
    'friend_added': 'Arkadaşlık isteği gönderildi!',
    'program_generating': 'AI koçun programın hazırlıyor...',
    'rest_day': 'Dinlenme Günü', 'no_program': 'Henüz program yok',
    'sets': 'set', 'reps': 'tekrar', 'rest': 'dinlenme',

    // AI Coach
    'coach_hello': 'Merhaba! Ben senin AI fitness koçunum. Antrenman, beslenme veya genel sağlık konularında sorularını yanıtlamaya hazırım. Ne öğrenmek istersin?',
    'type_message': 'Koça bir şey sor...',
    
    // Placeholders
    'enter_weight': 'Kilo gir (kg)',
    'friend_email': 'Arkadaş e-postası',
  },
  en: {
    // Common
    'save': 'Save', 'cancel': 'Cancel', 'delete': 'Delete', 'edit': 'Edit',
    'loading': 'Loading...', 'error': 'Error', 'success': 'Success',
    'confirm': 'Confirm', 'back': 'Back', 'next': 'Continue', 'done': 'Done',
    'kg': 'kg', 'cm': 'cm',

    // Days
    'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
    'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday',
    'mon': 'Mon', 'tue': 'Tue', 'wed': 'Wed', 'thu': 'Thu', 'fri': 'Fri', 'sat': 'Sat', 'sun': 'Sun',

    // Dashboard
    'good_morning': 'Good Morning', 'good_afternoon': 'Good Afternoon', 'good_evening': 'Good Evening',
    'total_workouts': 'Total Workouts', 'this_week': 'This Week', 'current_streak': 'Streak',
    'days': 'days', 'achievements': 'Achievements',

    // Fitness goals
    'lose_weight': 'Lose Weight', 'gain_muscle': 'Gain Muscle', 'maintain': 'Maintain',
    'general_fitness': 'General Fitness', 'endurance': 'Endurance',

    // Fitness levels
    'beginner': 'Beginner', 'intermediate': 'Intermediate', 'advanced': 'Advanced',

    // Job types
    'sedentary': 'Sedentary', 'light_active': 'Light Active',
    'moderate_active': 'Moderate Active', 'very_active': 'Very Active',

    // Workout location
    'home': 'Home', 'gym': 'Gym', 'both': 'Both',

    // Meal types
    'breakfast': 'Breakfast', 'lunch': 'Lunch', 'dinner': 'Dinner', 'snack': 'Snack',

    // Messages
    'workout_completed': 'Workout completed! 💪',
    'meal_completed': 'Meal logged! 🥗',
    'weight_logged': 'Weight logged!',
    'friend_added': 'Friend request sent!',
    'program_generating': 'Your AI coach is preparing your program...',
    'rest_day': 'Rest Day', 'no_program': 'No program yet',
    'sets': 'sets', 'reps': 'reps', 'rest': 'rest',

    // AI Coach
    'coach_hello': "Hello! I'm your AI fitness coach. I'm ready to answer your questions about workouts, nutrition, and general health. What would you like to know?",
    'type_message': 'Ask your coach anything...',

    // Placeholders
    'enter_weight': 'Enter weight (kg)',
    'friend_email': "Friend's email",
  }
};

// Global helpers
function t(key) { return I18N.t(key); }
function setLanguage(lang) { I18N.set(lang); }
function toggleLanguage() { setLanguage(I18N.lang === 'tr' ? 'en' : 'tr'); }

window.I18N = I18N;
window.t = t;
