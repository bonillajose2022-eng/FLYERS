/* ============================================================
   FLYERS FUN! - Cambridge A2 Flyers Study Website
   script.js - Complete JavaScript Logic
   ============================================================ */

// ==================== GLOBAL STATE ====================
const state = {
  stars: 0,
  completedExercises: {},
  scores: {
    rw3: 0, rw3b: 0,
    rw4a: 0, rw4b: 0,
    rw7: false,
    li3: 0, li3b: 0,
    li4a: 0, li4b: 0
  }
};

// ==================== ANSWER KEYS ====================
const ANSWERS = {
  rw3:  ['A', 'B', 'A', 'B', 'C'],    // round, red, eat, grow, sunshine
  rw3b: ['A', 'A', 'C', 'B', 'A'],    // heard, looked, dark, frightened, went
  rw4a: ['A', 'B', 'C', 'A', 'B'],    // live, cute, webbed, insects, fly
  rw4b: ['B', 'A', 'C', 'B', 'C'],    // biggest, air, calf, communicate, far
  li3:  ['B', 'A', 'C', 'D', 'E'],    // Tom-football, Sarah-reading, Jack-drawing, Emma-dancing, Ben-talking
  li3b: ['A', 'B', 'C', 'D', 'E'],    // Anna-swimming, Carlos-guitar, Lily-painting, Max-stamps, Zoe-cooking
  li4a: ['B', 'C', 'B', 'C', 'B'],    // Saturday 15th, ten, house, chocolate, musical chairs
  li4b: ['B', 'C', 'B', 'C', 'B']     // Natural History, coach, Thursday 22nd, four hours, 8:30
};

// Mascot messages
const mascotMessages = [
  "You can do it! 💪",
  "Great job reading! 📖",
  "Keep practicing! 🌟",
  "You're doing amazing! 🦋",
  "Almost there! 🎯",
  "Super student! 🏆",
  "Flyers champion! 🎉",
  "Read carefully! 👀",
  "Listen closely! 🎧"
];

// ==================== NAVIGATION ====================

/**
 * Show a main section and update nav
 */
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  // Remove active from all nav links
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  
  // Show target section
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Mark nav link active
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(sectionId)) {
      link.classList.add('active');
    }
  });
  
  // Update progress section if needed
  if (sectionId === 'progress') updateProgressPage();
  
  // Stop any ongoing speech when navigating away
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  Object.keys(audioState).forEach(id => {
    if (audioState[id]) {
      audioState[id].cancelled = true;
      audioState[id].playing = false;
      if (audioState[id].progressTimer) clearInterval(audioState[id].progressTimer);
    }
    const btn = document.getElementById(`${id}-playBtn`);
    if (btn) btn.innerHTML = '▶ Play Audio';
    const waves = getWaves(id);
    if (waves) waves.classList.remove('playing');
  });
  
  // Rotate mascot message
  rotateMascotMessage();
}

/**
 * Show a tab within a section
 */
function showTab(section, part) {
  // Remove active from all tabs in this section
  const sectionEl = document.getElementById(section === 'rw' ? 'reading' : 'listening');
  sectionEl.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  sectionEl.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  // Show target tab
  const tabId = `${section}-${part}`;
  const tabContent = document.getElementById(tabId);
  if (tabContent) tabContent.classList.add('active');
  
  // Find and activate the matching button
  const buttons = sectionEl.querySelectorAll('.tab-btn');
  const partNames = { 'part3': 'Part 3', 'part4': 'Part 4', 'part7': 'Part 7' };
  buttons.forEach(btn => {
    if (btn.textContent.trim() === partNames[part]) {
      btn.classList.add('active');
    }
  });
  
  window.scrollTo({ top: sectionEl.offsetTop - 80, behavior: 'smooth' });
}

// ==================== MASCOT ====================

function rotateMascotMessage() {
  const bubble = document.getElementById('mascotBubble');
  if (!bubble) return;
  const msg = mascotMessages[Math.floor(Math.random() * mascotMessages.length)];
  bubble.textContent = msg;
  bubble.style.display = 'block';
  clearTimeout(rotateMascotMessage._timer);
  rotateMascotMessage._timer = setTimeout(() => {
    bubble.style.display = 'none';
  }, 4000);
}

// ==================== SCORING ====================

/**
 * Add stars to total and update display
 */
function addStars(count) {
  state.stars += count;
  const starsEl = document.getElementById('totalStars');
  if (starsEl) {
    starsEl.textContent = state.stars;
    starsEl.style.animation = 'none';
    setTimeout(() => starsEl.style.animation = '', 10);
  }
  updateGlobalProgress();
  checkAchievements();
}

/**
 * Update the global progress butterfly bar
 */
function updateGlobalProgress() {
  const totalPossible = 40; // Total stars possible
  const percentage = Math.min((state.stars / totalPossible) * 100, 100);
  
  const fill = document.getElementById('globalProgress');
  const butterfly = document.getElementById('progressButterfly');
  const text = document.getElementById('progressText');
  
  if (fill) fill.style.width = percentage + '%';
  if (butterfly) butterfly.style.left = percentage + '%';
  if (text) text.textContent = Math.round(percentage) + '% Complete';
}

