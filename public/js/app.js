/* ══════════════════════════════════════════
   FITMEET — MAIN APP
   Router, navigation, global utilities
══════════════════════════════════════════ */

let currentPage = 'dashboard';
let appUser = null;
let appProgram = null;

async function startApp(user) {
  appUser = user;
  I18N.init(user.language);

  // Show app
  document.getElementById('app').classList.remove('hidden');

  // Set sidebar user info
  document.getElementById('sidebar-name').textContent = user.full_name;
  document.getElementById('sidebar-email').textContent = user.email;
  const initials = user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('sidebar-avatar').textContent = initials;

  // Load program into cache
  try {
    const { program } = await API.ai.getProgram();
    appProgram = program;
  } catch (e) {}

  // Navigate to dashboard
  navigate('dashboard');

  // Check notifications
  checkNotifications();
}

async function navigate(page) {
  currentPage = page;

  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Close mobile sidebar
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.add('hidden');
  }

  // Render page
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="page-loading"><div class="spinner"></div><p>${t('loading')}</p></div>`;

  try {
    switch (page) {
      case 'dashboard':    await renderDashboard(main); break;
      case 'today':        await renderToday(main); break;
      case 'program':      await renderProgram(main); break;
      case 'nutrition':    await renderNutrition(main); break;
      case 'progress':     await renderProgress(main); break;
      case 'achievements': await renderAchievements(main); break;
      case 'friends':      await renderFriends(main); break;
      case 'coach':        await renderCoach(main); break;
      case 'settings':     await renderSettings(main); break;
      default: main.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🚧</div><h3>Coming Soon</h3></div>`;
    }
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Bir hata oluştu</h3><p>${err.message || 'Lütfen sayfayı yenileyin'}</p></div>`;
  }

  I18N.apply();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const open = sidebar.classList.toggle('open');
  overlay.classList.toggle('hidden', !open);
}

async function checkNotifications() {
  try {
    const { notifications } = await API.friends.notifications();
    const unread = notifications.filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = unread > 0 ? 'inline-block' : 'none';
  } catch (e) {}
}

// ── Toast System ──
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ── Helpers ──
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return t('good_morning');
  if (h < 18) return t('good_afternoon');
  return t('good_evening');
}

function formatDate(dateStr, lang) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getDayKey(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date || Date.now()).getDay()];
}

function getTodayKey() { return getDayKey(); }

function bmi(weight, height) { return (weight / Math.pow(height / 100, 2)).toFixed(1); }

function bmiCategory(bmiVal, lang) {
  const b = parseFloat(bmiVal);
  if (lang === 'tr') {
    if (b < 18.5) return { label: 'Zayıf', color: '#00d4ff' };
    if (b < 25) return { label: 'Normal', color: '#c8ff00' };
    if (b < 30) return { label: 'Fazla Kilolu', color: '#ffd166' };
    return { label: 'Obez', color: '#ff6b6b' };
  } else {
    if (b < 18.5) return { label: 'Underweight', color: '#00d4ff' };
    if (b < 25) return { label: 'Normal', color: '#c8ff00' };
    if (b < 30) return { label: 'Overweight', color: '#ffd166' };
    return { label: 'Obese', color: '#ff6b6b' };
  }
}

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  const loadingScreen = document.getElementById('loading-screen');
  const token = API.getToken();

  // Small delay for loading screen animation
  await new Promise(r => setTimeout(r, 800));

  if (!token) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      document.getElementById('auth-overlay').classList.remove('hidden');
      I18N.init(localStorage.getItem('fm_lang') || 'tr');
    }, 400);
    return;
  }

  try {
    const { user, profile } = await API.auth.me();
    const fullUser = { ...user, onboarding_completed: profile?.onboarding_completed || 0 };
    API.setUser(fullUser);
    I18N.init(user.language);

    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      if (!fullUser.onboarding_completed) {
        startOnboarding();
      } else {
        startApp(fullUser);
      }
    }, 400);
  } catch (err) {
    API.clearToken();
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      document.getElementById('auth-overlay').classList.remove('hidden');
      I18N.init('tr');
    }, 400);
  }
});

window.navigate = navigate;
window.toggleSidebar = toggleSidebar;
window.showToast = showToast;
window.getGreeting = getGreeting;
window.formatDate = formatDate;
window.getTodayKey = getTodayKey;
window.getDayKey = getDayKey;
window.bmi = bmi;
window.bmiCategory = bmiCategory;
window.startApp = startApp;
