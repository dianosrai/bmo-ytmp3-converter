// Elements
const youtubeUrlInput = document.getElementById('youtube-url');
const clearBtn = document.getElementById('clear-btn');
const selectedPathDiv = document.getElementById('selected-path');
const convertBtn = document.getElementById('convert-btn');
const progressContainer = document.getElementById('progress-container');
const progressStatus = document.getElementById('progress-status');
const progressPercent = document.getElementById('progress-percent');
const progressBarFill = document.getElementById('progress-bar-fill');
const logConsole = document.getElementById('log-console');
const clearLogsBtn = document.getElementById('clear-logs-btn');
const openFolderBtn = document.getElementById('open-folder-btn');
const cancelBtn = document.getElementById('cancel-btn');
const closeBtn = document.getElementById('close-btn');
const minimizeBtn = document.getElementById('minimize-btn');
const themeBtn = document.getElementById('theme-btn');

// Theme Switcher System
const themes = [
  {
    bodyBg: 'rgba(177, 215, 204, 0.9)',
    bodyBorder: '#697D77',
    windowHeaderBorder: 'rgba(105, 125, 119, 0.27)',
    inputBg: 'rgba(231, 248, 243, 0.9)',
    inputHoverBg: 'rgba(214, 242, 234, 0.9)',
    progressTrackBg: '#FFFFFF',
    progressFillDownloading: 'rgba(145, 175, 166, 1)',
    progressFillConverting: 'rgba(115, 165, 150, 1)',
    progressFillDone: 'rgba(49, 139, 140, 1)',
    progressFillError: 'rgba(207, 66, 111, 1)',
    labelColor: '#556c64'
  },
  {
    bodyBg: 'rgba(174, 228, 147, 0.9)',
    bodyBorder: 'rgba(100, 140, 80, 1)',
    windowHeaderBorder: 'rgba(100, 140, 80, 0.27)',
    inputBg: 'rgba(220, 245, 210, 0.9)',
    inputHoverBg: 'rgba(205, 240, 190, 0.9)',
    progressTrackBg: '#FFFFFF',
    progressFillDownloading: 'rgba(140, 180, 120, 1)',
    progressFillConverting: 'rgba(110, 175, 85, 1)',
    progressFillDone: 'rgba(70, 150, 50, 1)',
    progressFillError: 'rgba(220, 80, 100, 1)',
    labelColor: '#4B6638'
  },
  {
    bodyBg: 'rgba(253, 240, 128, 0.9)',
    bodyBorder: 'rgba(165, 155, 75, 1)',
    windowHeaderBorder: 'rgba(165, 155, 75, 0.27)',
    inputBg: 'rgba(255, 252, 215, 0.9)',
    inputHoverBg: 'rgba(255, 249, 190, 0.9)',
    progressTrackBg: '#FFFFFF',
    progressFillDownloading: 'rgba(210, 200, 110, 1)',
    progressFillConverting: 'rgba(225, 210, 70, 1)',
    progressFillDone: 'rgba(185, 165, 45, 1)',
    progressFillError: 'rgba(220, 100, 90, 1)',
    labelColor: '#7A702D'
  },
  {
    bodyBg: 'rgba(255, 175, 175, 0.9)',
    bodyBorder: 'rgba(165, 105, 105, 1)',
    windowHeaderBorder: 'rgba(165, 105, 105, 0.27)',
    inputBg: 'rgba(255, 225, 225, 0.9)',
    inputHoverBg: 'rgba(255, 210, 210, 0.9)',
    progressTrackBg: '#FFFFFF',
    progressFillDownloading: 'rgba(220, 140, 140, 1)',
    progressFillConverting: 'rgba(225, 120, 120, 1)',
    progressFillDone: 'rgba(200, 80, 80, 1)',
    progressFillError: 'rgba(230, 60, 60, 1)',
    labelColor: '#7F4848'
  },
  {
    bodyBg: 'rgba(152, 234, 240, 0.9)',
    bodyBorder: 'rgba(90, 150, 155, 1)',
    windowHeaderBorder: 'rgba(90, 150, 155, 0.27)',
    inputBg: 'rgba(215, 249, 252, 0.9)',
    inputHoverBg: 'rgba(195, 244, 248, 0.9)',
    progressTrackBg: '#FFFFFF',
    progressFillDownloading: 'rgba(125, 190, 195, 1)',
    progressFillConverting: 'rgba(90, 175, 182, 1)',
    progressFillDone: 'rgba(50, 145, 152, 1)',
    progressFillError: 'rgba(210, 90, 120, 1)',
    labelColor: '#3C6D72'
  },
  {
    bodyBg: 'rgba(177, 204, 238, 0.9)',
    bodyBorder: 'rgba(105, 125, 155, 1)',
    windowHeaderBorder: 'rgba(105, 125, 155, 0.27)',
    inputBg: 'rgba(225, 238, 255, 0.9)',
    inputHoverBg: 'rgba(210, 228, 255, 0.9)',
    progressTrackBg: '#FFFFFF',
    progressFillDownloading: 'rgba(145, 170, 205, 1)',
    progressFillConverting: 'rgba(115, 145, 185, 1)',
    progressFillDone: 'rgba(62, 135, 187, 1)',
    progressFillError: 'rgba(210, 95, 125, 1)',
    labelColor: '#495B75'
  },
  {
    bodyBg: 'rgba(211, 192, 242, 0.9)',
    bodyBorder: 'rgba(130, 115, 160, 1)',
    windowHeaderBorder: 'rgba(130, 115, 160, 0.27)',
    inputBg: 'rgba(240, 232, 255, 0.9)',
    inputHoverBg: 'rgba(230, 218, 255, 0.9)',
    progressTrackBg: '#FFFFFF',
    progressFillDownloading: 'rgba(175, 155, 210, 1)',
    progressFillConverting: 'rgba(150, 125, 195, 1)',
    progressFillDone: 'rgba(115, 85, 170, 1)',
    progressFillError: 'rgba(215, 90, 130, 1)',
    labelColor: '#625180'
  },
  {
    bodyBg: 'rgba(242, 192, 204, 0.9)',
    bodyBorder: 'rgba(160, 115, 125, 1)',
    windowHeaderBorder: 'rgba(160, 115, 125, 0.27)',
    inputBg: 'rgba(255, 232, 238, 0.9)',
    inputHoverBg: 'rgba(255, 220, 228, 0.9)',
    progressTrackBg: '#FFFFFF',
    progressFillDownloading: 'rgba(205, 155, 168, 1)',
    progressFillConverting: 'rgba(195, 130, 148, 1)',
    progressFillDone: 'rgba(170, 90, 110, 1)',
    progressFillError: 'rgba(220, 80, 110, 1)',
    labelColor: '#7D515B'
  },
  {
    bodyBg: 'rgba(246, 200, 176, 0.9)',
    bodyBorder: 'rgba(165, 125, 105, 1)',
    windowHeaderBorder: 'rgba(165, 125, 105, 0.27)',
    inputBg: 'rgba(255, 238, 225, 0.9)',
    inputHoverBg: 'rgba(255, 225, 208, 0.9)',
    progressTrackBg: '#FFFFFF',
    progressFillDownloading: 'rgba(210, 165, 140, 1)',
    progressFillConverting: 'rgba(195, 140, 110, 1)',
    progressFillDone: 'rgba(175, 110, 75, 1)',
    progressFillError: 'rgba(220, 95, 95, 1)',
    labelColor: '#7F5B47'
  }
];

