const { app, BrowserWindow } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 1300,
    height: 900,
    title: 'Aerospace Workspace',
    autoHideMenuBar: true,
    backgroundColor: '#191724',
    webPreferences: {
      nodeIntegration: false
    }
  });

  win.loadURL('http://localhost:3000');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
