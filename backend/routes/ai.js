const express = require('express');
const router = express.Router();
const { getDB } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT_TR = `Sen FitMeet platformunun yapay zeka fitness koçusun. Adın "Coach AI". 
Kullanıcının kişisel fitness verilerine göre özelleştirilmiş antrenman ve beslenme programları oluşturursun.
Her zaman pozitif, motive edici ve bilimsel temelli tavsiyeler verirsin.
Türkçe ve İngilizce konuşabilirsin - kullanıcının diline göre yanıt verirsin.
Program oluştururken her zaman JSON formatında yanıt verirsin.`;

// POST /api/ai/generate-program - Generate full fitness program
router.post('/generate-program', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.userId);
    const user = db.prepare('SELECT full_name, language FROM users WHERE id = ?').get(req.user.userId);

    if (!profile || !profile.onboarding_completed) {
      return res.status(400).json({ error: 'Complete onboarding first', message_tr: 'Önce profili tamamlayın', message_en: 'Please complete your profile first' });
    }

    const { start_date, duration_weeks = 4, language = user.language } = req.body;
    const lang = language || 'tr';

    let equipment = [];
    try { equipment = JSON.parse(profile.equipment || '[]'); } catch {}
    let dietary = [];
    try { dietary = JSON.parse(profile.dietary_restrictions || '[]'); } catch {}

    const bmi = profile.weight_kg / Math.pow(profile.height_cm / 100, 2);

    const userContext = `
Kullanıcı Bilgileri:
- İsim: ${user.full_name}
- Yaş: ${profile.age}
- Cinsiyet: ${profile.gender}
- Boy: ${profile.height_cm} cm
- Mevcut Kilo: ${profile.weight_kg} kg
- Hedef Kilo: ${profile.target_weight_kg} kg
- BMI: ${bmi.toFixed(1)}
- Fitness Hedefi: ${profile.fitness_goal}
- Fitness Seviyesi: ${profile.fitness_level}
- İş Tipi: ${profile.job_type}
- Haftalık Antrenman Saati: ${profile.weekly_workout_hours} saat
- Antrenman Yeri: ${profile.workout_location}
- Mevcut Ekipmanlar: ${equipment.join(', ') || 'Yok'}
- Sağlık Notları: ${profile.health_notes || 'Yok'}
- Beslenme Kısıtlamaları: ${dietary.join(', ') || 'Yok'}
- Program Süresi: ${duration_weeks} hafta
- Başlangıç Tarihi: ${start_date || new Date().toISOString().split('T')[0]}
- Dil: ${lang}`;

    const prompt = lang === 'tr' 
      ? `${userContext}\n\nBu kullanıcı için ${duration_weeks} haftalık detaylı bir fitness programı oluştur. Aşağıdaki JSON formatında yanıt ver:\n\n{"title": "Program Adı", "description": "Kısa açıklama", "ai_notes": "Koç notları ve öneriler", "workout_plan": {"week_structure": {"monday": {...}, "tuesday": {...}, "wednesday": {...}, "thursday": {...}, "friday": {...}, "saturday": {...}, "sunday": {...}}, "exercises_library": [{"id": "ex1", "name": "Egzersiz Adı", "sets": 3, "reps": "10-12", "rest_seconds": 60, "description": "Nasıl yapılır", "muscle_group": "kas grubu", "equipment": "ekipman"}]}, "meal_plan": {"daily_calories": 2000, "macro_split": {"protein_g": 150, "carbs_g": 200, "fat_g": 70}, "meals": {"breakfast": {"name": "Kahvaltı", "items": ["yiyecek1", "yiyecek2"], "calories": 400, "time": "07:00"}, "lunch": {...}, "dinner": {...}, "snack": {...}}}}`
      : `${userContext}\n\nCreate a ${duration_weeks}-week detailed fitness program for this user. Respond ONLY in this JSON format:\n\n{"title": "Program Name", "description": "Short description", "ai_notes": "Coach notes and recommendations", "workout_plan": {"week_structure": {"monday": {...}, "tuesday": {...}, "wednesday": {...}, "thursday": {...}, "friday": {...}, "saturday": {...}, "sunday": {...}}, "exercises_library": [{"id": "ex1", "name": "Exercise Name", "sets": 3, "reps": "10-12", "rest_seconds": 60, "description": "How to perform", "muscle_group": "muscle group", "equipment": "equipment"}]}, "meal_plan": {"daily_calories": 2000, "macro_split": {"protein_g": 150, "carbs_g": 200, "fat_g": 70}, "meals": {"breakfast": {"name": "Breakfast", "items": ["food1", "food2"], "calories": 400, "time": "07:00"}, "lunch": {...}, "dinner": {...}, "snack": {...}}}}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT_TR,
      messages: [{ role: 'user', content: prompt }]
    });

    let programData;
    const rawText = response.content[0].text;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      programData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Invalid AI response format');
    }

    // Deactivate old programs
    db.prepare('UPDATE programs SET is_active = 0 WHERE user_id = ?').run(req.user.userId);

    // Save new program
    const result = db.prepare(`
      INSERT INTO programs (user_id, title, description, start_date, duration_weeks, workout_plan, meal_plan, ai_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.userId,
      programData.title,
      programData.description,
      start_date || new Date().toISOString().split('T')[0],
      duration_weeks,
      JSON.stringify(programData.workout_plan),
      JSON.stringify(programData.meal_plan),
      programData.ai_notes
    );

    res.json({ success: true, program_id: result.lastInsertRowid, program: programData });
  } catch (err) {
    console.error('AI Program generation error:', err);
    res.status(500).json({ error: 'AI generation failed', details: err.message });
  }
});

// GET /api/ai/program - Get active program
router.get('/program', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const program = db.prepare('SELECT * FROM programs WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1').get(req.user.userId);
    if (!program) return res.json({ program: null });
    try { program.workout_plan = JSON.parse(program.workout_plan); } catch {}
    try { program.meal_plan = JSON.parse(program.meal_plan); } catch {}
    res.json({ program });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/ai/chat - Chat with AI coach
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { message, language = 'tr' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const user = db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user.userId);
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.userId);

    // Get last 10 messages for context
    const history = db.prepare('SELECT role, content FROM ai_chats WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(req.user.userId).reverse();

    // Save user message
    db.prepare('INSERT INTO ai_chats (user_id, role, content) VALUES (?, ?, ?)').run(req.user.userId, 'user', message);

    const systemMsg = `${SYSTEM_PROMPT_TR}
Kullanıcı: ${user.full_name}
Fitness Seviyesi: ${profile?.fitness_level || 'bilinmiyor'}
Hedef: ${profile?.fitness_goal || 'bilinmiyor'}
Kilo: ${profile?.weight_kg || '?'} kg, Hedef: ${profile?.target_weight_kg || '?'} kg
Dil tercihi: ${language}`;

    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemMsg,
      messages
    });

    const reply = response.content[0].text;
    db.prepare('INSERT INTO ai_chats (user_id, role, content) VALUES (?, ?, ?)').run(req.user.userId, 'assistant', reply);

    res.json({ reply });
  } catch (err) {
    console.error('AI Chat error:', err);
    res.status(500).json({ error: 'AI service error', details: err.message });
  }
});

module.exports = router;
