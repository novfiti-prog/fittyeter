/* ══════════════════════════════════════════
   FITMEET — AUTH MODULE
══════════════════════════════════════════ */

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('register-error').classList.add('hidden');
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const btn = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span>';
  errEl.classList.add('hidden');

  try {
    const data = await API.auth.login(email, password);
    API.setToken(data.token);
    API.setUser(data.user);
    I18N.init(data.user.language);
    afterAuth(data.user);
  } catch (err) {
    const msg = I18N.lang === 'tr' ? (err.message_tr || 'Giriş başarısız') : (err.message_en || 'Login failed');
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span data-tr="Giriş Yap" data-en="Sign In">${t('loading') === I18N.lang === 'tr' ? 'Giriş Yap' : 'Sign In'}</span><i class="fas fa-arrow-right"></i>`;
    btn.querySelector('span').textContent = I18N.lang === 'tr' ? 'Giriş Yap' : 'Sign In';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const full_name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const language = document.getElementById('reg-language').value;
  const btn = document.getElementById('register-btn');
  const errEl = document.getElementById('register-error');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span>';
  errEl.classList.add('hidden');

  try {
    const data = await API.auth.register({ full_name, email, password, language });
    API.setToken(data.token);
    API.setUser(data.user);
    I18N.init(language);
    afterAuth(data.user);
  } catch (err) {
    const msg = I18N.lang === 'tr' ? (err.message_tr || 'Kayıt başarısız') : (err.message_en || 'Registration failed');
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = I18N.lang === 'tr' ? 'Hesap Oluştur' : 'Create Account';
  }
}

function afterAuth(user) {
  document.getElementById('auth-overlay').classList.add('hidden');
  if (!user.onboarding_completed) {
    startOnboarding();
  } else {
    startApp(user);
  }
}

function logout() {
  API.clearToken();
  location.reload();
}

window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.switchAuthTab = switchAuthTab;
window.togglePassword = togglePassword;
window.logout = logout;