let currentThemeIndex = 0;

function applyTheme(index) {
  const theme = themes[index];
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--body-bg', theme.bodyBg);
  root.style.setProperty('--body-border', theme.bodyBorder);
  root.style.setProperty('--window-header-border', theme.windowHeaderBorder);
  root.style.setProperty('--input-bg', theme.inputBg);
  root.style.setProperty('--input-hover-bg', theme.inputHoverBg);
  root.style.setProperty('--progress-track-bg', theme.progressTrackBg);
  root.style.setProperty('--progress-fill-downloading', theme.progressFillDownloading);
  root.style.setProperty('--progress-fill-converting', theme.progressFillConverting);
  root.style.setProperty('--progress-fill-done', theme.progressFillDone);
  root.style.setProperty('--progress-fill-error', theme.progressFillError);
  root.style.setProperty('--label-color', theme.labelColor);
}

// Load theme preference from localStorage on start
try {
  const savedThemeIndex = localStorage.getItem('theme-index');
  if (savedThemeIndex !== null) {
    const parsed = parseInt(savedThemeIndex, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < themes.length) {
      currentThemeIndex = parsed;
    }
  }
} catch (e) {
  console.error('Failed to load theme preference:', e);
}
applyTheme(currentThemeIndex);

themeBtn.addEventListener('click', () => {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  applyTheme(currentThemeIndex);
  try {
    localStorage.setItem('theme-index', currentThemeIndex);
  } catch (e) {
    console.error('Failed to save theme preference:', e);
  }
});

