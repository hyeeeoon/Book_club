const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const path = require('path');

let backendProcess;

// 개발 모드인지 확인 (ELECTRON_START_URL 환경변수가 있으면 개발 모드)
const isDev = process.env.ELECTRON_START_URL || !app.isPackaged;

function createWindow() {
  // 1. 서버(Backend) 실행
  // 배포 후에는 상대 경로가 달라질 수 있으므로 path.join을 권장합니다.
  const backendPath = path.join(__dirname, 'backend/server.js');
  backendProcess = exec(`node "${backendPath}"`);

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "너와 보는 바다가 더 예뻐서 - 독서모임 관리",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 2. 개발 중에는 Vite 서버, 배포 후에는 빌드된 index.html 로드
  if (isDev) {
    win.loadURL('http://localhost:5173');
    // 개발 중에는 개발자 도구(F12)를 자동으로 엽니다 (선택 사항)
    // win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  }

  // 3. 창을 닫을 때 백엔드 프로세스도 같이 종료
  win.on('closed', () => {
    if (backendProcess) backendProcess.kill();
    app.quit();
  });
}

app.whenReady().then(createWindow);

// 모든 창이 닫히면 앱 종료
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});