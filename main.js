const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

let mainWindow;
let activeChildProcess = null;
let isCancelled = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 550,
    height: 460,
    minWidth: 550,
    maxWidth: 550,
    minHeight: 460,
    maxHeight: 460,
    resizable: true,
    frame: false,
    transparent: false,
    backgroundColor: '#B8DAD1',
    icon: path.join(__dirname, 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Helper to download a file using native fetch (handles redirects automatically)
async function downloadFile(url, dest, onProgress) {
  const response = await fetch(url, { redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`Failed to download: HTTP ${response.status} ${response.statusText}`);
  }

  const totalBytes = parseInt(response.headers.get('content-length'), 10) || 0;
  let downloadedBytes = 0;

  const fileStream = fs.createWriteStream(dest);
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    fileStream.write(Buffer.from(value));
    downloadedBytes += value.length;

    if (totalBytes > 0 && onProgress) {
      const percent = Math.round((downloadedBytes / totalBytes) * 100);
      onProgress(percent, downloadedBytes, totalBytes);
    }
  }

  await new Promise((resolve, reject) => {
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
    fileStream.end();
  });

  return downloadedBytes;
}

// Function to ensure yt-dlp binary is present and valid
async function ensureYtDlp(sendLog, sendProgress) {
  const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const userDataPath = app.getPath('userData');
  const ytDlpPath = path.join(userDataPath, binaryName);

  // Check existing binary – delete if suspiciously small (corrupt download) or older than 3 days
  if (fs.existsSync(ytDlpPath)) {
    const stats = fs.statSync(ytDlpPath);
    const ageInMs = Date.now() - stats.mtimeMs;
    const maxAgeInMs = 3 * 24 * 60 * 60 * 1000; // 3 days
    
    if (stats.size > 1_000_000 && ageInMs < maxAgeInMs) {
      return ytDlpPath;
    }
    
    if (ageInMs >= maxAgeInMs) {
      sendLog('Updating yt-dlp to the latest version to ensure compatibility...', 'info');
    } else {
      sendLog('Existing yt-dlp binary appears corrupted. Re-downloading...', 'info');
    }
    
    try {
      fs.unlinkSync(ytDlpPath);
    } catch (e) {
      sendLog(`Warning: Could not remove old yt-dlp binary: ${e.message}`, 'info');
    }
  }

  sendLog('yt-dlp engine not found. Downloading the latest version from GitHub...', 'info');
  sendProgress(0, 'downloading');
  
  const ytDlpUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binaryName}`;
  
  try {
    let lastLoggedPercent = -1;
    const bytesWritten = await downloadFile(ytDlpUrl, ytDlpPath, (percent, downloaded, total) => {
      sendProgress(percent, 'downloading');
      
      if (percent % 10 === 0 && percent !== lastLoggedPercent) {
        lastLoggedPercent = percent;
        sendLog(`Downloading engine: ${percent}% (${(downloaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`, 'info');
      }
    });

    // Validate: yt-dlp.exe should be well over 1MB
    if (bytesWritten < 1_000_000) {
      fs.unlinkSync(ytDlpPath);
      throw new Error(`Downloaded file is too small (${bytesWritten} bytes). The download may have been interrupted.`);
    }
    
    if (process.platform !== 'win32') {
      fs.chmodSync(ytDlpPath, 0o755);
    }
    
    sendLog(`yt-dlp engine downloaded successfully (${(bytesWritten / 1024 / 1024).toFixed(1)}MB)`, 'success');
    return ytDlpPath;
  } catch (err) {
    // Clean up partial download
    if (fs.existsSync(ytDlpPath)) {
      try {
        fs.unlinkSync(ytDlpPath);
      } catch (e) {}
    }
    sendLog(`Failed to download yt-dlp: ${err.message}`, 'error');
    throw err;
  }
}

// Handle Show Item in Folder
ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  // Strip ANSI escape codes and clean up whitespace
  const cleanPath = filePath.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
  if (fs.existsSync(cleanPath)) {
    shell.showItemInFolder(cleanPath);
    return true;
  }
  // Fallback: If not found, try to open the directory itself
  const dirPath = path.dirname(cleanPath);
  if (fs.existsSync(dirPath)) {
    shell.openPath(dirPath);
    return true;
  }
  return false;
});

// Handle Cancel Download
ipcMain.handle('cancel-download', async () => {
  if (activeChildProcess) {
    isCancelled = true;
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${activeChildProcess.pid} /t /f`, (err) => {
        // ignore err
      });
    } else {
      activeChildProcess.kill('SIGKILL');
    }
    activeChildProcess = null;
    return true;
  }
  return false;
});

