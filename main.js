const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const path = require('path');

let backendProcess;

// 앱이 패키징(배포용으로 빌드) 되었는지 확인
const isDev = !app.isPackaged;

function createWindow() {
  // 1. 백엔드 실행 경로 설정
  // 배포 후에는 process.resourcesPath를 참조해야 에러가 나지 않습니다.
  const backendPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'backend/server.js') 
    : path.join(__dirname, 'backend/server.js');

  backendProcess = exec(`node "${backendPath}"`);

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "너와 보는 바다가 더 예뻐서",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 2. 개발 중엔 서버 주소, 배포 후엔 빌드된 파일 로드
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // 패키징 후 앱의 루트를 가리키는 경로 설정
    win.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  }

  // 3. 창을 닫을 때 백엔드 프로세스도 같이 종료
  win.on('closed', () => {
    if (backendProcess) backendProcess.kill();
    app.quit();
  });
}

app.whenReady().then(createWindow);

// 맥(macOS) 특성을 고려한 앱 종료 로직
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});