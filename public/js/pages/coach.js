/* ══════════════════════════════════════════
   FITMEET — AI COACH PAGE
══════════════════════════════════════════ */

let chatMessages = [];

async function renderCoach(container) {
  const lang = I18N.lang;

  const quickQuestions = lang === 'tr' ? [
    { icon: '🔥', q: 'Bugün ne kadar kalori yakmalıyım?' },
    { icon: '💪', q: 'Kol kaslarımı geliştirmek için en iyi egzersizler neler?' },
    { icon: '🥗', q: 'Kas kazanmak için ne yemem gerekiyor?' },
    { icon: '😴', q: 'Kas gelişimi için uyku ne kadar önemli?' },
    { icon: '📈', q: 'İlerleme kaydetmiyorum, ne yapmalıyım?' },
    { icon: '🏃', q: 'Kardio mu ağırlık antrenmanı mı daha etkili?' },
  ] : [
    { icon: '🔥', q: 'How many calories should I burn today?' },
    { icon: '💪', q: 'What are the best exercises for building arm muscles?' },
    { icon: '🥗', q: 'What should I eat to gain muscle?' },
    { icon: '😴', q: 'How important is sleep for muscle development?' },
    { icon: '📈', q: "I'm not seeing progress, what should I do?" },
    { icon: '🏃', q: 'Which is more effective, cardio or weight training?' },
  ];

  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">AI <span>${lang === 'tr' ? 'Koç' : 'Coach'}</span></h1><p class="page-subtitle">${lang === 'tr' ? 'Kişisel fitness danışmanın' : 'Your personal fitness advisor'}</p></div>

    <div class="coach-layout">
      <!-- Chat -->
      <div class="card coach-main" style="padding:0;overflow:hidden">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:18px">🤖</div>
          <div>
            <div style="font-weight:700;font-size:14px">Coach AI</div>
            <div style="font-size:12px;color:var(--accent)">● ${lang === 'tr' ? 'Aktif' : 'Active'}</div>
          </div>
        </div>

        <div class="chat-messages" id="chat-messages">
          <!-- Initial greeting -->
          <div class="chat-message assistant">
            <div class="msg-avatar">🤖</div>
            <div class="msg-bubble">${t('coach_hello')}</div>
          </div>
          ${chatMessages.map(m => renderChatMessage(m)).join('')}
        </div>

        <div style="padding:12px 16px">
          <div class="chat-input-area">
            <textarea class="chat-input" id="chat-input" placeholder="${t('type_message')}" rows="1" onkeydown="handleChatKey(event)" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
            <button class="chat-send-btn" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
          </div>
        </div>
      </div>

      <!-- Quick Questions -->
      <div class="coach-sidebar-panel">
        <div class="card">
          <div class="card-title" style="margin-bottom:12px;font-size:15px">${lang === 'tr' ? 'Hızlı Sorular' : 'Quick Questions'}</div>
          ${quickQuestions.map(q => `
          <button class="quick-question-btn" onclick="askQuickQuestion(this.dataset.q)" data-q="${q.q}">
            <i class="fas fa-comment-dots"></i> ${q.icon} ${q.q}
          </button>`).join('')}
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:12px;font-size:15px">${lang === 'tr' ? 'Profil Özeti' : 'Profile Summary'}</div>
          ${appUser ? `
          <div style="display:flex;flex-direction:column;gap:8px;font-size:13px">
            <div style="display:flex;justify-content:space-between"><span style="color:var(--text-2)">${lang === 'tr' ? 'Hedef' : 'Goal'}</span><span class="tag tag-green">${appUser.fitness_goal ? t(appUser.fitness_goal) : '—'}</span></div>
          </div>` : ''}
          ${appProgram ? `
          <div style="margin-top:10px;padding:10px;background:var(--bg-2);border-radius:var(--radius)">
            <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:4px">${lang === 'tr' ? 'Aktif Program' : 'Active Program'}</div>
            <div style="font-size:12px;color:var(--text-2)">${appProgram.title}</div>
          </div>` : ''}
        </div>
      </div>
    </div>
  `;

  // Scroll to bottom
  scrollChatToBottom();
}

function renderChatMessage(msg) {
  return `
  <div class="chat-message ${msg.role}">
    <div class="msg-avatar">${msg.role === 'assistant' ? '🤖' : (appUser?.full_name?.[0] || 'U')}</div>
    <div class="msg-bubble">${msg.content.replace(/\n/g, '<br>')}</div>
  </div>`;
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

function askQuickQuestion(q) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = q;
    sendChatMessage();
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  input.style.height = 'auto';

  // Add user message to UI
  const messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;

  const userMsg = { role: 'user', content: message };
  chatMessages.push(userMsg);

  messagesEl.insertAdjacentHTML('beforeend', renderChatMessage(userMsg));

  // Show typing indicator
  const typingId = 'typing-' + Date.now();
  messagesEl.insertAdjacentHTML('beforeend', `
    <div class="chat-message assistant" id="${typingId}">
      <div class="msg-avatar">🤖</div>
      <div class="chat-typing"><span></span><span></span><span></span></div>
    </div>`);

  scrollChatToBottom();

  try {
    const { reply } = await API.ai.chat(message, I18N.lang);

    // Remove typing indicator
    document.getElementById(typingId)?.remove();

    // Add assistant reply
    const assistantMsg = { role: 'assistant', content: reply };
    chatMessages.push(assistantMsg);
    messagesEl.insertAdjacentHTML('beforeend', renderChatMessage(assistantMsg));
    scrollChatToBottom();
  } catch (e) {
    document.getElementById(typingId)?.remove();
    messagesEl.insertAdjacentHTML('beforeend', `
      <div class="chat-message assistant">
        <div class="msg-avatar">🤖</div>
        <div class="msg-bubble" style="color:var(--accent-3)">${I18N.lang === 'tr' ? 'Bağlantı hatası. Lütfen tekrar deneyin.' : 'Connection error. Please try again.'}</div>
      </div>`);
    scrollChatToBottom();
  }
}

function scrollChatToBottom() {
  setTimeout(() => {
    const el = document.getElementById('chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }, 50);
}

window.renderCoach = renderCoach;
window.sendChatMessage = sendChatMessage;
window.handleChatKey = handleChatKey;
window.askQuickQuestion = askQuickQuestion;
