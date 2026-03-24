/* ══════════════════════════════════════════
   FITMEET — NUTRITION PAGE
══════════════════════════════════════════ */

async function renderNutrition(container) {
  const lang = I18N.lang;

  if (!appProgram?.meal_plan) {
    container.innerHTML = `<div class="page-header"><h1 class="page-title">${lang === 'tr' ? 'Beslenme' : 'Nutrition'}</h1></div>
    <div class="empty-state"><div class="empty-state-icon">🥗</div><h3>${lang === 'tr' ? 'Beslenme planı yok' : 'No meal plan'}</h3><p>${lang === 'tr' ? 'Önce bir program oluştur' : 'Create a program first'}</p></div>`;
    return;
  }

  const mp = appProgram.meal_plan;
  const meals = mp.meals || {};
  const macros = mp.macro_split || {};
  const totalMacroG = (macros.protein_g || 0) + (macros.carbs_g || 0) + (macros.fat_g || 0);

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">${lang === 'tr' ? 'Beslenme' : 'Nutrition'}</h1><p class="page-subtitle">${lang === 'tr' ? 'Günlük beslenme planın' : 'Your daily meal plan'}</p></div>
    <div class="nutrition-layout">
      <div>
        <div class="meal-plan-day">
          ${mealTypes.map(type => {
            const meal = meals[type];
            if (!meal) return '';
            const items = Array.isArray(meal.items) ? meal.items : [];
            return `
            <div class="meal-card" style="padding:16px">
              <div class="meal-card-header">
                <span class="meal-type-badge ${type}">${t(type)}</span>
                <span class="meal-calories">${meal.calories || ''} kcal${meal.time ? ' · ' + meal.time : ''}</span>
              </div>
              <ul class="meal-items" style="margin-top:10px">
                ${items.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Right Panel -->
      <div>
        <!-- Calories -->
        <div class="card">
          <div class="calorie-ring-section">
            ${makeProgressCircle(100, 100, '')}
            <div class="calorie-label">
              <div class="calorie-num">${mp.daily_calories || '—'}</div>
              <div class="calorie-sub">${lang === 'tr' ? 'günlük kalori' : 'daily calories'}</div>
            </div>
          </div>
        </div>

        <!-- Macros -->
        <div class="card" style="margin-top:14px">
          <div class="card-title" style="margin-bottom:14px">${lang === 'tr' ? 'Makro Hedefler' : 'Macro Targets'}</div>
          <div class="macro-bar-container">
            ${[
              { key: 'protein', label: lang === 'tr' ? 'Protein' : 'Protein', val: macros.protein_g, unit: 'g', cls: 'protein' },
              { key: 'carbs', label: lang === 'tr' ? 'Karbonhidrat' : 'Carbs', val: macros.carbs_g, unit: 'g', cls: 'carbs' },
              { key: 'fat', label: lang === 'tr' ? 'Yağ' : 'Fat', val: macros.fat_g, unit: 'g', cls: 'fat' },
            ].map(m => `
            <div class="macro-item">
              <div class="macro-header">
                <span class="macro-name">${m.label}</span>
                <span class="macro-val">${m.val || 0}${m.unit}</span>
              </div>
              <div class="macro-bar">
                <div class="macro-fill ${m.cls}" style="width:${totalMacroG > 0 ? ((m.val || 0) / totalMacroG * 100).toFixed(0) : 0}%"></div>
              </div>
            </div>`).join('')}
          </div>
        </div>

        <!-- Tips -->
        <div class="card" style="margin-top:14px">
          <div class="card-title" style="margin-bottom:12px">${lang === 'tr' ? 'Beslenme İpuçları' : 'Nutrition Tips'}</div>
          ${(lang === 'tr' ? [
            '💧 Günde 2-3 litre su iç',
            '🕐 Öğünleri düzenli saatlerde ye',
            '🥦 Tabağının yarısını sebze yap',
            '🚫 Geç gece yemekten kaçın',
            '🍎 İşlenmiş gıdalardan uzak dur',
          ] : [
            '💧 Drink 2-3 liters of water daily',
            '🕐 Eat meals at regular times',
            '🥦 Fill half your plate with veggies',
            '🚫 Avoid late-night eating',
            '🍎 Stay away from processed foods',
          ]).map(tip => `<div style="font-size:13px;color:var(--text-2);padding:6px 0;border-bottom:1px solid var(--border)">${tip}</div>`).join('')}
        </div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   FITMEET — PROGRESS PAGE
══════════════════════════════════════════ */

async function renderProgress(container) {
  const lang = I18N.lang;
  const [statsRes, weightRes, profileRes] = await Promise.all([
    API.profile.getStats().catch(() => ({})),
    API.profile.getWeightHistory().catch(() => ({ logs: [] })),
    API.profile.get().catch(() => ({})),
  ]);

  const stats = statsRes || {};
  const logs = (weightRes.logs || []).reverse();
  const profile = profileRes.profile || {};
  const currentWeight = profile.weight_kg;
  const targetWeight = profile.target_weight_kg;
  const startWeight = logs[0]?.weight_kg;
  const weightChange = currentWeight && startWeight ? (currentWeight - startWeight).toFixed(1) : null;

  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">${lang === 'tr' ? 'İlerleme' : 'Progress'}</h1><p class="page-subtitle">${lang === 'tr' ? 'Gelişimini takip et' : 'Track your development'}</p></div>

    <!-- Weight Log Form -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-title" style="margin-bottom:12px">${lang === 'tr' ? 'Kilo Güncelle' : 'Log Weight'}</div>
      <div class="weight-log-form">
        <input type="number" id="new-weight-input" placeholder="${lang === 'tr' ? 'Kilonu gir (kg)' : 'Enter weight (kg)'}" step="0.1" min="30" max="300" style="flex:1;padding:10px 12px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-1);font-size:15px">
        <button class="btn-primary" onclick="logWeight()"><i class="fas fa-plus"></i> ${lang === 'tr' ? 'Kaydet' : 'Save'}</button>
      </div>
    </div>

    <div class="progress-layout">
      <!-- Weight Chart -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">${lang === 'tr' ? 'Kilo Takibi' : 'Weight History'}</div>
          <div style="display:flex;gap:10px;font-size:12px;color:var(--text-2)">
            ${weightChange !== null ? `<span style="color:${parseFloat(weightChange) < 0 ? '#00e676' : 'var(--accent-3)'}">${parseFloat(weightChange) > 0 ? '+' : ''}${weightChange} kg</span>` : ''}
            ${targetWeight ? `<span>${lang === 'tr' ? 'Hedef:' : 'Goal:'} ${targetWeight} kg</span>` : ''}
          </div>
        </div>
        ${logs.length > 0 ? `<div class="chart-wrapper"><canvas id="weight-chart"></canvas></div>` : `<div class="empty-state" style="padding:30px"><div class="empty-state-icon" style="font-size:32px">📊</div><p>${lang === 'tr' ? 'Henüz kilo verisi yok' : 'No weight data yet'}</p></div>`}
      </div>

      <!-- Stats -->
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="stat-card"><div class="stat-icon">🏋️</div><div class="stat-value">${stats.total_workouts || 0}</div><div class="stat-label">${t('total_workouts')}</div></div>
        <div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-value">${stats.current_streak || 0}</div><div class="stat-label">${t('current_streak')}</div></div>
        <div class="stat-card"><div class="stat-icon">⚖️</div><div class="stat-value">${currentWeight || '—'}</div><div class="stat-label">${lang === 'tr' ? 'Mevcut Kilo' : 'Current Weight'}</div></div>
        ${profile.height_cm && currentWeight ? `
        <div class="stat-card">
          <div class="stat-icon">📏</div>
          <div class="stat-value" style="font-size:28px">${bmi(currentWeight, profile.height_cm)}</div>
          <div class="stat-label">BMI</div>
          <div class="stat-change" style="color:${bmiCategory(bmi(currentWeight, profile.height_cm), lang).color}">${bmiCategory(bmi(currentWeight, profile.height_cm), lang).label}</div>
        </div>` : ''}
      </div>
    </div>

    <!-- Weight History Table -->
    ${logs.length > 0 ? `
    <div class="card" style="margin-top:20px">
      <div class="card-title" style="margin-bottom:14px">${lang === 'tr' ? 'Kilo Geçmişi' : 'Weight Log'}</div>
      <div style="display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto">
        ${logs.slice().reverse().slice(0, 20).map((log, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--bg-2);border-radius:var(--radius);font-size:13px">
          <span style="color:var(--text-2)">${new Date(log.logged_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span style="font-family:var(--font-mono);color:var(--accent)">${log.weight_kg} kg</span>
          ${i > 0 ? `<span style="color:${logs[logs.length - 1 - i + 1]?.weight_kg < log.weight_kg ? 'var(--accent-3)' : '#00e676'};font-size:11px">
            ${(log.weight_kg - (logs[logs.length - i - 1 + 1]?.weight_kg || log.weight_kg)).toFixed(1)} kg
          </span>` : '<span style="font-size:11px;color:var(--text-3)">start</span>'}
        </div>`).join('')}
      </div>
    </div>` : ''}
  `;

  // Render chart
  if (logs.length > 0) {
    setTimeout(() => {
      const ctx = document.getElementById('weight-chart');
      if (!ctx) return;
      const chartData = {
        labels: logs.map(l => new Date(l.logged_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric' })),
        datasets: [
          {
            label: lang === 'tr' ? 'Kilo (kg)' : 'Weight (kg)',
            data: logs.map(l => l.weight_kg),
            borderColor: '#c8ff00', backgroundColor: 'rgba(200,255,0,0.08)',
            borderWidth: 2.5, pointBackgroundColor: '#c8ff00', pointRadius: 4, fill: true, tension: 0.4,
          },
          ...(targetWeight ? [{
            label: lang === 'tr' ? 'Hedef' : 'Target',
            data: logs.map(() => targetWeight),
            borderColor: 'rgba(0,212,255,0.5)', borderDash: [6, 4],
            borderWidth: 1.5, pointRadius: 0, fill: false,
          }] : [])
        ]
      };
      new Chart(ctx, {
        type: 'line', data: chartData,
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#9090a8', font: { size: 11 } } } },
          scales: {
            x: { grid: { color: '#2a2a35' }, ticks: { color: '#9090a8', font: { size: 10 } } },
            y: { grid: { color: '#2a2a35' }, ticks: { color: '#9090a8', font: { size: 10 } } }
          }
        }
      });
    }, 100);
  }
}

async function logWeight() {
  const input = document.getElementById('new-weight-input');
  const val = parseFloat(input.value);
  if (!val || val < 20 || val > 500) {
    showToast(I18N.lang === 'tr' ? 'Geçerli bir kilo girin' : 'Enter a valid weight', 'error');
    return;
  }
  try {
    await API.profile.logWeight(val);
    showToast(t('weight_logged'), 'success');
    input.value = '';
    navigate('progress');
  } catch (e) {
    showToast(I18N.lang === 'tr' ? 'Hata oluştu' : 'Error occurred', 'error');
  }
}

/* ══════════════════════════════════════════
   FITMEET — ACHIEVEMENTS PAGE
══════════════════════════════════════════ */

async function renderAchievements(container) {
  const lang = I18N.lang;
  const { achievements } = await API.logs.getAchievements();
  const earned = achievements.filter(a => a.earned_at);
  const totalPts = earned.reduce((s, a) => s + (a.points || 0), 0);

  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">${lang === 'tr' ? 'Başarılar' : 'Achievements'}</h1></div>
    <div class="achievements-header">
      <div class="total-pts"><span>⭐</span>${totalPts} ${lang === 'tr' ? 'puan' : 'points'}</div>
      <div style="color:var(--text-2);font-size:14px">${earned.length}/${achievements.length} ${lang === 'tr' ? 'rozet' : 'badges'}</div>
    </div>
    <div class="achievements-grid">
      ${achievements.map(a => `
      <div class="achievement-badge ${a.earned_at ? 'earned' : 'locked'}">
        <div class="badge-icon">${a.icon}</div>
        <div class="badge-name">${lang === 'tr' ? a.name_tr : a.name_en}</div>
        <div class="badge-desc">${lang === 'tr' ? (a.description_tr || '') : (a.description_en || '')}</div>
        <div class="badge-pts">+${a.points} pts</div>
        ${a.earned_at ? `<div class="badge-earned-date">${new Date(a.earned_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}</div>` : `<div class="badge-earned-date" style="color:var(--text-3)">${lang === 'tr' ? 'Kilitli' : 'Locked'}</div>`}
      </div>`).join('')}
    </div>`;
}

/* ══════════════════════════════════════════
   FITMEET — FRIENDS PAGE
══════════════════════════════════════════ */

async function renderFriends(container) {
  const lang = I18N.lang;
  const [friendsRes, lbRes] = await Promise.all([
    API.friends.list().catch(() => ({ friends: [] })),
    API.friends.leaderboard().catch(() => ({ leaderboard: [] })),
  ]);

  const friends = friendsRes.friends || [];
  const accepted = friends.filter(f => f.status === 'accepted');
  const pending = friends.filter(f => f.status === 'pending');
  const leaderboard = lbRes.leaderboard || [];

  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">${lang === 'tr' ? 'Arkadaşlar' : 'Friends'}</h1></div>
    <div class="friends-layout">
      <!-- Friends List -->
      <div>
        <div class="card">
          <div class="card-title" style="margin-bottom:14px">${lang === 'tr' ? 'Arkadaş Ekle' : 'Add Friend'}</div>
          <div class="add-friend-form">
            <input type="email" id="friend-email-input" placeholder="${lang === 'tr' ? 'E-posta adresi' : 'Email address'}" style="padding:10px 12px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-1);font-size:14px">
            <button class="btn-primary" onclick="addFriend()"><i class="fas fa-user-plus"></i></button>
          </div>
        </div>

        ${pending.length > 0 ? `
        <div class="card" style="margin-top:14px">
          <div class="card-title" style="margin-bottom:12px">${lang === 'tr' ? 'Bekleyen İstekler' : 'Pending Requests'} (${pending.length})</div>
          <div class="friends-list">
            ${pending.filter(f => f.direction === 'received').map(f => `
            <div class="friend-card">
              <div class="friend-avatar">${f.full_name[0].toUpperCase()}</div>
              <div><div class="friend-name">${f.full_name}</div><div class="friend-sub">${lang === 'tr' ? 'Sana istek gönderdi' : 'Sent you a request'}</div></div>
              <div class="friend-actions">
                <button class="btn-primary" style="padding:6px 12px;font-size:12px" onclick="respondFriend(${f.id},'accepted')">${lang === 'tr' ? 'Kabul' : 'Accept'}</button>
                <button class="btn-danger" style="padding:6px 12px;font-size:12px" onclick="respondFriend(${f.id},'blocked')">${lang === 'tr' ? 'Reddet' : 'Reject'}</button>
              </div>
            </div>`).join('')}
            ${pending.filter(f => f.direction === 'sent').map(f => `
            <div class="friend-card">
              <div class="friend-avatar">${f.full_name[0].toUpperCase()}</div>
              <div><div class="friend-name">${f.full_name}</div><div class="friend-sub" style="color:var(--accent-4)">${lang === 'tr' ? 'İstek gönderildi...' : 'Request sent...'}</div></div>
            </div>`).join('')}
          </div>
        </div>` : ''}

        <div class="card" style="margin-top:14px">
          <div class="card-title" style="margin-bottom:12px">${lang === 'tr' ? 'Arkadaşlarım' : 'My Friends'} (${accepted.length})</div>
          ${accepted.length === 0
            ? `<div class="empty-state" style="padding:24px"><div class="empty-state-icon" style="font-size:32px">👥</div><p>${lang === 'tr' ? 'Henüz arkadaşın yok' : 'No friends yet'}</p></div>`
            : `<div class="friends-list">${accepted.map(f => `
            <div class="friend-card">
              <div class="friend-avatar">${f.full_name[0].toUpperCase()}</div>
              <div><div class="friend-name">${f.full_name}</div></div>
            </div>`).join('')}</div>`}
        </div>
      </div>

      <!-- Leaderboard -->
      <div class="card">
        <div class="card-title" style="margin-bottom:14px">🏆 ${lang === 'tr' ? 'Bu Ay Sıralaması' : 'Monthly Leaderboard'}</div>
        <div class="leaderboard-list">
          ${leaderboard.map((user, i) => `
          <div class="leaderboard-item">
            <div class="leaderboard-rank ${i < 3 ? `rank-${i+1}` : 'rank-other'}">${i + 1}</div>
            <div class="friend-avatar" style="width:32px;height:32px;font-size:13px">${user.full_name[0].toUpperCase()}</div>
            <div>
              <div style="font-weight:600;font-size:13px">${user.full_name}</div>
            </div>
            <div class="lb-workouts">${user.total_workouts} 💪</div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
}

async function addFriend() {
  const email = document.getElementById('friend-email-input').value.trim();
  if (!email) return;
  try {
    await API.friends.add(email);
    showToast(t('friend_added'), 'success');
    document.getElementById('friend-email-input').value = '';
    navigate('friends');
  } catch (e) {
    showToast(e.message_tr || e.message_en || (I18N.lang === 'tr' ? 'Kullanıcı bulunamadı' : 'User not found'), 'error');
  }
}

async function respondFriend(requesterId, action) {
  try {
    await API.friends.respond(requesterId, action);
    navigate('friends');
  } catch (e) {
    showToast(I18N.lang === 'tr' ? 'Hata oluştu' : 'Error', 'error');
  }
}

/* ══════════════════════════════════════════
   FITMEET — SETTINGS PAGE
══════════════════════════════════════════ */

async function renderSettings(container) {
  const lang = I18N.lang;
  const profileRes = await API.profile.get().catch(() => ({}));
  const profile = profileRes.profile || {};
  const user = appUser || {};

  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">${lang === 'tr' ? 'Ayarlar' : 'Settings'}</h1></div>
    <div class="settings-layout">
      <div class="settings-nav">
        ${[
          { key: 'profile', icon: 'fa-user', tr: 'Profil', en: 'Profile' },
          { key: 'fitness', icon: 'fa-dumbbell', tr: 'Fitness', en: 'Fitness' },
          { key: 'account', icon: 'fa-shield-alt', tr: 'Hesap', en: 'Account' },
        ].map((item, i) => `
        <div class="settings-nav-item ${i === 0 ? 'active' : ''}" onclick="switchSettings('${item.key}', this)">
          <i class="fas ${item.icon}"></i> ${lang === 'tr' ? item.tr : item.en}
        </div>`).join('')}
      </div>

      <div>
        <!-- Profile Section -->
        <div class="settings-section active" id="settings-profile">
          <h3>${lang === 'tr' ? 'Profil Bilgileri' : 'Profile Info'}</h3>
          <div class="form-group"><label>${lang === 'tr' ? 'Ad Soyad' : 'Full Name'}</label><input type="text" id="s-name" value="${user.full_name || ''}"></div>
          <div class="form-group"><label>${lang === 'tr' ? 'E-posta' : 'Email'}</label><input type="email" value="${user.email || ''}" disabled style="opacity:0.5"></div>
          <div class="form-group">
            <label>${lang === 'tr' ? 'Dil' : 'Language'}</label>
            <select id="s-lang">
              <option value="tr" ${lang === 'tr' ? 'selected' : ''}>🇹🇷 Türkçe</option>
              <option value="en" ${lang === 'en' ? 'selected' : ''}>🇺🇸 English</option>
            </select>
          </div>
          <button class="btn-primary" onclick="saveProfileSettings()">${lang === 'tr' ? 'Kaydet' : 'Save'}</button>
        </div>

        <!-- Fitness Section -->
        <div class="settings-section" id="settings-fitness">
          <h3>${lang === 'tr' ? 'Fitness Bilgileri' : 'Fitness Info'}</h3>
          <div class="form-row">
            <div class="form-group"><label>${lang === 'tr' ? 'Boy (cm)' : 'Height (cm)'}</label><input type="number" id="s-height" value="${profile.height_cm || ''}"></div>
            <div class="form-group"><label>${lang === 'tr' ? 'Kilo (kg)' : 'Weight (kg)'}</label><input type="number" id="s-weight" value="${profile.weight_kg || ''}" step="0.1"></div>
          </div>
          <div class="form-group"><label>${lang === 'tr' ? 'Hedef Kilo (kg)' : 'Target Weight (kg)'}</label><input type="number" id="s-target" value="${profile.target_weight_kg || ''}" step="0.1"></div>
          <div class="form-group">
            <label>${lang === 'tr' ? 'Fitness Seviyesi' : 'Fitness Level'}</label>
            <select id="s-level">
              <option value="beginner" ${profile.fitness_level === 'beginner' ? 'selected' : ''}>${lang === 'tr' ? 'Başlangıç' : 'Beginner'}</option>
              <option value="intermediate" ${profile.fitness_level === 'intermediate' ? 'selected' : ''}>${lang === 'tr' ? 'Orta' : 'Intermediate'}</option>
              <option value="advanced" ${profile.fitness_level === 'advanced' ? 'selected' : ''}>${lang === 'tr' ? 'İleri' : 'Advanced'}</option>
            </select>
          </div>
          <button class="btn-primary" onclick="saveFitnessSettings()">${lang === 'tr' ? 'Kaydet' : 'Save'}</button>
        </div>

        <!-- Account Section -->
        <div class="settings-section" id="settings-account">
          <h3>${lang === 'tr' ? 'Hesap' : 'Account'}</h3>
          <div class="card" style="margin-bottom:14px">
            <p style="font-size:14px;color:var(--text-2);margin-bottom:14px">${lang === 'tr' ? 'Hesabından çıkış yapmak istediğine emin misin?' : 'Are you sure you want to sign out?'}</p>
            <button class="btn-danger" onclick="logout()"><i class="fas fa-sign-out-alt"></i> ${lang === 'tr' ? 'Çıkış Yap' : 'Sign Out'}</button>
          </div>
        </div>
      </div>
    </div>`;
}

function switchSettings(key, el) {
  document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(`settings-${key}`)?.classList.add('active');
}

async function saveProfileSettings() {
  const lang = document.getElementById('s-lang').value;
  try {
    await API.auth.setLanguage(lang);
    I18N.set(lang);
    showToast(I18N.lang === 'tr' ? 'Kaydedildi!' : 'Saved!', 'success');
    const user = API.getUser();
    if (user) { user.language = lang; API.setUser(user); appUser = user; }
  } catch (e) {
    showToast(I18N.lang === 'tr' ? 'Hata oluştu' : 'Error', 'error');
  }
}

async function saveFitnessSettings() {
  const data = {
    height_cm: parseFloat(document.getElementById('s-height').value),
    weight_kg: parseFloat(document.getElementById('s-weight').value),
    target_weight_kg: parseFloat(document.getElementById('s-target').value),
    fitness_level: document.getElementById('s-level').value,
  };
  try {
    await API.profile.update(data);
    showToast(I18N.lang === 'tr' ? 'Kaydedildi!' : 'Saved!', 'success');
  } catch (e) {
    showToast(I18N.lang === 'tr' ? 'Hata oluştu' : 'Error', 'error');
  }
}

window.renderNutrition = renderNutrition;
window.renderProgress = renderProgress;
window.logWeight = logWeight;
window.renderAchievements = renderAchievements;
window.renderFriends = renderFriends;
window.addFriend = addFriend;
window.respondFriend = respondFriend;
window.renderSettings = renderSettings;
window.switchSettings = switchSettings;
window.saveProfileSettings = saveProfileSettings;
window.saveFitnessSettings = saveFitnessSettings;
