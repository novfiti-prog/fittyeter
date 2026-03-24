/* ══════════════════════════════════════════
   FITMEET — PROGRAM PAGE
══════════════════════════════════════════ */

let selectedWeek = 1;

async function renderProgram(container) {
  const lang = I18N.lang;

  if (!appProgram) {
    container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${lang === 'tr' ? 'Programım' : 'My Program'}</h1>
    </div>
    <div class="empty-state">
      <div class="empty-state-icon">🤖</div>
      <h3>${lang === 'tr' ? 'Henüz Program Yok' : 'No Program Yet'}</h3>
      <p>${lang === 'tr' ? 'AI koçun sana özel bir program hazırlayacak. Programı yeniden oluşturmak için tıkla.' : 'Your AI coach will prepare a personalized program. Click to generate.'}</p>
      <button class="btn-primary" onclick="generateNewProgram()">${lang === 'tr' ? 'Program Oluştur' : 'Generate Program'}</button>
    </div>`;
    return;
  }

  const workout_plan = appProgram.workout_plan || {};
  const week_structure = workout_plan.week_structure || {};
  const exercises_lib = workout_plan.exercises_library || [];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  container.innerHTML = `
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1 class="page-title">${lang === 'tr' ? 'Programım' : 'My Program'}</h1>
        <p class="page-subtitle">${lang === 'tr' ? 'Haftalık antrenman planın' : 'Your weekly training plan'}</p>
      </div>
      <button class="btn-secondary" onclick="generateNewProgram()">
        <i class="fas fa-sync"></i> ${lang === 'tr' ? 'Yeni Program' : 'New Program'}
      </button>
    </div>

    <!-- Program Overview -->
    <div class="program-overview">
      <div class="program-name">${appProgram.title}</div>
      <div class="program-meta">
        <div class="program-meta-item"><i class="fas fa-calendar"></i> ${formatDate(appProgram.start_date, lang)}</div>
        <div class="program-meta-item"><i class="fas fa-clock"></i> ${appProgram.duration_weeks} ${lang === 'tr' ? 'hafta' : 'weeks'}</div>
        <div class="program-meta-item"><i class="fas fa-dumbbell"></i> ${exercises_lib.length} ${lang === 'tr' ? 'egzersiz' : 'exercises'}</div>
      </div>
      ${appProgram.ai_notes ? `<div class="program-notes">${appProgram.ai_notes}</div>` : ''}
    </div>

    <!-- Week Selector -->
    <div class="program-weeks">
      ${Array.from({ length: appProgram.duration_weeks }, (_, i) => `
        <button class="week-btn ${selectedWeek === i + 1 ? 'active' : ''}" onclick="selectWeek(${i + 1})">
          ${lang === 'tr' ? 'Hafta' : 'Week'} ${i + 1}
        </button>`).join('')}
    </div>

    <!-- Weekly Schedule -->
    <div class="week-schedule" id="week-schedule">
      ${days.map(day => {
        const dayData = week_structure[day] || {};
        const dayExercises = dayData.exercises || [];
        const isRest = dayData.rest || dayExercises.length === 0;
        return `
        <div class="schedule-day ${isRest ? 'rest' : ''}">
          <div class="schedule-day-header">${t(day.slice(0, 3))}</div>
          <div class="schedule-day-content">
            ${isRest
              ? `<div class="schedule-rest">😴<br>${lang === 'tr' ? 'Dinlenme' : 'Rest'}</div>`
              : dayExercises.slice(0, 5).map(ex => `
                <div class="schedule-exercise-item">· ${ex.name || ex}</div>`).join('')
            }
          </div>
        </div>`;
      }).join('')}
    </div>

    <!-- Exercise Library -->
    ${exercises_lib.length > 0 ? `
    <div style="margin-top:28px">
      <h2 style="font-family:var(--font-display);font-size:24px;letter-spacing:1px;margin-bottom:16px">
        ${lang === 'tr' ? 'Egzersiz Kütüphanesi' : 'Exercise Library'}
      </h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">
        ${exercises_lib.map(ex => `
        <div class="card" style="padding:14px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
            <div style="font-weight:700;font-size:14px">${ex.name}</div>
            <span class="exercise-muscle">${ex.muscle_group || ''}</span>
          </div>
          <div style="font-size:12px;color:var(--text-2);margin-bottom:8px">${ex.description || ''}</div>
          <div style="display:flex;gap:8px;font-size:11px;font-family:var(--font-mono);color:var(--accent)">
            <span>${ex.sets} ${t('sets')}</span>
            <span>×</span>
            <span>${ex.reps} ${t('reps')}</span>
            ${ex.rest_seconds ? `<span>· ${ex.rest_seconds}s ${t('rest')}</span>` : ''}
          </div>
          ${ex.equipment ? `<div style="font-size:11px;color:var(--text-3);margin-top:4px"><i class="fas fa-tools"></i> ${ex.equipment}</div>` : ''}
        </div>`).join('')}
      </div>
    </div>` : ''}
  `;
}

function selectWeek(week) {
  selectedWeek = week;
  document.querySelectorAll('.week-btn').forEach((btn, i) => btn.classList.toggle('active', i + 1 === week));
}

async function generateNewProgram() {
  const lang = I18N.lang;
  const confirmed = confirm(lang === 'tr'
    ? 'Mevcut programın silinecek ve yeni bir program oluşturulacak. Devam etmek istiyor musun?'
    : 'Your current program will be replaced. Continue?');
  if (!confirmed) return;

  const profileRes = await API.profile.get().catch(() => ({}));
  const profile = profileRes.profile || {};

  const today = new Date().toISOString().split('T')[0];

  showToast(lang === 'tr' ? 'Program oluşturuluyor...' : 'Generating program...', 'info', 8000);

  try {
    const result = await API.ai.generateProgram({ start_date: today, duration_weeks: 4, language: lang });
    const { program: freshProgram } = await API.ai.getProgram();
    appProgram = freshProgram;
    showToast(lang === 'tr' ? 'Yeni program hazır! 🎉' : 'New program ready! 🎉', 'success');
    renderProgram(document.getElementById('main-content'));
  } catch (e) {
    showToast(lang === 'tr' ? 'Program oluşturulamadı' : 'Could not generate program', 'error');
  }
}

window.renderProgram = renderProgram;
window.selectWeek = selectWeek;
window.generateNewProgram = generateNewProgram;