// ==================== GENERIC ANSWER CHECKER ====================

/**
 * Grade answers and return { correct, wrong, total }
 */
function gradeAnswers(userAnswers, correctAnswers) {
  let correct = 0;
  const details = [];
  
  correctAnswers.forEach((ans, i) => {
    const isCorrect = userAnswers[i] === ans;
    if (isCorrect) correct++;
    details.push({ index: i, isCorrect, correct: ans, given: userAnswers[i] });
  });
  
  return { correct, total: correctAnswers.length, details };
}

/**
 * Build feedback HTML message
 */
function buildFeedback(correct, total, details, questionLabels) {
  let html = '';
  
  if (correct === total) {
    html = `<div class="feedback-correct">
      🎉 <strong>PERFECT SCORE! ${correct}/${total}</strong> — You're a Flyers superstar! Amazing work! ⭐⭐⭐
    </div>`;
  } else if (correct >= total * 0.6) {
    html = `<div class="feedback-partial">
      👍 <strong>Good job! ${correct}/${total}</strong> — Almost there! Review the wrong answers below. Keep going! 💪
    </div>`;
  } else {
    html = `<div class="feedback-wrong">
      💡 <strong>${correct}/${total}</strong> — Don't worry! Read the tips again and try once more. You can do it! 🌟
    </div>`;
  }
  
  // Show individual answers
  if (details) {
    html += '<div style="margin-top:12px; display:flex; flex-wrap:wrap; gap:8px;">';
    details.forEach((d, i) => {
      const label = questionLabels ? questionLabels[i] : `Q${i+1}`;
      html += `<span style="padding:5px 12px; border-radius:20px; font-size:0.82rem; font-weight:700; background:${d.isCorrect ? 'rgba(85,239,196,0.25)' : 'rgba(255,107,107,0.2)'}; border:2px solid ${d.isCorrect ? '#00B894' : '#FF6B6B'};">
        ${label}: ${d.isCorrect ? '✅' : `❌ (${d.correct})`}
      </span>`;
    });
    html += '</div>';
  }
  
  return html;
}

// ==================== READING PART 3 - Exercise 1 ====================

function checkRW3() { /* Live feedback placeholder */ }

function submitRW3() {
  const userAnswers = [
    document.getElementById('rw3-q1').value,
    document.getElementById('rw3-q2').value,
    document.getElementById('rw3-q3').value,
    document.getElementById('rw3-q4').value,
    document.getElementById('rw3-q5').value
  ];
  
  if (userAnswers.some(a => a === '')) {
    showFeedback('rw3-feedback', '<div class="feedback-partial">⚠️ Please answer all questions before checking!</div>');
    return;
  }
  
  const { correct, total, details } = gradeAnswers(userAnswers, ANSWERS.rw3);
  const html = buildFeedback(correct, total, details);
  showFeedback('rw3-feedback', html);
  
  const score = correct;
  document.getElementById('rw3-score').textContent = `${score}/5`;
  state.scores.rw3 = score;
  
  if (!state.completedExercises['rw3']) {
    state.completedExercises['rw3'] = true;
    addStars(score);
    if (correct === total) showCelebration('rw3', correct);
  }
  
  updateProgressBars();
}

