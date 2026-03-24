/* ══════════════════════════════════════════
   FITMEET — DASHBOARD PAGE
══════════════════════════════════════════ */

async function renderDashboard(container) {
  const lang = I18N.lang;

  // Load data in parallel
  const [statsRes, todayRes, profileRes] = await Promise.all([
    API.profile.getStats().catch(() => ({})),
    API.logs.getToday().catch(() => ({})),
    API.profile.get().catch(() => ({})),
  ]);

  const stats = statsRes || {};
  const today = todayRes || {};
  const profile = profileRes.profile || {};

  // Today's workout from program
  const todayKey = getTodayKey();
  const todayWorkout = appProgram?.workout_plan?.week_structure?.[todayKey];
  const exercises = todayWorkout?.exercises || [];
  const isRestDay = todayWorkout?.rest || exercises.length === 0;

  const completedExercises = today.workout?.exercises_completed || [];
  const workoutDone = today.workout?.workout_completed;
  const completedMeals = (today.meals || []).filter(m => m.meal_completed).length;
  const totalMeals = 4;

  const workoutProgress = isRestDay ? 100 : (exercises.length > 0 ? Math.round((completedExercises.length / exercises.length) * 100) : 0);

  const userBmi = profile.weight_kg && profile.height_cm ? bmi(profile.weight_kg, profile.height_cm) : null;
  const bmiInfo = userBmi ? bmiCategory(userBmi, lang) : null;

  container.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <p class="page-subtitle">${getGreeting()},</p>
          <h1 class="page-title">${appUser?.full_name?.split(' ')[0] || ''} <span>👋</span></h1>
        </div>
        ${stats.current_streak > 0 ? `
        <div class="streak-display">
          <span class="streak-flame">🔥</span>
          <span class="streak-num">${stats.current_streak}</span>
          <span class="streak-label">${t('days')} ${lang === 'tr' ? 'seri' : 'streak'}</span>
        </div>` : ''}
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="dashboard-stats">
      <div class="stat-card">
        <div class="stat-icon">🏋️</div>
        <div class="stat-value">${stats.total_workouts || 0}</div>
        <div class="stat-label">${t('total_workouts')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${stats.this_week_workouts || 0}</div>
        <div class="stat-label">${t('this_week')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-value">${stats.achievement_count || 0}</div>
        <div class="stat-label">${t('achievements')}</div>
      </div>
      <div class="stat-card" style="cursor:pointer" onclick="navigate('progress')">
        <div class="stat-icon">⚖️</div>
        <div class="stat-value" style="color:${bmiInfo?.color || 'var(--accent)'}">${profile.weight_kg || '—'}</div>
        <div class="stat-label">${lang === 'tr' ? 'Mevcut Kilo (kg)' : 'Current Weight (kg)'}</div>
        ${bmiInfo ? `<div class="stat-change" style="color:${bmiInfo.color}">BMI ${userBmi} · ${bmiInfo.label}</div>` : ''}
      </div>
    </div>

    <!-- Main Grid -->
    <div class="dashboard-grid">
      <!-- Today Summary -->
      <div>
        <div class="today-summary">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <h2 style="font-family:var(--font-display);font-size:20px;letter-spacing:1px">${lang === 'tr' ? 'Bugün' : 'Today'}</h2>
            <button class="btn-ghost" onclick="navigate('today')">
              ${lang === 'tr' ? 'Detay' : 'Details'} <i class="fas fa-arrow-right"></i>
            </button>
          </div>

          ${isRestDay ? `
          <div style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--bg-2);border-radius:var(--radius);border:1px solid var(--border)">
            <span style="font-size:32px">😴</span>
            <div>
              <div style="font-weight:700;font-size:16px">${t('rest_day')}</div>
              <div style="font-size:13px;color:var(--text-2)">${lang === 'tr' ? 'Bugün dinlenme günün. Vücudun toparlanıyor!' : "Today is your rest day. Your body is recovering!"}</div>
            </div>
          </div>` : `
          <div class="today-progress-ring">
            ${makeProgressCircle(workoutProgress, 80, lang === 'tr' ? 'Antrenman' : 'Workout')}
            ${makeProgressCircle(Math.round((completedMeals / totalMeals) * 100), 80, lang === 'tr' ? 'Beslenme' : 'Nutrition')}
            <div style="flex:1">
              <div style="font-size:13px;color:var(--text-2);margin-bottom:4px">${lang === 'tr' ? 'Egzersizler' : 'Exercises'}</div>
              <div style="font-family:var(--font-display);font-size:22px;color:var(--accent)">${completedExercises.length} / ${exercises.length}</div>
              <div style="font-size:12px;color:var(--text-3)">${lang === 'tr' ? 'tamamlandı' : 'completed'}</div>
            </div>
          </div>
          <div class="today-exercises-preview">
            ${exercises.slice(0, 4).map(ex => {
              const done = completedExercises.includes(ex.id);
              return `<div class="exercise-preview-item" style="${done ? 'opacity:0.5;text-decoration:line-through' : ''}">
                <div class="dot" style="${done ? 'background:var(--text-3)' : ''}"></div>
                <span>${ex.name}</span>
                <span style="margin-left:auto;font-size:11px;color:var(--text-3);font-family:var(--font-mono)">${ex.sets}×${ex.reps}</span>
              </div>`;
            }).join('')}
            ${exercises.length > 4 ? `<div style="font-size:12px;color:var(--text-3);padding-left:14px">+${exercises.length - 4} ${lang === 'tr' ? 'egzersiz daha' : 'more exercises'}</div>` : ''}
          </div>`}

          <button class="btn-primary btn-full" style="margin-top:14px" onclick="navigate('today')">
            ${workoutDone ? `<i class="fas fa-check"></i> ${lang === 'tr' ? 'Tamamlandı' : 'Completed'}` : `<i class="fas fa-play"></i> ${lang === 'tr' ? 'Antrenmana Başla' : 'Start Workout'}`}
          </button>
        </div>

        <!-- Quick Actions -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px">
          <button class="card" style="cursor:pointer;text-align:left" onclick="navigate('nutrition')">
            <div style="font-size:24px;margin-bottom:6px">🥗</div>
            <div style="font-weight:700;font-size:14px">${lang === 'tr' ? 'Beslenme Planı' : 'Meal Plan'}</div>
            <div style="font-size:12px;color:var(--text-2)">${completedMeals}/${totalMeals} ${lang === 'tr' ? 'öğün' : 'meals'}</div>
          </button>
          <button class="card" style="cursor:pointer;text-align:left" onclick="navigate('coach')">
            <div style="font-size:24px;margin-bottom:6px">🤖</div>
            <div style="font-weight:700;font-size:14px">${lang === 'tr' ? 'AI Koçum' : 'AI Coach'}</div>
            <div style="font-size:12px;color:var(--text-2)">${lang === 'tr' ? 'Soru sor' : 'Ask anything'}</div>
          </button>
        </div>
      </div>

      <!-- Right Panel -->
      <div style="display:flex;flex-direction:column;gap:16px">

        <!-- Program Info -->
        ${appProgram ? `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">${lang === 'tr' ? 'Programım' : 'My Program'}</div>
              <div class="card-subtitle">${appProgram.title}</div>
            </div>
            <button class="btn-ghost" onclick="navigate('program')"><i class="fas fa-arrow-right"></i></button>
          </div>
          <div style="font-size:13px;color:var(--text-2);line-height:1.6">${(appProgram.description || '').slice(0, 100)}...</div>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <span class="tag tag-green">${profile.workout_location ? t(profile.workout_location) : ''}</span>
            <span class="tag tag-blue">${profile.fitness_level ? t(profile.fitness_level) : ''}</span>
          </div>
        </div>` : `
        <div class="card">
          <div class="empty-state" style="padding:30px 20px">
            <div class="empty-state-icon">📋</div>
            <h3>${t('no_program')}</h3>
            <p>${lang === 'tr' ? 'Profili tamamla ve programını oluştur' : 'Complete profile to generate program'}</p>
          </div>
        </div>`}

        <!-- Weight Progress -->
        ${stats.weight_logs?.length > 1 ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${lang === 'tr' ? 'Kilo Takibi' : 'Weight Track'}</div>
            <button class="btn-ghost" onclick="navigate('progress')"><i class="fas fa-arrow-right"></i></button>
          </div>
          <canvas id="mini-weight-chart" height="100"></canvas>
        </div>` : `
        <div class="card" style="cursor:pointer" onclick="navigate('progress')">
          <div style="text-align:center;padding:16px">
            <div style="font-size:32px;margin-bottom:8px">⚖️</div>
            <div style="font-weight:700;margin-bottom:4px">${lang === 'tr' ? 'Kilo Takibine Başla' : 'Start Weight Tracking'}</div>
            <div style="font-size:13px;color:var(--text-2)">${lang === 'tr' ? 'İlerlemenizi görün' : 'See your progress'}</div>
          </div>
        </div>`}

      </div>
    </div>
  `;

  // Mini weight chart
  if (stats.weight_logs?.length > 1) {
    setTimeout(() => {
      const ctx = document.getElementById('mini-weight-chart');
      if (!ctx) return;
      const logs = stats.weight_logs.slice(-8);
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: logs.map(l => new Date(l.logged_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric' })),
          datasets: [{
            data: logs.map(l => l.weight_kg),
            borderColor: '#c8ff00', backgroundColor: 'rgba(200,255,0,0.08)',
            borderWidth: 2, pointBackgroundColor: '#c8ff00', pointRadius: 3, fill: true, tension: 0.4,
          }]
        },
        options: {
          responsive: true, plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: '#2a2a35' }, ticks: { color: '#9090a8', font: { size: 10 } } },
            y: { grid: { color: '#2a2a35' }, ticks: { color: '#9090a8', font: { size: 10 } } }
          }
        }
      });
    }, 100);
  }
}

function makeProgressCircle(percent, size = 80, label = '') {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return `
  <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
    <div class="progress-circle" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--bg-3)" stroke-width="6"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--accent)" stroke-width="6"
          stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
          style="transform:rotate(-90deg);transform-origin:center;transition:stroke-dashoffset 0.6s ease"/>
      </svg>
      <div class="progress-circle-text" style="font-size:${size > 70 ? 16 : 12}px">${percent}%</div>
    </div>
    <div style="font-size:11px;color:var(--text-2)">${label}</div>
  </div>`;
}

window.renderDashboard = renderDashboard;
window.makeProgressCircle = makeProgressCircle;