let targetDirectory = '';
let isProcessing = false;
let lastCreatedFile = '';

// Check inputs to toggle the convert button
function validateInputs() {
  const url = youtubeUrlInput.value.trim();
  const hasUrl = url.length > 0;
  const hasDir = targetDirectory.length > 0;
  
  convertBtn.disabled = !hasUrl || !hasDir || isProcessing;
}

// Mascot reference for talking animation
const mascotContainer = document.querySelector('.mascot-container');
let logQueue = [];
let isTyping = false;

function processLogQueue() {
  if (isTyping || logQueue.length === 0) return;
  
  isTyping = true;
  mascotContainer.classList.add('talking');
  
  const { message, type } = logQueue.shift();
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  logConsole.appendChild(line);
  
  let index = 0;
  const speed = 35; // comfortable typing speed in ms
  
  function typeChar() {
    if (index < message.length) {
      line.textContent += message.charAt(index);
      index++;
      logConsole.scrollTop = logConsole.scrollHeight;
      setTimeout(typeChar, speed);
    } else {
      isTyping = false;
      mascotContainer.classList.remove('talking');
      processLogQueue();
    }
  }
  
  typeChar();
}

// Log utility
function appendLog(message, type = 'info') {
  // Update downloading and converting progress logs instantly to prevent backlog/lags
  if (message.startsWith('Downloading') || message.startsWith('Converting') || message.includes('%') || message.startsWith('Target Title:')) {
    const lastLine = logConsole.lastElementChild;
    const prefix = message.startsWith('Downloading engine:') ? 'Downloading engine:' : 
                   message.startsWith('Downloading:') ? 'Downloading:' : 
                   message.startsWith('Target Title:') ? 'Target Title:' : 'Converting';
    
    if (lastLine && lastLine.textContent.startsWith(prefix)) {
      lastLine.textContent = message;
      lastLine.className = `log-line ${type}`;
      return;
    }
    
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = message;
    logConsole.appendChild(line);
    logConsole.scrollTop = logConsole.scrollHeight;
    return;
  }
  
  // Queue other logs for character-by-character typing animation
  logQueue.push({ message, type });
  processLogQueue();
}

// Select Save Directory
selectedPathDiv.addEventListener('click', async () => {
  if (isProcessing) return;
  
  appendLog('[System] Selecting destination folder...', 'system');
  const directory = await window.api.selectDirectory();
  
  if (directory) {
    targetDirectory = directory;
    selectedPathDiv.textContent = directory;
    selectedPathDiv.title = directory;
    appendLog(`[System] Destination folder selected: "${directory}"`, 'system');
  } else {
    appendLog('[System] Folder selection cancelled.', 'system');
  }
  validateInputs();
});

