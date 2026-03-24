/* ══════════════════════════════════════════
   FITMEET — API CLIENT
   All communication with backend
══════════════════════════════════════════ */

const API = {
  BASE: '/api',

  getToken() { return localStorage.getItem('fm_token'); },
  setToken(t) { localStorage.setItem('fm_token', t); },
  clearToken() { localStorage.removeItem('fm_token'); localStorage.removeItem('fm_user'); },

  getUser() { try { return JSON.parse(localStorage.getItem('fm_user') || 'null'); } catch { return null; } },
  setUser(u) { localStorage.setItem('fm_user', JSON.stringify(u)); },

  async request(method, path, body = null, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const fetchOpts = { method, headers };
    if (body) fetchOpts.body = JSON.stringify(body);
    const res = await fetch(this.BASE + path, fetchOpts);
    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  delete(path) { return this.request('DELETE', path); },

  // Auth
  auth: {
    login: (email, password) => API.post('/auth/login', { email, password }),
    register: (data) => API.post('/auth/register', data),
    me: () => API.get('/auth/me'),
    setLanguage: (lang) => API.put('/auth/language', { language: lang }),
  },

  // Profile
  profile: {
    get: () => API.get('/profile'),
    update: (data) => API.put('/profile', data),
    onboarding: (data) => API.post('/profile/onboarding', data),
    logWeight: (weight_kg, notes) => API.post('/profile/weight', { weight_kg, notes }),
    getWeightHistory: () => API.get('/profile/weight'),
    getStats: () => API.get('/profile/stats'),
  },

  // AI
  ai: {
    generateProgram: (data) => API.post('/ai/generate-program', data),
    getProgram: () => API.get('/ai/program'),
    chat: (message, language) => API.post('/ai/chat', { message, language }),
  },

  // Logs
  logs: {
    logWorkout: (data) => API.post('/logs/workout', data),
    logMeal: (data) => API.post('/logs/meal', data),
    getToday: () => API.get('/logs/today'),
    getWeek: () => API.get('/logs/week'),
    getAchievements: () => API.get('/logs/achievements'),
  },

  // Friends
  friends: {
    list: () => API.get('/friends'),
    add: (email) => API.post('/friends/add', { email }),
    respond: (requester_id, action) => API.put('/friends/respond', { requester_id, action }),
    leaderboard: () => API.get('/friends/leaderboard'),
    notifications: () => API.get('/friends/notifications'),
  },
};

window.API = API;
