/**
 * Interactive terminal portfolio — simplified single-window UI.
 * Desktop: Terminal (open shell) and info (open shell + neofetch).
 */

// =============================================================================
// Configuration & profile (neofetch banner)
// =============================================================================

const emailUser = 'me';
const emailDomain = 'shayan';
const emailTld = 'it';

const profile = JSON.parse(document.getElementById('profile-data').textContent);

/** Hostname line shown at top of neofetch output. */
function getHostLine() {
  return `${emailUser}@${emailDomain}.${emailTld}`;
}

/** Multi-line system info block for the neofetch command. */
function buildNeofetchBanner() {
  return `${getHostLine()}
------------------
Role: ${profile.role}
Location: ${profile.location}
Stack: ${profile.stack}
Education: ${profile.education}`;
}

const NEOFETCH_BANNER = buildNeofetchBanner();

const COMMAND_HELP = `Available commands:
  help        Show this help message
  clear       Clear terminal history
  whoami      Print current user
  date        Print system date and time
  neofetch    Display system info
  rm -rf /    Remove everything`;

// =============================================================================
// DOM references
// =============================================================================

const terminalShell = document.getElementById('terminal-shell');
const terminalTitleBar = document.getElementById('terminal-title-bar');
const terminalCloseBtn = terminalShell?.querySelector('.close-btn');
const terminalShortcut = document.getElementById('terminal-shortcut');
const infoShortcut = document.getElementById('info-shortcut');
const hiddenInput = document.getElementById('hidden-input');
const visualInput = document.getElementById('visual-input');
const historyEl = document.getElementById('history');
const terminal = document.getElementById('terminal');
const blackout = document.getElementById('blackout');

// Layout constants for centering and drag clamping
const TITLE_BAR_HEIGHT = 35;
const DEFAULT_SHELL_WIDTH = 700;
const DEFAULT_SHELL_HEIGHT_RATIO = 0.65;

/** True when viewport is treated as mobile (full-screen terminal, no drag). */
function isMobileView() {
  return window.matchMedia('(max-width: 768px)').matches;
}

/** Usable desktop area for positioning the terminal window. */
function getViewportBounds() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

// =============================================================================
// Terminal window visibility
// =============================================================================

let hasBeenOpened = false;

function isTerminalOpen() {
  return terminalShell && !terminalShell.classList.contains('is-hidden');
}

/** Focus the hidden input when the terminal is open and input is enabled. */
function focusTerminal() {
  if (isTerminalOpen() && !hiddenInput.disabled) {
    hiddenInput.focus();
  }
}

/** Sync body class on mobile so desktop icons hide while terminal is open. */
function syncMobileBodyClass() {
  if (!isMobileView()) {
    document.body.classList.remove('terminal-open');
    return;
  }
  document.body.classList.toggle('terminal-open', isTerminalOpen());
}

/** Center the shell on first open (desktop only; mobile uses CSS full-screen). */
function centerTerminalShell() {
  if (isMobileView() || !terminalShell) return;

  const bounds = getViewportBounds();
  const width = Math.min(DEFAULT_SHELL_WIDTH, bounds.width - 40);
  const height = Math.min(bounds.height * DEFAULT_SHELL_HEIGHT_RATIO, bounds.height - 40);
  const left = (bounds.width - width) / 2;
  const top = (bounds.height - height) / 2;

  terminalShell.style.left = `${left}px`;
  terminalShell.style.top = `${top}px`;
  terminalShell.style.width = `${width}px`;
  terminalShell.style.height = `${height}px`;
}

/** Keep dragged window at least partially on screen. */
function ensureTerminalOnScreen() {
  if (isMobileView() || !terminalShell || !isTerminalOpen()) return;

  const rect = terminalShell.getBoundingClientRect();
  const bounds = getViewportBounds();
  let left = rect.left;
  let top = rect.top;

  left = Math.max(-rect.width + 80, Math.min(left, bounds.width - 80));
  top = Math.max(0, Math.min(top, bounds.height - TITLE_BAR_HEIGHT));

  terminalShell.style.left = `${left}px`;
  terminalShell.style.top = `${top}px`;
}

/** Show terminal; center on first open. Does not run any command. */
function openTerminal() {
  if (!terminalShell) return;

  if (!isTerminalOpen()) {
    terminalShell.classList.remove('is-hidden');
    if (!hasBeenOpened) {
      centerTerminalShell();
      hasBeenOpened = true;
    }
    syncMobileBodyClass();
  }

  focusTerminal();
}

/** Hide terminal window. */
function closeTerminal() {
  if (!terminalShell) return;

  terminalShell.classList.add('is-hidden');
  syncMobileBodyClass();
}

/** Open terminal if needed, then run neofetch (used by info shortcut). */
function openTerminalWithNeofetch() {
  openTerminal();
  runTerminalCommand('neofetch');
}

// =============================================================================
// Title bar drag (desktop only)
// =============================================================================