// Input Handlers
youtubeUrlInput.addEventListener('input', () => {
  validateInputs();
});

clearBtn.addEventListener('click', () => {
  if (isProcessing) return;
  youtubeUrlInput.value = '';
  validateInputs();
});

clearLogsBtn.addEventListener('click', () => {
  logConsole.innerHTML = '<div class="log-line system">[System] Logs cleared.</div>';
});

closeBtn.addEventListener('click', () => {
  window.api.closeWindow();
});

minimizeBtn.addEventListener('click', () => {
  window.api.minimizeWindow();
});

// Open folder after successful download
openFolderBtn.addEventListener('click', () => {
  if (lastCreatedFile) {
    window.api.showItemInFolder(lastCreatedFile);
  }
});

// Convert Button Handler
convertBtn.addEventListener('click', async () => {
  const url = youtubeUrlInput.value.trim();
  if (!url || !targetDirectory || isProcessing) return;

  isProcessing = true;
  convertBtn.disabled = true;
  openFolderBtn.style.display = 'none';
  cancelBtn.disabled = false;
  cancelBtn.title = 'Cancel Process';
  cancelBtn.style.display = 'inline-flex';
  window.api.setWindowHeight(480);
  progressContainer.classList.remove('hidden');
  progressBarFill.style.width = '0%';
  progressPercent.textContent = '0%';
  progressStatus.textContent = 'Initializing...';

  appendLog('[System] Starting process...', 'system');

  try {
    const result = await window.api.startDownload({ url, outputDir: targetDirectory });
    
    if (result.success) {
      lastCreatedFile = result.filePath;
      // Show open folder link
      openFolderBtn.style.display = 'inline-flex';
    }
  } catch (error) {
    appendLog(`Error in conversion task: ${error.message}`, 'error');
  } finally {
    isProcessing = false;
    cancelBtn.style.display = 'none';
    progressContainer.classList.add('hidden');
    window.api.setWindowHeight(460);
    validateInputs();
  }
});

// Cancel button handler
cancelBtn.addEventListener('click', async () => {
  cancelBtn.disabled = true;
  cancelBtn.title = 'Cancelling...';
  await window.api.cancelDownload();
});

// Register IPC Listeners
window.api.onDownloadProgress(({ percent, stage }) => {
  progressBarFill.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
  
  if (stage === 'downloading') {
    progressStatus.textContent = 'Downloading...';
    progressBarFill.style.backgroundColor = 'var(--progress-fill-downloading)';
  } else if (stage === 'converting') {
    progressStatus.textContent = 'Converting...';
    progressBarFill.style.backgroundColor = 'var(--progress-fill-converting)';
  } else if (stage === 'done') {
    progressStatus.textContent = 'Ready';
    progressBarFill.style.backgroundColor = 'var(--progress-fill-done)';
  } else if (stage === 'error') {
    progressStatus.textContent = 'Failed';
    progressBarFill.style.backgroundColor = 'var(--progress-fill-error)';
  }
});

window.api.onDownloadLog(({ message, type }) => {
  appendLog(message, type);
});

// Click and drag to scroll in the log console
let isDraggingConsole = false;
let startYCoord = 0;
let initialScrollTop = 0;

logConsole.addEventListener('mousedown', (e) => {
  isDraggingConsole = true;
  startYCoord = e.pageY - logConsole.offsetTop;
  initialScrollTop = logConsole.scrollTop;
});

logConsole.addEventListener('mouseleave', () => {
  isDraggingConsole = false;
});

logConsole.addEventListener('mouseup', () => {
  isDraggingConsole = false;
});

logConsole.addEventListener('mousemove', (e) => {
  if (!isDraggingConsole) return;
  e.preventDefault();
  const y = e.pageY - logConsole.offsetTop;
  const walk = (y - startYCoord) * 1.5; // scroll speed multiplier
  logConsole.scrollTop = initialScrollTop - walk;
});
