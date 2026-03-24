/* ══════════════════════════════════════════
   FITMEET — ONBOARDING MODULE
══════════════════════════════════════════ */

let currentStep = 1;
const TOTAL_STEPS = 5;
let selectedGoal = null;
let selectedLocation = null;

function startOnboarding() {
  currentStep = 1;
  document.getElementById('onboarding-overlay').classList.remove('hidden');
  // Set default start date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('ob-start-date').value = today;
  document.getElementById('ob-start-date').min = today;
  updateOnboardingUI();
  I18N.apply();
}

function updateOnboardingUI() {
  document.querySelectorAll('.onboarding-step').forEach(step => {
    step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
  });
  const fillPct = (currentStep / TOTAL_STEPS) * 100;
  document.getElementById('onboarding-progress-fill').style.width = fillPct + '%';
  document.getElementById('onboarding-progress-text').textContent = `${currentStep} / ${TOTAL_STEPS}`;

  const prevBtn = document.getElementById('ob-prev-btn');
  const nextBtn = document.getElementById('ob-next-btn');
  prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

  if (currentStep === TOTAL_STEPS) {
    nextBtn.innerHTML = `<span>${I18N.lang === 'tr' ? 'Programı Oluştur' : 'Create Program'}</span> <i class="fas fa-robot"></i>`;
  } else {
    nextBtn.innerHTML = `<span>${I18N.lang === 'tr' ? 'Devam' : 'Continue'}</span> <i class="fas fa-arrow-right"></i>`;
  }
}

function validateStep(step) {
  if (step === 1) {
    const age = document.getElementById('ob-age').value;
    const height = document.getElementById('ob-height').value;
    const weight = document.getElementById('ob-weight').value;
    const target = document.getElementById('ob-target-weight').value;
    if (!age || !height || !weight || !target) {
      showToast(I18N.lang === 'tr' ? 'Lütfen tüm alanları doldurun' : 'Please fill all fields', 'error');
      return false;
    }
  }
  if (step === 2 && !selectedGoal) {
    showToast(I18N.lang === 'tr' ? 'Hedef seçin' : 'Please select a goal', 'error');
    return false;
  }
  if (step === 4 && !selectedLocation) {
    showToast(I18N.lang === 'tr' ? 'Antrenman yeri seçin' : 'Select workout location', 'error');
    return false;
  }
  return true;
}

async function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    updateOnboardingUI();
    I18N.apply();
  } else {
    await submitOnboarding();
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateOnboardingUI();
    I18N.apply();
  }
}

function selectGoal(el) {
  document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedGoal = el.dataset.value;
}

function selectLocation(el) {
  document.querySelectorAll('.location-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedLocation = el.dataset.value;
}

async function submitOnboarding() {
  const nextBtn = document.getElementById('ob-next-btn');
  nextBtn.disabled = true;
  nextBtn.innerHTML = `<span class="spinner" style="width:18px;height:18px;border-width:2px"></span>`;

  // Gather form data
  const equipment = Array.from(document.querySelectorAll('#equipment-section input[type=checkbox]:checked')).map(c => c.value);
  const dietary = Array.from(document.querySelectorAll('.onboarding-step[data-step="3"] .checkbox-grid input:checked')).map(c => c.value);

  const profileData = {
    age: parseInt(document.getElementById('ob-age').value),
    gender: document.getElementById('ob-gender').value,
    height_cm: parseFloat(document.getElementById('ob-height').value),
    weight_kg: parseFloat(document.getElementById('ob-weight').value),
    target_weight_kg: parseFloat(document.getElementById('ob-target-weight').value),
    fitness_goal: selectedGoal,
    fitness_level: document.getElementById('ob-fitness-level').value,
    job_type: document.getElementById('ob-job-type').value,
    weekly_workout_hours: parseInt(document.getElementById('ob-workout-hours').value),
    workout_location: selectedLocation,
    equipment,
    dietary_restrictions: dietary,
    health_notes: document.getElementById('ob-health-notes').value,
  };

  try {
    // Save profile
    await API.profile.onboarding(profileData);
    showToast(I18N.lang === 'tr' ? 'Profil kaydedildi! Program oluşturuluyor...' : 'Profile saved! Generating program...', 'success');

    // Generate AI program
    const programData = {
      start_date: document.getElementById('ob-start-date').value,
      duration_weeks: parseInt(document.getElementById('ob-duration').value),
      language: I18N.lang,
    };

    nextBtn.innerHTML = `<span>${I18N.lang === 'tr' ? 'Program oluşturuluyor...' : 'Generating program...'}</span> <span class="spinner" style="width:14px;height:14px;border-width:2px"></span>`;

    await API.ai.generateProgram(programData);

    showToast(I18N.lang === 'tr' ? 'Programın hazır! 🎉' : 'Your program is ready! 🎉', 'success');

    // Update user in local storage
    const user = API.getUser();
    if (user) { user.onboarding_completed = 1; API.setUser(user); }

    setTimeout(() => {
      document.getElementById('onboarding-overlay').classList.add('hidden');
      startApp(API.getUser());
    }, 1000);

  } catch (err) {
    console.error(err);
    showToast(I18N.lang === 'tr' ? 'Hata oluştu. Tekrar deneyin.' : 'An error occurred. Please try again.', 'error');
    nextBtn.disabled = false;
    nextBtn.innerHTML = `<span>${I18N.lang === 'tr' ? 'Programı Oluştur' : 'Create Program'}</span> <i class="fas fa-robot"></i>`;
  }
}

window.startOnboarding = startOnboarding;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.selectGoal = selectGoal;
window.selectLocation = selectLocation;