function bindTerminalDrag() {
  if (!terminalTitleBar || !terminalShell) return;

  terminalTitleBar.addEventListener('pointerdown', (e) => {
    if (isMobileView()) return;
    if (e.target.closest('.window-controls')) return;

    e.preventDefault();

    const rect = terminalShell.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    terminalShell.classList.add('is-dragging');
    terminalTitleBar.setPointerCapture(e.pointerId);

    const onMove = (ev) => {
      const bounds = getViewportBounds();
      let left = ev.clientX - offsetX;
      let top = ev.clientY - offsetY;
      left = Math.max(-rect.width + 80, Math.min(left, bounds.width - 80));
      top = Math.max(0, Math.min(top, bounds.height - TITLE_BAR_HEIGHT));
      terminalShell.style.left = `${left}px`;
      terminalShell.style.top = `${top}px`;
    };

    const onUp = (ev) => {
      terminalTitleBar.releasePointerCapture(ev.pointerId);
      terminalShell.classList.remove('is-dragging');
      terminalTitleBar.removeEventListener('pointermove', onMove);
      terminalTitleBar.removeEventListener('pointerup', onUp);
      terminalTitleBar.removeEventListener('pointercancel', onUp);
    };

    terminalTitleBar.addEventListener('pointermove', onMove);
    terminalTitleBar.addEventListener('pointerup', onUp);
    terminalTitleBar.addEventListener('pointercancel', onUp);
  });
}

// =============================================================================
// Command resolution (six commands only)
// =============================================================================

function resolveCommand(input) {
  const cmd = input.trim();

  if (cmd === 'clear') {
    return { action: 'clear' };
  }

  if (cmd === 'rm -rf /') {
    return { action: 'blackout' };
  }

  const commands = {
    help: { text: COMMAND_HELP, style: 'normal' },
    whoami: { text: 'guest', style: 'normal' },
    date: { text: new Date().toString(), style: 'normal' },
    neofetch: { text: NEOFETCH_BANNER, style: 'normal' },
  };

  if (commands[cmd]) {
    return commands[cmd];
  }

  return {
    text: `command not found: ${cmd}\nType 'help' for available commands.`,
    style: 'error',
  };
}

function applyResponseStyle(element, style) {
  element.style.color = style === 'error' ? 'var(--error-color)' : 'var(--text-color)';
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Scroll terminal output to the bottom. */
function scrollTerminalToBottom() {
  terminal.scrollTop = terminal.scrollHeight;
}

/**
 * Execute a command: echo input line, run handler, print output instantly.
 * @param {string} command - Trimmed command string
 * @param {string} [rawInput] - Original input (for history echo)
 */
function runTerminalCommand(command, rawInput = command) {
  if (command === '') return;

  const commandEcho = document.createElement('div');
  commandEcho.className = 'line';
  commandEcho.innerHTML = `<span class="prompt-prefix">guest@ubuntu:~$</span> <span style="user-select: text;">${escapeHTML(rawInput)}</span>`;
  historyEl.appendChild(commandEcho);

  hiddenInput.value = '';
  visualInput.textContent = '';

  const result = resolveCommand(command);

  if (result.action === 'clear') {
    historyEl.replaceChildren();
    scrollTerminalToBottom();
    focusTerminal();
    return;
  }

  if (result.action === 'blackout') {
    blackout?.classList.remove('is-hidden');
    blackout?.setAttribute('aria-hidden', 'false');
    hiddenInput.disabled = true;
    return;
  }

  const response = document.createElement('div');
  response.className = 'line';
  response.textContent = result.text;
  applyResponseStyle(response, result.style);
  historyEl.appendChild(response);

  scrollTerminalToBottom();
  focusTerminal();
}

// =============================================================================
// Input handling
// =============================================================================

function bindTerminalInput() {
  hiddenInput.addEventListener('input', () => {
    visualInput.textContent = hiddenInput.value;
    scrollTerminalToBottom();
  });

  hiddenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !hiddenInput.disabled) {
      const rawInput = hiddenInput.value;
      const command = rawInput.trim();
      if (command === '') return;
      runTerminalCommand(command, rawInput);
    }
  });

  terminal?.addEventListener('click', () => {
    focusTerminal();
  });
}

// =============================================================================
// Desktop shortcuts & window chrome
// =============================================================================

function bindDesktopIcons() {
  terminalShortcut?.addEventListener('click', () => {
    if (isTerminalOpen()) {
      focusTerminal();
    } else {
      openTerminal();
    }
  });

  infoShortcut?.addEventListener('click', () => {
    openTerminalWithNeofetch();
  });
}

function bindTerminalClose() {
  terminalCloseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTerminal();
  });
}

function onViewportResize() {
  if (isMobileView()) return;
  if (isTerminalOpen() && hasBeenOpened) {
    ensureTerminalOnScreen();
  }
}

// =============================================================================
// Desktop wallpaper (Trianglify: Canonical Aubergine → Toledo)
// =============================================================================

const DESKTOP_WALLPAPER_COLORS = ['#772953', '#2C001E'];
let desktopWallpaperResizeTimer;

function renderDesktopWallpaper() {
  const container = document.getElementById('desktop-wallpaper');
  if (!container || typeof trianglify !== 'function') return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pattern = trianglify({
    width,
    height,
    cellSize: Math.round(Math.min(width, height) / 14),
    variance: 0.75,
    xColors: DESKTOP_WALLPAPER_COLORS,
    yColors: 'match',
  });

  container.replaceChildren(pattern.toCanvas());
}

function initDesktopWallpaper() {
  renderDesktopWallpaper();
  window.addEventListener('resize', () => {
    clearTimeout(desktopWallpaperResizeTimer);
    desktopWallpaperResizeTimer = setTimeout(renderDesktopWallpaper, 150);
  });
}

// =============================================================================
// Init — terminal hidden on load (desktop and mobile)
// =============================================================================

initDesktopWallpaper();
bindDesktopIcons();
bindTerminalClose();
bindTerminalDrag();
bindTerminalInput();
window.addEventListener('resize', onViewportResize);
