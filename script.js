const windowContainer = document.getElementById('window-container');
const hiddenInput = document.getElementById('hidden-input');
const visualInput = document.getElementById('visual-input');
const history = document.getElementById('history');
const terminal = document.getElementById('terminal');
const fileIcon = document.querySelector('.file-icon');
const closeBtn = document.querySelector('.close-btn');

let isTyping = false;
const emailUser = 'me';
const emailDomain = 'shayan';
const emailTld = 'it';
const linkedinUrl = 'https://www.linkedin.com/in/shayanit/';

// Updated CV Text using your provided copy
const cvText = `SHAYAN TAGHINEZHAD
AI Application Engineer

AI Application Engineer with experience in Python and
JavaScript development. Holds a Master's degree in
Computer Engineering, with expertise in building
full-stack and AI software solutions. Passionate about
designing scalable, efficient, and optimized systems to
address real-world challenges.`;

// --- Window Controls ---
function closeTerminal() {
  document.body.classList.remove('terminal-open');
  windowContainer.style.display = 'none';
}

async function openFile() {
  document.body.classList.add('terminal-open');
  windowContainer.style.display = 'flex';
  focusTerminal();

  if (history.children.length === 0 && !isTyping) {
    await simulateTypingCommand('cat cv.txt');
  }
}

async function simulateTypingCommand(cmd) {
  hiddenInput.disabled = true;
  isTyping = true;

  await new Promise(r => setTimeout(r, 400));

  for (let i = 0; i < cmd.length; i++) {
    visualInput.textContent += cmd[i];
    await new Promise(r => setTimeout(r, Math.random() * 50 + 30));
  }

  await new Promise(r => setTimeout(r, 200));

  hiddenInput.value = cmd;
  isTyping = false;
  hiddenInput.disabled = false;

  const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
  hiddenInput.dispatchEvent(enterEvent);
}

// --- Terminal Logic ---
hiddenInput.addEventListener('input', () => {
  if (!isTyping) {
    visualInput.textContent = hiddenInput.value;
    terminal.scrollTop = terminal.scrollHeight;
  }
});

hiddenInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && !isTyping) {
    const command = hiddenInput.value.trim();

    if (command === "") return;

    const commandEcho = document.createElement('div');
    commandEcho.className = 'line';
    commandEcho.innerHTML = `<span class="prompt-prefix">guest@ubuntu:~$</span> <span style="user-select: text;">${escapeHTML(hiddenInput.value)}</span>`;
    history.appendChild(commandEcho);

    const response = document.createElement('div');
    response.className = 'line';
    history.appendChild(response);

    hiddenInput.value = '';
    visualInput.textContent = '';

    let textToType = '';
    let appendEmailLink = false;
    if (command === 'cat cv.txt') {
      textToType = `${cvText}\n\nEmail: `;
      response.style.color = "var(--text-color)";
      appendEmailLink = true;
    } else {
      textToType = `command not found: ${command}\nDid you mean "cat cv.txt"?`;
      response.style.color = "var(--error-color)";
    }

    await typeOutText(response, textToType);
    if (appendEmailLink) {
      response.appendChild(buildEmailLink());
      response.appendChild(document.createTextNode('\nLinkedin: '));
      response.appendChild(buildLinkedinLink());
      terminal.scrollTop = terminal.scrollHeight;
    }
  }
});

async function typeOutText(element, text) {
  isTyping = true;
  terminal.classList.add('typing-in-progress');
  hiddenInput.disabled = true;

  const typingSpeed = 5;

  for (let i = 0; i < text.length; i++) {
    element.textContent += text.charAt(i);
    terminal.scrollTop = terminal.scrollHeight;

    if (text.charAt(i) === '\n') {
      await new Promise(r => setTimeout(r, typingSpeed * 10));
    } else {
      await new Promise(r => setTimeout(r, typingSpeed));
    }
  }

  isTyping = false;
  hiddenInput.disabled = false;
  terminal.classList.remove('typing-in-progress');
  hiddenInput.focus();
  terminal.scrollTop = terminal.scrollHeight;
}

function focusTerminal() {
  if (!isTyping && windowContainer.style.display !== 'none') {
    hiddenInput.focus();
  }
}

function isMobileView() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function syncLayoutWithViewport() {
  if (isMobileView()) {
    windowContainer.style.display = document.body.classList.contains('terminal-open') ? 'flex' : 'none';
    return;
  }

  document.body.classList.add('terminal-open');
  windowContainer.style.display = 'flex';
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildEmailLink() {
  const email = `${emailUser}@${emailDomain}.${emailTld}`;
  const link = document.createElement('a');
  link.href = `mailto:${email}`;
  link.textContent = `${emailUser} [at] ${emailDomain} [dot] ${emailTld}`;
  link.style.color = 'var(--prompt-color)';
  link.style.textDecoration = 'underline';
  link.style.userSelect = 'text';
  return link;
}

function buildLinkedinLink() {
  const link = document.createElement('a');
  link.href = linkedinUrl;
  link.textContent = linkedinUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.color = 'var(--prompt-color)';
  link.style.textDecoration = 'underline';
  link.style.userSelect = 'text';
  return link;
}

function bindUiHandlers() {
  if (fileIcon) {
    fileIcon.addEventListener('click', () => {
      openFile();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeTerminal();
    });
  }

  terminal.addEventListener('click', () => {
    focusTerminal();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  bindUiHandlers();
  syncLayoutWithViewport();
  if (!isMobileView()) {
    hiddenInput.focus();
  }
});

window.addEventListener('resize', syncLayoutWithViewport);