function resetRW3() {
  ['rw3-q1','rw3-q2','rw3-q3','rw3-q4','rw3-q5'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  showFeedback('rw3-feedback', '');
}

// ==================== READING PART 3 - Exercise 2 ====================

function submitRW3b() {
  const userAnswers = [
    document.getElementById('rw3b-q1').value,
    document.getElementById('rw3b-q2').value,
    document.getElementById('rw3b-q3').value,
    document.getElementById('rw3b-q4').value,
    document.getElementById('rw3b-q5').value
  ];
  
  if (userAnswers.some(a => a === '')) {
    showFeedback('rw3b-feedback', '<div class="feedback-partial">⚠️ Please answer all questions before checking!</div>');
    return;
  }
  
  const { correct, total, details } = gradeAnswers(userAnswers, ANSWERS.rw3b);
  const html = buildFeedback(correct, total, details);
  showFeedback('rw3b-feedback', html);
  
  document.getElementById('rw3b-score').textContent = `${correct}/5`;
  state.scores.rw3b = correct;
  
  if (!state.completedExercises['rw3b']) {
    state.completedExercises['rw3b'] = true;
    addStars(correct);
    if (correct === total) showCelebration('rw3b', correct);
  }
  
  updateProgressBars();
}

function resetRW3b() {
  ['rw3b-q1','rw3b-q2','rw3b-q3','rw3b-q4','rw3b-q5'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  showFeedback('rw3b-feedback', '');
}

// ==================== READING PART 4 - Ducks ====================

function submitRW4a() {
  const userAnswers = [
    getRadioValue('rw4a-q1'),
    getRadioValue('rw4a-q2'),
    getRadioValue('rw4a-q3'),
    getRadioValue('rw4a-q4'),
    getRadioValue('rw4a-q5')
  ];
  
  if (userAnswers.some(a => a === null)) {
    showFeedback('rw4a-feedback', '<div class="feedback-partial">⚠️ Please answer all questions before checking!</div>');
    return;
  }
  
  const { correct, total, details } = gradeAnswers(userAnswers, ANSWERS.rw4a);
  showFeedback('rw4a-feedback', buildFeedback(correct, total, details));
  
  document.getElementById('rw4a-score').textContent = `${correct}/5`;
  state.scores.rw4a = correct;
  
  if (!state.completedExercises['rw4a']) {
    state.completedExercises['rw4a'] = true;
    addStars(correct);
    if (correct === total) showCelebration('rw4a', correct);
  }
  
  updateProgressBars();
}

function resetRW4a() {
  document.querySelectorAll('input[name^="rw4a-"]').forEach(r => r.checked = false);
  showFeedback('rw4a-feedback', '');
}

// ==================== READING PART 4 - Whales ====================

function submitRW4b() {
  const userAnswers = [
    getRadioValue('rw4b-q1'),
    getRadioValue('rw4b-q2'),
    getRadioValue('rw4b-q3'),
    getRadioValue('rw4b-q4'),
    getRadioValue('rw4b-q5')
  ];
  
  if (userAnswers.some(a => a === null)) {
    showFeedback('rw4b-feedback', '<div class="feedback-partial">⚠️ Please answer all questions before checking!</div>');
    return;
  }
  
  const { correct, total, details } = gradeAnswers(userAnswers, ANSWERS.rw4b);
  showFeedback('rw4b-feedback', buildFeedback(correct, total, details));
  
  document.getElementById('rw4b-score').textContent = `${correct}/5`;
  state.scores.rw4b = correct;
  
  if (!state.completedExercises['rw4b']) {
    state.completedExercises['rw4b'] = true;
    addStars(correct);
    if (correct === total) showCelebration('rw4b', correct);
  }
  
  updateProgressBars();
}

function resetRW4b() {
  document.querySelectorAll('input[name^="rw4b-"]').forEach(r => r.checked = false);
  showFeedback('rw4b-feedback', '');
}

// ==================== READING PART 7 - Story Writing ====================

function countWords() {
  const text = document.getElementById('storyText').value.trim();
  const words = text === '' ? 0 : text.split(/\s+/).filter(w => w.length > 0).length;
  
  document.getElementById('wordCount').textContent = words;
  
  const status = document.getElementById('wordCountStatus');
  if (words === 0) {
    status.textContent = 'Start writing! ✏️';
    status.className = 'wc-status';
  } else if (words < 10) {
    status.textContent = 'Keep writing! 📝';
    status.className = 'wc-status';
  } else if (words < 20) {
    status.textContent = 'Almost there! 💪';
    status.className = 'wc-status';
  } else if (words < 40) {
    status.textContent = '✅ Good! Try adding more details!';
    status.className = 'wc-status wc-good';
  } else {
    status.textContent = '🌟 Excellent story length!';
    status.className = 'wc-status wc-good';
  }
}

function addPhrase(phrase) {
  const textarea = document.getElementById('storyText');
  if (!textarea) return;
  const cursorPos = textarea.selectionStart;
  const before = textarea.value.substring(0, cursorPos);
  const after = textarea.value.substring(cursorPos);
  textarea.value = before + phrase + after;
  textarea.selectionStart = textarea.selectionEnd = cursorPos + phrase.length;
  textarea.focus();
  countWords();
}

function checkStory() {
  const text = document.getElementById('storyText').value.trim();
  const words = text === '' ? 0 : text.split(/\s+/).filter(w => w.length > 0).length;
  
  let feedback = '';
  let stars = 0;
  
  if (words === 0) {
    feedback = '<div class="feedback-wrong">✏️ Please write your story first!</div>';
  } else if (words < 20) {
    feedback = `<div class="feedback-partial">⚠️ Your story has <strong>${words} words</strong>. You need at least <strong>20 words</strong>. Keep writing! 💪</div>`;
  } else {
    // Check for story elements
    const hasConnectors = /first|then|after|next|finally|suddenly|because|when|while|but|and/i.test(text);
    const hasAdjectives = /big|small|beautiful|amazing|wonderful|scary|funny|happy|sad|excited|little|great|nice|old|young/i.test(text);
    const hasPastTense = /\b\w+ed\b|\bwent\b|\bsaw\b|\bfound\b|\bwas\b|\bwere\b|\bhad\b|\bran\b|\bjumped\b|\bswam\b/i.test(text);
    
    stars = 3;
    let praise = [];
    let improve = [];
    
    if (hasConnectors) praise.push('great use of connectors');
    else improve.push('try using words like <em>first, then, finally</em>');
    
    if (hasAdjectives) praise.push('good adjectives');
    else improve.push('add more adjectives (big, beautiful, exciting...)');
    
    if (hasPastTense) praise.push('correct past tense');
    else improve.push('use past tense (went, saw, found...)');
    
    if (words >= 40) { stars = 5; praise.push(`excellent length (${words} words!)`); }
    else if (words >= 25) stars = 4;
    
    const starStr = '⭐'.repeat(stars);
    
    feedback = `<div class="feedback-correct">
      ${starStr} <strong>Your story has ${words} words!</strong><br>
      ${praise.length ? '✅ Well done: ' + praise.join(', ') + '.' : ''}
      ${improve.length ? '<br>💡 You could improve by: ' + improve.join(', ') + '.' : ''}
    </div>`;
    
    if (!state.completedExercises['rw7']) {
      state.completedExercises['rw7'] = true;
      state.scores.rw7 = true;
      addStars(stars);
      updateProgressBars();
      if (stars >= 5) showCelebration('rw7', stars);
    }
  }
  
  showFeedback('story-feedback', feedback);
}

function clearStory() {
  document.getElementById('storyText').value = '';
  countWords();
  showFeedback('story-feedback', '');
}

// ==================== REAL AUDIO — Web Speech API (Text-to-Speech) ====================

// Full scripts for each listening exercise
const AUDIO_SCRIPTS = {
  li3: [
    { speaker: 'Narrator', text: 'You will hear five children talking about what they like to do at break time. Listen and match each child to their favourite activity.' },
    { speaker: 'Tom', text: "Hi, my name is Tom. At break time I always play football with my friends in the school playground. I love it! I want to be a professional footballer one day." },
    { speaker: 'Sarah', text: "Hello, I'm Sarah. I like to go to the school library during break time. It's very quiet and I can read my favourite stories. I love books!" },
    { speaker: 'Jack', text: "Hi there, I'm Jack. My favourite thing at break time is drawing pictures. I always bring my sketchbook to school. I want to be an artist one day!" },
    { speaker: 'Emma', text: "My name is Emma. I love dancing with my friends at break time. We make up our own dance routines. It's so much fun!" },
    { speaker: 'Ben', text: "Hello, I'm Ben. I like to eat my snack and chat with my friends. Talking and eating together is my favourite part of break time!" },
    { speaker: 'Narrator', text: 'Now listen again. Match each child to their favourite activity.' },
    { speaker: 'Tom', text: "My name is Tom. I always play football at break time." },
    { speaker: 'Sarah', text: "I'm Sarah. I love reading books in the library." },
    { speaker: 'Jack', text: "I'm Jack. I enjoy drawing pictures at break time." },
    { speaker: 'Emma', text: "I'm Emma. Dancing with friends is my favourite activity." },
    { speaker: 'Ben', text: "I'm Ben. I love talking with friends at break time." },
  ],
  li3b: [
    { speaker: 'Narrator', text: 'You will hear five children talking about their hobbies. Listen and match each child to their hobby.' },
    { speaker: 'Anna', text: "Hi, my name is Anna. I love going to the swimming pool every weekend. I can swim really fast! My coach says I could compete in competitions one day." },
    { speaker: 'Carlos', text: "Hello, I'm Carlos. My hobby is playing the guitar. I practise every day after school for thirty minutes. I can already play ten songs!" },
    { speaker: 'Lily', text: "My name is Lily. I enjoy painting. I have lots of paints and brushes at home. I paint pictures of animals and nature." },
    { speaker: 'Max', text: "Hi, I'm Max. I collect stamps from different countries. I have over five hundred stamps in my collection! My grandpa gave me my first ones." },
    { speaker: 'Zoe', text: "Hello, I'm Zoe. I love cooking with my mum. We make cakes and biscuits together every Saturday. The chocolate cake is my favourite to make!" },
    { speaker: 'Narrator', text: 'Now listen again.' },
    { speaker: 'Anna', text: "I'm Anna. Swimming is my favourite hobby." },
    { speaker: 'Carlos', text: "I'm Carlos. I play the guitar every day." },
    { speaker: 'Lily', text: "I'm Lily. I enjoy painting pictures." },
    { speaker: 'Max', text: "I'm Max. I collect stamps from different countries." },
    { speaker: 'Zoe', text: "I'm Zoe. I love cooking with my mum." },
  ],
  li4a: [
    { speaker: 'Narrator', text: "You will hear Emma talking to her friend about her birthday party. Listen carefully and answer the questions." },
    { speaker: 'Friend', text: "Hi Emma! I heard you're having a birthday party! When is it?" },
    { speaker: 'Emma', text: "Yes, it's on Saturday, the fifteenth of March. I'm so excited!" },
    { speaker: 'Friend', text: "That's great! How many friends are you inviting?" },
    { speaker: 'Emma', text: "I'm inviting ten friends from school. It's going to be amazing!" },
    { speaker: 'Friend', text: "Wow, ten friends! Where is the party?" },
    { speaker: 'Emma', text: "At my house. We have a really big garden so everyone can play outside." },
    { speaker: 'Friend', text: "That sounds wonderful! What kind of birthday cake are you having?" },
    { speaker: 'Emma', text: "A chocolate cake! My mum is making it. Chocolate is my absolute favourite flavour." },
    { speaker: 'Friend', text: "Yummy! And what games will you play at the party?" },
    { speaker: 'Emma', text: "We're going to play musical chairs and then dance to our favourite music. It'll be so fun!" },
    { speaker: 'Narrator', text: 'Now listen again.' },
    { speaker: 'Emma', text: "My party is on Saturday, the fifteenth of March. Ten friends are coming to my house. We'll have a chocolate cake and play musical chairs." },
  ],
  li4b: [
    { speaker: 'Narrator', text: "You will hear a teacher talking to her class about a school trip. Listen carefully and answer the questions." },
    { speaker: 'Teacher', text: "Good morning everyone! I have some exciting news about our school trip next month. We are going to the Natural History Museum! You are going to love it." },
    { speaker: 'Student', text: "How are we getting there, Miss? Are we going by train?" },
    { speaker: 'Teacher', text: "No, we'll travel by coach. It will be comfortable and we can all sit together. The trip is on Thursday, the twenty-second. Please write that date in your diary." },
    { speaker: 'Student', text: "What do we need to bring, Miss?" },
    { speaker: 'Teacher', text: "You need to bring a packed lunch and please wear comfortable shoes because we'll be walking a lot. We will be at the museum for four hours, so bring a water bottle too." },
    { speaker: 'Student', text: "Can we bring our mobile phones?" },
    { speaker: 'Teacher', text: "Yes, but only for taking photos! No games please. We will leave school at eight thirty in the morning, so please don't be late!" },
    { speaker: 'Narrator', text: 'Now listen again.' },
    { speaker: 'Teacher', text: "We are going to the Natural History Museum by coach on Thursday the twenty-second. Bring packed lunch and comfortable shoes. We leave at eight thirty and we will be there for four hours." },
  ]
};

// State for each audio player
const audioState = {};

/**
 * Get the sound waves element for a given audio id
 */
function getWaves(id) {
  const map = { li3: '', li3b: '2', li4a: '3', li4b: '4' };
  return document.querySelector(`#soundWaves${map[id] ?? ''}`);
}

/**
 * Update the progress bar and timer display during speech
 */
function startProgressTimer(id, totalDuration) {
  const progressFill = document.getElementById(`${id}-progress`);
  const timeEl = document.getElementById(`${id}-time`);
  let elapsed = 0;

  // Clear any old timer
  if (audioState[id]?.progressTimer) clearInterval(audioState[id].progressTimer);

  const timer = setInterval(() => {
    elapsed++;
    const pct = Math.min((elapsed / totalDuration) * 100, 100);
    if (progressFill) progressFill.style.width = pct + '%';

    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const tMins = Math.floor(totalDuration / 60);
    const tSecs = totalDuration % 60;
    if (timeEl) {
      timeEl.textContent = `${mins}:${String(secs).padStart(2,'0')} / ${tMins}:${String(tSecs).padStart(2,'0')}`;
    }

    if (elapsed >= totalDuration) clearInterval(timer);
  }, 1000);

  audioState[id].progressTimer = timer;
}

/**
 * Speak all lines for an exercise sequentially using SpeechSynthesis
 */
function speakLines(id, lines, onDone) {
  if (!window.speechSynthesis) {
    alert('Sorry! Your browser does not support audio. Please use Google Chrome or Microsoft Edge.');
    return;
  }

  window.speechSynthesis.cancel(); // stop any previous speech

  let lineIndex = 0;

  function speakNext() {
    // Stop if cancelled
    if (!audioState[id] || audioState[id].cancelled) return;
    if (lineIndex >= lines.length) {
      onDone();
      return;
    }

    const line = lines[lineIndex++];
    const utter = new SpeechSynthesisUtterance(line.text);

    // Use a clear English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find(v => v.lang.startsWith('en')) || null;

    if (preferred) utter.voice = preferred;

    // Narrator speaks slower and lower
    if (line.speaker === 'Narrator') {
      utter.rate = 0.82;
      utter.pitch = 0.9;
    } else {
      utter.rate = 0.88;
      utter.pitch = line.speaker === 'Teacher' ? 1.1 :
                    line.speaker === 'Friend'  ? 1.15 :
                    ['Anna','Sarah','Emma','Lily','Zoe'].includes(line.speaker) ? 1.2 : 1.0;
    }

    utter.onend = () => {
      // Small natural pause between speakers
      const pause = line.speaker === 'Narrator' ? 600 : 350;
      setTimeout(speakNext, pause);
    };

    utter.onerror = () => speakNext(); // skip on error

    window.speechSynthesis.speak(utter);
    audioState[id].currentUtter = utter;
  }

  speakNext();
}

/**
 * Main play/stop function called by the Play buttons
 */
function playAudio(id) {
  const btn = document.getElementById(`${id}-playBtn`);
  const waves = getWaves(id);
  const progressFill = document.getElementById(`${id}-progress`);
  const timeEl = document.getElementById(`${id}-time`);

  // --- STOP if already playing ---
  if (audioState[id] && audioState[id].playing) {
    audioState[id].cancelled = true;
    audioState[id].playing = false;
    window.speechSynthesis.cancel();
    if (audioState[id].progressTimer) clearInterval(audioState[id].progressTimer);
    if (waves) waves.classList.remove('playing');
    btn.innerHTML = '▶ Play Audio';
    if (progressFill) progressFill.style.width = '0%';
    if (timeEl) timeEl.textContent = '0:00';
    return;
  }

  // Check browser support
  if (!window.speechSynthesis) {
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'margin-top:10px;padding:12px 16px;background:rgba(255,107,107,0.15);border:2px solid #FF6B6B;border-radius:12px;font-size:0.85rem;font-weight:700;color:#8b0000;';
    errDiv.innerHTML = '⚠️ Your browser does not support audio. Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.';
    btn.parentElement.appendChild(errDiv);
    setTimeout(() => errDiv.remove(), 6000);
    return;
  }

  const lines = AUDIO_SCRIPTS[id];
  if (!lines) return;

  // Estimate duration: average ~5 words/second at rate 0.88
  const totalWords = lines.reduce((sum, l) => sum + l.text.split(' ').length, 0);
  const estimatedDuration = Math.round(totalWords / 4.5) + lines.length; // +pause per line

  // --- START ---
  audioState[id] = { playing: true, cancelled: false, progressTimer: null };

  if (waves) waves.classList.add('playing');
  btn.innerHTML = '⏹ Stop Audio';

  // Reset progress
  if (progressFill) progressFill.style.width = '0%';

  startProgressTimer(id, estimatedDuration);

  speakLines(id, lines, () => {
    // Done callback
    if (!audioState[id] || audioState[id].cancelled) return;
    audioState[id].playing = false;

    if (audioState[id].progressTimer) clearInterval(audioState[id].progressTimer);
    if (waves) waves.classList.remove('playing');
    if (progressFill) progressFill.style.width = '100%';

    btn.innerHTML = '▶ Play Again';

    // Show completion tip
    const tip = document.createElement('div');
    tip.style.cssText = 'margin-top:10px;padding:12px 16px;background:rgba(78,205,196,0.15);border-radius:12px;font-size:0.85rem;font-weight:700;color:#006644;border:2px solid #4ECDC4;';
    tip.innerHTML = '✅ Audio finished! Now answer the questions. 🎉 In the real exam you hear everything TWICE — that\'s why we played it twice here too!';
    btn.parentElement.appendChild(tip);
    setTimeout(() => tip.remove(), 7000);
  });

  rotateMascotMessage();
}

// ==================== TRANSCRIPT TOGGLE ====================

function toggleTranscript(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('hidden');
  const btn = el.previousElementSibling;
  if (btn) {
    btn.textContent = el.classList.contains('hidden') ? '📄 Show Script (for practice)' : '📄 Hide Script';
  }
}

// ==================== LISTENING PART 3 - Break Time ====================

function submitLI3() {
  const userAnswers = [
    document.getElementById('li3-q1').value,
    document.getElementById('li3-q2').value,
    document.getElementById('li3-q3').value,
    document.getElementById('li3-q4').value,
    document.getElementById('li3-q5').value
  ];
  
  if (userAnswers.some(a => a === '')) {
    showFeedback('li3-feedback', '<div class="feedback-partial">⚠️ Please match all children before checking!</div>');
    return;
  }
  
  const labels = ['Tom', 'Sarah', 'Jack', 'Emma', 'Ben'];
  const { correct, total, details } = gradeAnswers(userAnswers, ANSWERS.li3);
  showFeedback('li3-feedback', buildFeedback(correct, total, details, labels));
  
  state.scores.li3 = correct;
  
  if (!state.completedExercises['li3']) {
    state.completedExercises['li3'] = true;
    addStars(correct);
    if (correct === total) showCelebration('li3', correct);
  }
  
  updateProgressBars();
}

function resetLI3() {
  ['li3-q1','li3-q2','li3-q3','li3-q4','li3-q5'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  showFeedback('li3-feedback', '');
}

// ==================== LISTENING PART 3 - Hobbies ====================

function submitLI3b() {
  const userAnswers = [
    document.getElementById('li3b-q1').value,
    document.getElementById('li3b-q2').value,
    document.getElementById('li3b-q3').value,
    document.getElementById('li3b-q4').value,
    document.getElementById('li3b-q5').value
  ];
  
  if (userAnswers.some(a => a === '')) {
    showFeedback('li3b-feedback', '<div class="feedback-partial">⚠️ Please match all children before checking!</div>');
    return;
  }
  
  const labels = ['Anna', 'Carlos', 'Lily', 'Max', 'Zoe'];
  const { correct, total, details } = gradeAnswers(userAnswers, ANSWERS.li3b);
  showFeedback('li3b-feedback', buildFeedback(correct, total, details, labels));
  
  state.scores.li3b = correct;
  
  if (!state.completedExercises['li3b']) {
    state.completedExercises['li3b'] = true;
    addStars(correct);
    if (correct === total) showCelebration('li3b', correct);
  }
  
  updateProgressBars();
}

function resetLI3b() {
  ['li3b-q1','li3b-q2','li3b-q3','li3b-q4','li3b-q5'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  showFeedback('li3b-feedback', '');
}

// ==================== LISTENING PART 4 - Emma's Party ====================

function submitLI4a() {
  const userAnswers = [
    getRadioValue('li4a-q1'),
    getRadioValue('li4a-q2'),
    getRadioValue('li4a-q3'),
    getRadioValue('li4a-q4'),
    getRadioValue('li4a-q5')
  ];
  
  if (userAnswers.some(a => a === null)) {
    showFeedback('li4a-feedback', '<div class="feedback-partial">⚠️ Please answer all questions before checking!</div>');
    return;
  }
  
  const { correct, total, details } = gradeAnswers(userAnswers, ANSWERS.li4a);
  
  // Highlight correct/wrong questions
  ['li4a-q1','li4a-q2','li4a-q3','li4a-q4','li4a-q5'].forEach((name, i) => {
    const container = document.getElementById(`${name}-container`);
    if (container) {
      container.classList.remove('correct', 'wrong');
      container.classList.add(details[i].isCorrect ? 'correct' : 'wrong');
    }
  });
  
  showFeedback('li4a-feedback', buildFeedback(correct, total, details));
  state.scores.li4a = correct;
  
  if (!state.completedExercises['li4a']) {
    state.completedExercises['li4a'] = true;
    addStars(correct);
    if (correct === total) showCelebration('li4a', correct);
  }
  
  updateProgressBars();
}

function resetLI4a() {
  document.querySelectorAll('input[name^="li4a-"]').forEach(r => r.checked = false);
  document.querySelectorAll('[id^="li4a-q"]').forEach(el => el.classList.remove('correct', 'wrong'));
  showFeedback('li4a-feedback', '');
}

// ==================== LISTENING PART 4 - School Trip ====================

function submitLI4b() {
  const userAnswers = [
    getRadioValue('li4b-q1'),
    getRadioValue('li4b-q2'),
    getRadioValue('li4b-q3'),
    getRadioValue('li4b-q4'),
    getRadioValue('li4b-q5')
  ];
  
  if (userAnswers.some(a => a === null)) {
    showFeedback('li4b-feedback', '<div class="feedback-partial">⚠️ Please answer all questions before checking!</div>');
    return;
  }
  
  const { correct, total, details } = gradeAnswers(userAnswers, ANSWERS.li4b);
  showFeedback('li4b-feedback', buildFeedback(correct, total, details));
  state.scores.li4b = correct;
  
  if (!state.completedExercises['li4b']) {
    state.completedExercises['li4b'] = true;
    addStars(correct);
    if (correct === total) showCelebration('li4b', correct);
  }
  
  updateProgressBars();
}

function resetLI4b() {
  document.querySelectorAll('input[name^="li4b-"]').forEach(r => r.checked = false);
  showFeedback('li4b-feedback', '');
}

// ==================== CELEBRATION ====================

function showCelebration(exerciseId, score) {
  const messages = {
    rw3:  { title: 'Amazing Reader!', msg: 'You got all answers right in the Watermelon exercise!', emoji: '🍉' },
    rw3b: { title: 'Spooky Smart!', msg: 'Perfect score on the Scary Story exercise!', emoji: '👻' },
    rw4a: { title: 'Duck Expert!', msg: 'You know everything about ducks! Perfect score!', emoji: '🦆' },
    rw4b: { title: 'Whale Champion!', msg: 'Perfect score on Whales! You\'re incredible!', emoji: '🐋' },
    rw7:  { title: 'Story Star!', msg: 'What a fantastic story you wrote! Keep it up!', emoji: '📖' },
    li3:  { title: 'Super Listener!', msg: 'You matched everyone correctly! Perfect listening!', emoji: '🎧' },
    li3b: { title: 'Hobby Hero!', msg: 'All hobbies matched perfectly! Amazing!', emoji: '🏆' },
    li4a: { title: 'Party Planner!', msg: 'You remembered everything about Emma\'s party!', emoji: '🎂' },
    li4b: { title: 'Trip Expert!', msg: 'Perfect score on the school trip! Brilliant!', emoji: '🚌' }
  };
  
  const data = messages[exerciseId] || { title: 'Excellent!', msg: 'Fantastic work!', emoji: '🌟' };
  
  document.getElementById('celebrateEmoji').textContent = data.emoji;
  document.getElementById('celebrateTitle').textContent = data.title;
  document.getElementById('celebrateMsg').textContent = data.msg;
  document.getElementById('starsEarned').textContent = '⭐'.repeat(Math.min(score, 5));
  
  document.getElementById('celebration').style.display = 'flex';
  
  // Launch confetti
  launchConfetti();
}

function closeCelebration() {
  document.getElementById('celebration').style.display = 'none';
  // Remove confetti
  document.querySelectorAll('.confetti-piece').forEach(c => c.remove());
}

function launchConfetti() {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A29BFE', '#FD79A8', '#74B9FF', '#55EFC4', '#FDCB6E'];
  
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}vw;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${2 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

// ==================== PROGRESS & ACHIEVEMENTS ====================

function updateProgressBars() {
  const sections = [
    { id: 'rw3', scores: [state.scores.rw3, state.scores.rw3b], max: 10 },
    { id: 'rw4', scores: [state.scores.rw4a, state.scores.rw4b], max: 10 },
    { id: 'rw7', scores: [state.scores.rw7 ? 5 : 0], max: 5 },
    { id: 'li3', scores: [state.scores.li3, state.scores.li3b], max: 10 },
    { id: 'li4', scores: [state.scores.li4a, state.scores.li4b], max: 10 }
  ];
  
  sections.forEach(s => {
    const total = s.scores.reduce((a, b) => a + (b || 0), 0);
    const pct = Math.round((total / s.max) * 100);
    
    const bar = document.getElementById(`prog-${s.id}`);
    const label = document.getElementById(`prog-${s.id}-label`);
    
    if (bar) bar.style.width = pct + '%';
    if (label) {
      if (pct === 0) label.textContent = 'Not started';
      else if (pct < 60) label.textContent = `${pct}% — Keep going! 💪`;
      else if (pct < 100) label.textContent = `${pct}% — Almost there! ⭐`;
      else label.textContent = `100% — Completed! 🏆`;
    }
  });
}

function updateProgressPage() {
  const bigNum = document.getElementById('bigStarCount');
  if (bigNum) bigNum.textContent = state.stars;
  updateProgressBars();
}

function checkAchievements() {
  // First star
  if (state.stars >= 1) unlockBadge('badge-first');
  // Reader: completed reading exercises
  if (state.completedExercises['rw3'] || state.completedExercises['rw4a']) unlockBadge('badge-reader');
  // Listener: completed listening exercises
  if (state.completedExercises['li3'] || state.completedExercises['li4a']) unlockBadge('badge-listener');
  // Writer: wrote a story
  if (state.completedExercises['rw7']) unlockBadge('badge-writer');
  // Perfect: got 5/5 on any exercise
  const scores = Object.values(state.scores).filter(s => typeof s === 'number');
  if (scores.some(s => s === 5)) unlockBadge('badge-perfect');
  // Champion: completed all exercise types
  const allTypes = ['rw3', 'rw4a', 'rw7', 'li3', 'li4a'];
  if (allTypes.every(t => state.completedExercises[t])) unlockBadge('badge-champ');
}

function unlockBadge(id) {
  const badge = document.getElementById(id);
  if (badge && badge.classList.contains('locked')) {
    badge.classList.remove('locked');
    badge.style.animation = 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
  }
}

function resetAll() {
  if (!confirm('Are you sure you want to reset all progress? 🤔')) return;
  
  state.stars = 0;
  state.completedExercises = {};
  Object.keys(state.scores).forEach(k => state.scores[k] = typeof state.scores[k] === 'boolean' ? false : 0);
  
  document.getElementById('totalStars').textContent = '0';
  updateGlobalProgress();
  updateProgressBars();
  
  // Reset badges
  document.querySelectorAll('.badge-item').forEach(b => b.classList.add('locked'));
  
  alert('Progress reset! Time to practice again! 💪🦋');
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get value of a radio button group
 */
function getRadioValue(name) {
  const radios = document.querySelectorAll(`input[name="${name}"]`);
  for (const radio of radios) {
    if (radio.checked) return radio.value;
  }
  return null;
}

/**
 * Show feedback in an element
 */
function showFeedback(elementId, html) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = html;
    if (html) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// ==================== INIT & EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', () => {
  // Show home section by default
  showSection('home');
  
  // Mascot click
  const mascot = document.getElementById('mascot');
  if (mascot) {
    mascot.addEventListener('click', () => {
      rotateMascotMessage();
      const bubble = document.getElementById('mascotBubble');
      if (bubble) bubble.style.display = 'block';
    });
  }
  
  // Mascot auto-message every 30 seconds
  setInterval(() => {
    rotateMascotMessage();
  }, 30000);
  
  // Preload voices (needed on some browsers)
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      const voices = window.speechSynthesis.getVoices();
      const enVoices = voices.filter(v => v.lang.startsWith('en'));
      const statusEl = document.getElementById('ttsStatus');
      if (statusEl) {
        statusEl.innerHTML = enVoices.length > 0
          ? ` ✅ ${enVoices.length} English voice${enVoices.length > 1 ? 's' : ''} found — audio is ready!`
          : ' ⚠️ No English voices found. Try Chrome.';
      }
    };
  } else {
    const note = document.getElementById('browserNote');
    if (note) {
      note.style.background = 'linear-gradient(135deg, #ffe0e0, #ffd0d0)';
      note.style.borderColor = '#FF6B6B';
      note.innerHTML = '<span style="font-size:1.6rem">⚠️</span><div><strong>Audio not supported.</strong> Please open this page in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> to use the listening exercises.</div>';
    }
  }

  // Keyboard shortcut: Escape closes celebration
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCelebration();
  });
  
  // Click outside celebration box to close
  document.getElementById('celebration').addEventListener('click', function(e) {
    if (e.target === this) closeCelebration();
  });
  
  // Add hover animations to radio options
  document.querySelectorAll('.radio-opt').forEach(opt => {
    opt.addEventListener('change', () => {
      opt.style.transform = 'scale(1.05)';
      setTimeout(() => opt.style.transform = '', 200);
    });
  });
  
  // Add pulse on MCQ selection
  document.querySelectorAll('.mcq-opt input').forEach(radio => {
    radio.addEventListener('change', () => {
      const parent = radio.closest('.mcq-options');
      if (parent) {
        parent.querySelectorAll('.mcq-opt').forEach(opt => {
          opt.style.borderColor = 'transparent';
          opt.style.background = 'white';
        });
        const label = radio.closest('.mcq-opt');
        if (label) {
          label.style.borderColor = 'var(--secondary)';
          label.style.background = 'rgba(78,205,196,0.15)';
        }
      }
    });
  });
  
  console.log('🦋 Flyers Fun! loaded successfully. Ready to study Cambridge A2 Flyers!');
});

// ==================== SMOOTH SCROLL FOR ANCHORS ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
  });
});