// Handle Select Directory dialog
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Destination Folder',
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('set-window-height', (event, height) => {
  if (mainWindow) {
    mainWindow.setMinimumSize(550, height);
    mainWindow.setMaximumSize(550, height);
    mainWindow.setSize(550, height);
  }
});

// Helper function to move files (with fallback for cross-device moves)
function moveFile(src, dest) {
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    if (err.code === 'EXDEV') {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
    } else {
      throw err;
    }
  }
}

// Helper function to clean up partially downloaded or transcoded files upon cancellation
function cleanUpCancelledFiles(tempDir, videoTitle, finalMp3Path) {
  try {
    // 1. Delete final MP3 file if it exists
    if (finalMp3Path && fs.existsSync(finalMp3Path)) {
      fs.unlinkSync(finalMp3Path);
    }
    
    // 2. Scan and delete temporary/partial files matching the video title
    if (videoTitle && fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        if (file.startsWith(videoTitle)) {
          const filePath = path.join(tempDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    }

    // Try to remove tempDir if empty
    if (tempDir && fs.existsSync(tempDir)) {
      const remaining = fs.readdirSync(tempDir);
      if (remaining.length === 0) {
        fs.rmdirSync(tempDir);
      }
    }
  } catch (e) {
    // Suppress cleanup file-system errors
  }
}

// Handle Download and Conversion via yt-dlp
ipcMain.handle('start-download', async (event, { url, outputDir }) => {
  const sendLog = (message, type = 'info') => {
    if (mainWindow) {
      mainWindow.webContents.send('download-log', { message, type });
    }
  };

  const sendProgress = (percent, stage) => {
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', { percent, stage });
    }
  };

  let finalMp3Path = '';
  let videoTitle = '';
  let loggedTitle = false;

  // Use system temporary directory to keep user folders clean
  const tempDir = path.join(app.getPath('temp'), 'bmo_ytmp3_temp');

  try {
    isCancelled = false;
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Clean up any legacy .bmo_tmp directory if it exists in the destination folder
    try {
      const legacyTempDir = path.join(outputDir, '.bmo_tmp');
      if (fs.existsSync(legacyTempDir)) {
        const files = fs.readdirSync(legacyTempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(legacyTempDir, file));
        }
        fs.rmdirSync(legacyTempDir);
      }
    } catch (e) {}

    // 1. Ensure yt-dlp engine is ready
    const ytDlpPath = await ensureYtDlp(sendLog, sendProgress);
    
    // Get ffmpeg path directory (support app.asar.unpacked in packaged state)
    const ffmpegPathDir = path.dirname(ffmpegInstaller.path).replace('app.asar', 'app.asar.unpacked');
    
    // 2. Spawn yt-dlp for downloading and extracting audio to MP3
    sendLog('Starting high-speed download and conversion...', 'info');
    sendProgress(0, 'downloading');
    
    const ytDlpArgs = [
      '-f', 'ba',
      '--concurrent-fragments', '16',
      '--buffer-size', '64K',
      '--socket-timeout', '10',
      '--geo-bypass',
      '--no-mtime',
      '--extractor-args', 'youtube:player_client=default,-android_sdkless',
      '--ffmpeg-location', ffmpegPathDir,
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '4', // VBR 4 (faster encoding, high quality ~192kbps equivalent)
      '--postprocessor-args', 'ffmpeg:-compression_level 9 -threads 0',
      '--no-cache-dir',
      '--no-colors',
      '-o', path.join(tempDir, '%(title)s.%(ext)s'),
      '--no-playlist',
      url
    ];

    const child = spawn(ytDlpPath, ytDlpArgs);
    activeChildProcess = child;

    await new Promise((resolve, reject) => {
      // Animated progress timer for the conversion phase (80% → 99%)
      let conversionTimer = null;
      let simulatedPercent = 80;

      function startConversionProgress() {
        if (conversionTimer) return;
        simulatedPercent = 80;
        conversionTimer = setInterval(() => {
          // Decelerating curve: fast at first, slows as it approaches 99%
          const remaining = 99 - simulatedPercent;
          const increment = Math.max(0.15, remaining * 0.04);
          simulatedPercent = Math.min(99, simulatedPercent + increment);
          sendProgress(Math.round(simulatedPercent), 'converting');
        }, 500);
      }

      function stopConversionProgress() {
        if (conversionTimer) {
          clearInterval(conversionTimer);
          conversionTimer = null;
        }
      }

      child.stdout.on('data', (data) => {
        const output = data.toString().trim();
        
        // Log all meaningful output lines to the terminal
        if (output) {
          // Parse destination and video title dynamically
          if (output.includes('[download] Destination:') || output.includes('[ExtractAudio] Destination:')) {
            const isExtract = output.includes('[ExtractAudio]');
            const matchPath = output.match(/(?:Destination:\s*)(.+)/);
            if (matchPath) {
              const tempPath = matchPath[1].replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').replace(/\r?\n|\r/g, '').trim();
              if (isExtract) {
                finalMp3Path = tempPath;
              } else {
                const ext = path.extname(tempPath);
                finalMp3Path = tempPath.substring(0, tempPath.length - ext.length) + '.mp3';
              }
              
              if (!loggedTitle) {
                const filename = path.basename(finalMp3Path);
                videoTitle = filename.substring(0, filename.length - 4); // Remove .mp3
                sendLog(`Target Title: "${videoTitle}"`, 'info');
                loggedTitle = true;
              }
            }
          }
          // Parse download progress
          const matchPercent = output.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
          if (matchPercent) {
            const percent = Math.round(parseFloat(matchPercent[1]));
            sendProgress(percent, 'downloading');
            sendLog(`Downloading: ${percent}%`, 'info');
          } else if (output.includes('[ExtractAudio]')) {
            sendLog('Extracting and transcoding audio stream...', 'info');
            sendProgress(80, 'converting');
            startConversionProgress();
          }
        }
      });

      child.stderr.on('data', (data) => {
        const errorMsg = data.toString().trim();
        if (errorMsg && !errorMsg.includes('WARNING')) {
          sendLog(`stderr: ${errorMsg}`, 'system');
        }
      });

      child.on('close', (code) => {
        stopConversionProgress();
        activeChildProcess = null;
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`yt-dlp process exited with code ${code}`));
        }
      });
    });

    // Move completed MP3 file from temporary directory to actual destination directory
    let actualMp3Path = '';
    let foundMp3Path = '';
    
    // Clean up finalMp3Path in case it has control chars
    const cleanFinalMp3Path = finalMp3Path ? finalMp3Path.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').replace(/\r?\n|\r/g, '').trim() : '';

    if (cleanFinalMp3Path && fs.existsSync(cleanFinalMp3Path)) {
      foundMp3Path = cleanFinalMp3Path;
    } else {
      // Fallback: Scan the tempDir for any .mp3 files
      try {
        if (fs.existsSync(tempDir)) {
          const files = fs.readdirSync(tempDir);
          const mp3Files = files.filter(f => f.endsWith('.mp3'));
          if (mp3Files.length > 0) {
            // Sort by modification time to get the newest file
            const sorted = mp3Files.map(f => ({
              name: f,
              time: fs.statSync(path.join(tempDir, f)).mtimeMs
            })).sort((a, b) => b.time - a.time);
            
            foundMp3Path = path.join(tempDir, sorted[0].name);
          }
        }
      } catch (scanErr) {
        sendLog(`Warning scanning temp directory: ${scanErr.message}`, 'system');
      }
    }

    if (foundMp3Path && fs.existsSync(foundMp3Path)) {
      actualMp3Path = path.join(outputDir, path.basename(foundMp3Path));
      moveFile(foundMp3Path, actualMp3Path);
    } else {
      throw new Error('Could not find completed MP3 file in temporary directory.');
    }

    // Try to remove tempDir if it is empty now
    try {
      const remaining = fs.readdirSync(tempDir);
      if (remaining.length === 0) {
        fs.rmdirSync(tempDir);
      }
    } catch (e) {}

    sendLog('Conversion complete! File saved successfully to:', 'success');
    sendLog(actualMp3Path, 'success-path');
    sendProgress(100, 'done');
    
    return { success: true, filePath: actualMp3Path };

  } catch (err) {
    activeChildProcess = null;
    if (isCancelled) {
      sendLog('[System] Process cancelled by user. Cleaning up files...', 'system');
      cleanUpCancelledFiles(tempDir, videoTitle, finalMp3Path);
      sendProgress(0, 'error');
      return { success: false, error: 'Cancelled' };
    }
    sendLog(`Error: ${err.message}`, 'error');
    cleanUpCancelledFiles(tempDir, videoTitle, finalMp3Path);
    sendProgress(0, 'error');
    return { success: false, error: err.message };
  }
});
