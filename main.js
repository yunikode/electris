const electron = require('electron')

const path = require('path')
const url = require('url')

const {app, BrowserWindow, webContents, Menu } = electron

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({width: 360, height: 510})

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  const mainMenu = Menu.buildFromTemplate(menuTemplate)

  Menu.setApplicationMenu(mainMenu)

  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    app.quit()
    mainWindow = null
  })
}

app.on('ready', () => {
  createWindow()
})

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow()
  }
})

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Game',
        accelerator: 'Ctrl+N',
        click() {
          mainWindow.webContents.send('game:new')
        }
      }, {
        label: 'Clear Item',
        accelerator: process.platform == 'darwin'
          ? 'Command+Alt+X'
          : 'Ctrl+Alt+X',
        click() {
          mainWindow.webContents.send('item:clear')
        }
      }, {
        label: 'Help',
        accelerator: process.platform == 'darwin'
          ? 'Command+H'
          : 'Ctrl+H',
        click() {
          mainWindow.webContents.send('help:show')
        }
      }, {
        label: 'Quit',
        accelerator: process.platform == 'darwin'
          ? 'Command+Q'
          : 'Ctrl+Q',
        click() {
          app.quit()
        }
      }
    ]
  }
]

if (process.platform == 'darwin') {
  menuTemplate.unshift({})
}

if (process.env.NODE_ENV !== 'production') {
  menuTemplate.push({
    label: 'Dev Tools',
    submenu: [
      {
        label: 'Toggle Dev Tools',
        accelerator: process.platform == 'darwin'
          ? 'Command+Shift+I'
          : 'Ctrl+Shift+I',
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools()
        }
      }, {
        role: 'reload'
      }
    ]
  })
}
