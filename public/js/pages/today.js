/* ══════════════════════════════════════════
   FITMEET — TODAY PAGE
══════════════════════════════════════════ */

let todayCompletedExercises = new Set();
let todayMealStatus = {};
let todayProgramId = null;

async function renderToday(container) {
  const lang = I18N.lang;
  const todayDate = new Date().toISOString().split('T')[0];
  const todayKey = getTodayKey();

  const [todayLog, profileRes] = await Promise.all([
    API.logs.getToday().catch(() => ({})),
    API.profile.get().catch(() => ({})),
  ]);

  const todayWorkout = appProgram?.workout_plan?.week_structure?.[todayKey];
  const exercises = todayWorkout?.exercises || [];
  const isRestDay = todayWorkout?.rest || exercises.length === 0;
  const mealPlan = appProgram?.meal_plan?.meals || {};

  todayProgramId = appProgram?.id;
  todayCompletedExercises = new Set(todayLog.workout?.exercises_completed || []);
  todayMealStatus = {};
  (todayLog.meals || []).forEach(m => { todayMealStatus[m.meal_type] = m.meal_completed; });

  const workoutDone = todayLog.workout?.workout_completed;
  const dayNum = getDayNumber();

  const dayLabel = new Date().toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${lang === 'tr' ? 'Bugün' : 'Today'}</h1>
      <p class="page-subtitle">${dayLabel}</p>
    </div>

    ${!appProgram ? `
    <div class="empty-state">
      <div class="empty-state-icon">📋</div>
      <h3>${lang === 'tr' ? 'Program Bulunamadı' : 'No Program Found'}</h3>
      <p>${lang === 'tr' ? 'Önce bir program oluşturman gerekiyor.' : 'You need to create a program first.'}</p>
      <button class="btn-primary" onclick="navigate('program')">${lang === 'tr' ? 'Programa Git' : 'Go to Program'}</button>
    </div>` : isRestDay ? `
    <div class="card" style="max-width:500px;margin:0 auto;text-align:center;padding:40px">
      <div style="font-size:56px;margin-bottom:16px">🛌</div>
      <h2 style="font-family:var(--font-display);font-size:28px;margin-bottom:8px">${t('rest_day')}</h2>
      <p style="color:var(--text-2);line-height:1.7">${lang === 'tr' ? 'Bugün dinlenme günün! Aktif dinlenme yapabilirsin — hafif yürüyüş, esneme veya meditasyon. Vücudun iyileşiyor.' : "Today is your rest day! You can do active recovery — light walking, stretching, or meditation. Your body is healing."}</p>
      <div style="margin-top:20px;padding:14px;background:var(--bg-2);border-radius:var(--radius);display:inline-flex;gap:24px">
        <div><div style="font-size:20px">💧</div><div style="font-size:12px;color:var(--text-2)">${lang === 'tr' ? 'Su iç' : 'Stay hydrated'}</div></div>
        <div><div style="font-size:20px">🧘</div><div style="font-size:12px;color:var(--text-2)">${lang === 'tr' ? 'Esne' : 'Stretch'}</div></div>
        <div><div style="font-size:20px">😴</div><div style="font-size:12px;color:var(--text-2)">${lang === 'tr' ? 'İyi uyu' : 'Sleep well'}</div></div>
      </div>
    </div>` : `
    <div class="today-layout">
      <!-- Workout Section -->
      <div>
        <div class="card">
          <div class="today-section-title">
            <i class="fas fa-dumbbell" style="color:var(--accent)"></i>
            ${lang === 'tr' ? 'Antrenman' : 'Workout'}
            <span class="count">${todayCompletedExercises.size}/${exercises.length}</span>
            ${workoutDone ? '<span class="tag tag-green"><i class="fas fa-check"></i> Tamam</span>' : ''}
          </div>
          <div class="workout-section" id="exercises-list">
            ${exercises.map(ex => renderExerciseCard(ex, todayCompletedExercises.has(ex.id), lang)).join('')}
          </div>
          <button class="complete-workout-btn ${workoutDone ? 'done' : ''}" id="complete-workout-btn" onclick="completeWorkout()" ${workoutDone ? 'disabled' : ''}>
            ${workoutDone
              ? `<i class="fas fa-check-circle"></i> ${lang === 'tr' ? 'Antrenman Tamamlandı!' : 'Workout Completed!'}`
              : `<i class="fas fa-check"></i> ${lang === 'tr' ? 'Antrenmanı Tamamla' : 'Complete Workout'}`}
          </button>
        </div>
      </div>

      <!-- Meals Section -->
      <div>
        <div class="card">
          <div class="today-section-title">
            <i class="fas fa-utensils" style="color:var(--accent-4)"></i>
            ${lang === 'tr' ? 'Beslenme' : 'Nutrition'}
            <span class="count" style="color:var(--accent-4)">${Object.values(todayMealStatus).filter(Boolean).length}/4</span>
          </div>
          <div class="meals-section">
            ${['breakfast', 'lunch', 'dinner', 'snack'].map(type => {
              const meal = mealPlan[type];
              if (!meal) return '';
              return renderMealCard(type, meal, todayMealStatus[type], lang);
            }).join('')}
          </div>
          <div style="margin-top:14px;padding:12px;background:var(--bg-2);border-radius:var(--radius);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;color:var(--text-2)">${lang === 'tr' ? 'Günlük Kalori Hedefi' : 'Daily Calorie Target'}</span>
            <span style="font-family:var(--font-mono);font-size:14px;color:var(--accent-4)">${appProgram?.meal_plan?.daily_calories || '—'} kcal</span>
          </div>
        </div>

        <!-- Water reminder -->
        <div class="card" style="margin-top:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:28px">💧</span>
            <div>
              <div style="font-weight:700;font-size:14px">${lang === 'tr' ? 'Su İçmeyi Unutma' : "Don't Forget to Hydrate"}</div>
              <div style="font-size:12px;color:var(--text-2)">${lang === 'tr' ? 'Günde en az 8 bardak su iç' : 'Drink at least 8 glasses of water daily'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>`}
  `;
}

function renderExerciseCard(ex, completed, lang) {
  return `
  <div class="exercise-card ${completed ? 'completed' : ''}" id="ex-${ex.id}" onclick="toggleExercise('${ex.id}')">
    <div class="exercise-check">
      ${completed ? '<i class="fas fa-check" style="font-size:11px"></i>' : ''}
    </div>
    <div class="exercise-info">
      <div class="exercise-name">${ex.name}</div>
      <div class="exercise-meta">
        ${ex.sets} ${t('sets')} × ${ex.reps} ${t('reps')}
        ${ex.rest_seconds ? ` · ${ex.rest_seconds}${lang === 'tr' ? 'sn dinlenme' : 's rest'}` : ''}
      </div>
      ${ex.description ? `<div style="font-size:11px;color:var(--text-3);margin-top:3px">${ex.description}</div>` : ''}
    </div>
    <span class="exercise-muscle">${ex.muscle_group || ''}</span>
  </div>`;
}

function renderMealCard(type, meal, completed, lang) {
  const typeLabels = { breakfast: t('breakfast'), lunch: t('lunch'), dinner: t('dinner'), snack: t('snack') };
  const items = Array.isArray(meal.items) ? meal.items : [];
  return `
  <div class="meal-card">
    <div class="meal-card-header">
      <span class="meal-type-badge ${type}">${typeLabels[type]}</span>
      <span class="meal-calories">${meal.calories || ''} kcal · ${meal.time || ''}</span>
    </div>
    <ul class="meal-items">
      ${items.slice(0, 4).map(item => `<li>${item}</li>`).join('')}
      ${items.length > 4 ? `<li style="color:var(--text-3)">+${items.length - 4} ${lang === 'tr' ? 'daha' : 'more'}</li>` : ''}
    </ul>
    <button class="meal-check-btn ${completed ? 'checked' : ''}" onclick="toggleMeal('${type}', this)">
      ${completed
        ? `<i class="fas fa-check-circle"></i> ${lang === 'tr' ? 'Tamamlandı' : 'Completed'}`
        : `<i class="far fa-circle"></i> ${lang === 'tr' ? 'Tamamlandı Olarak İşaretle' : 'Mark as Complete'}`}
    </button>
  </div>`;
}

async function toggleExercise(exId) {
  const todayDate = new Date().toISOString().split('T')[0];
  if (todayCompletedExercises.has(exId)) {
    todayCompletedExercises.delete(exId);
  } else {
    todayCompletedExercises.add(exId);
  }

  // Update UI
  const card = document.getElementById(`ex-${exId}`);
  if (card) {
    const completed = todayCompletedExercises.has(exId);
    card.classList.toggle('completed', completed);
    const check = card.querySelector('.exercise-check');
    if (check) check.innerHTML = completed ? '<i class="fas fa-check" style="font-size:11px"></i>' : '';
  }

  // Update count
  const todayKey = getTodayKey();
  const exercises = appProgram?.workout_plan?.week_structure?.[todayKey]?.exercises || [];
  const countEl = document.querySelector('.today-section-title .count');
  if (countEl) countEl.textContent = `${todayCompletedExercises.size}/${exercises.length}`;

  // Save to backend
  try {
    await API.logs.logWorkout({
      log_date: todayDate,
      exercises_completed: Array.from(todayCompletedExercises),
      workout_completed: 0,
      program_id: todayProgramId,
    });
  } catch (e) { console.error(e); }
}

async function completeWorkout() {
  const todayDate = new Date().toISOString().split('T')[0];
  const btn = document.getElementById('complete-workout-btn');
  if (!btn) return;
  btn.disabled = true;

  const todayKey = getTodayKey();
  const exercises = appProgram?.workout_plan?.week_structure?.[todayKey]?.exercises || [];

  try {
    await API.logs.logWorkout({
      log_date: todayDate,
      exercises_completed: Array.from(todayCompletedExercises),
      workout_completed: 1,
      program_id: todayProgramId,
      difficulty_rating: 3,
    });

    btn.className = 'complete-workout-btn done';
    btn.innerHTML = `<i class="fas fa-check-circle"></i> ${I18N.lang === 'tr' ? 'Antrenman Tamamlandı! 🎉' : 'Workout Completed! 🎉'}`;
    showToast(t('workout_completed'), 'success');

    // Mark all exercises
    exercises.forEach(ex => {
      todayCompletedExercises.add(ex.id);
      const card = document.getElementById(`ex-${ex.id}`);
      if (card) {
        card.classList.add('completed');
        const check = card.querySelector('.exercise-check');
        if (check) check.innerHTML = '<i class="fas fa-check" style="font-size:11px"></i>';
      }
    });
  } catch (e) {
    btn.disabled = false;
    showToast(I18N.lang === 'tr' ? 'Hata oluştu' : 'An error occurred', 'error');
  }
}

async function toggleMeal(type, btn) {
  const todayDate = new Date().toISOString().split('T')[0];
  todayMealStatus[type] = !todayMealStatus[type];
  const completed = todayMealStatus[type];

  btn.className = `meal-check-btn ${completed ? 'checked' : ''}`;
  btn.innerHTML = completed
    ? `<i class="fas fa-check-circle"></i> ${I18N.lang === 'tr' ? 'Tamamlandı' : 'Completed'}`
    : `<i class="far fa-circle"></i> ${I18N.lang === 'tr' ? 'Tamamlandı Olarak İşaretle' : 'Mark as Complete'}`;

  // Update meal count
  const doneCount = Object.values(todayMealStatus).filter(Boolean).length;
  const countEl = document.querySelectorAll('.today-section-title .count')[1];
  if (countEl) countEl.textContent = `${doneCount}/4`;

  try {
    await API.logs.logMeal({
      log_date: todayDate,
      meal_type: type,
      meal_completed: completed ? 1 : 0,
      program_id: todayProgramId,
    });
    if (completed) showToast(t('meal_completed'), 'success');
  } catch (e) { console.error(e); }
}

function getDayNumber() {
  if (!appProgram) return 1;
  const start = new Date(appProgram.start_date);
  const today = new Date();
  return Math.max(1, Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1);
}

window.renderToday = renderToday;
window.toggleExercise = toggleExercise;
window.completeWorkout = completeWorkout;
window.toggleMeal = toggleMeal;
