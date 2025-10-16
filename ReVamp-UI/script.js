// Nav toggle for mobile
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('show');
  });
}

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href') || '';
    if (targetId.length > 1) {
      e.preventDefault();
      const el = document.querySelector(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (navLinks.classList.contains('show')) {
        navLinks.classList.remove('show');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });
});

// Demo buttons alerts
document.querySelectorAll('[data-alert]').forEach(btn => {
  btn.addEventListener('click', () => {
    const message = btn.getAttribute('data-alert') || 'Coming soon';
    alert(message);
  });
});

// Contact form submit
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = /** @type {HTMLInputElement} */ (document.getElementById('name'))?.value.trim();
    const email = /** @type {HTMLInputElement} */ (document.getElementById('email'))?.value.trim();
    const message = /** @type {HTMLTextAreaElement} */ (document.getElementById('message'))?.value.trim();
    if (!name || !email || !message) {
      alert('Please fill in all fields.');
      return;
    }
    alert('Form submitted successfully');
    contactForm.reset();
  });
}

// FAQ accordion
document.querySelectorAll('.accordion-header').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.accordion-item');
    if (!item) return;
    item.classList.toggle('open');
  });
});

// Chatbot interactions
const chatToggle = document.getElementById('chatToggle');
const chatClose = document.getElementById('chatClose');
const chatbot = document.getElementById('chatbot');
const chatBody = document.getElementById('chatBody');
const chatForm = document.getElementById('chatForm');
const chatMessage = document.getElementById('chatMessage');

function appendMessage(text, role = 'bot') {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function findFaqAnswer(q) {
  const query = q.toLowerCase();
  const pairs = [
    ['what is revamp', 'ReVamp uses AI to guide reuse, repair, and recycle decisions.'],
    ['ai', 'Our AI analyzes item condition and context to suggest the best sustainable path.'],
    ['available', 'We are expanding across India with partners for repairs, pickups, and recycling.'],
    ['rewards', 'Yes! Earn credits for sustainable actions and redeem with partner brands.'],
    ['co2', 'We estimate CO₂ savings based on item type and chosen action.'],
    ['contact', 'Use the form in the Contact section; we will get back ASAP.']
  ];
  const match = pairs.find(([k]) => query.includes(k));
  return match ? match[1] : "I'm not sure yet. Please check the FAQs or describe more.";
}

if (chatToggle && chatbot) {
  chatToggle.addEventListener('click', () => {
    chatbot.hidden = !chatbot.hidden;
    if (!chatbot.hidden) {
      setTimeout(() => chatMessage?.focus(), 0);
    }
  });
}
if (chatClose && chatbot) {
  chatClose.addEventListener('click', () => { chatbot.hidden = true; });
}
if (chatForm) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatMessage.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    const answer = findFaqAnswer(text);
    setTimeout(() => appendMessage(answer, 'bot'), 300);
    chatMessage.value = '';
  });
}


