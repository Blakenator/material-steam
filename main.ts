import {app, BrowserWindow, dialog, ipcMain, screen, shell} from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import {GameInfoRaw} from './shared/GameInfoRaw';
import {SettingsModel} from './shared/SettingsModel';
import {AppCache} from './shared/AppCache';
import {SteamMessage} from './shared/SteamMessage';
import {MessageCache} from './shared/MessageCache';
import {EChatEntryType, EPersonaState} from './shared/SteamEnums';
import {autoUpdater} from 'electron-updater';

const opn = require('opn');
const output = fs.createWriteStream('D:\\Users\\blake\\Documents\\bitbucket\\Steam\\app-builds\\out.log');
const errorOutput = fs.createWriteStream('D:\\Users\\blake\\Documents\\bitbucket\\Steam\\app-builds\\err.log');
const logger = new console.Console(output, errorOutput);

process.on('uncaughtException', function (error) {
  logger.log(JSON.stringify(error));
  logger.log(error);
});
const SteamUser = require('steam-user');
let win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

function createWindow() {
  autoUpdater.checkForUpdatesAndNotify();

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }
  // win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

function getReplyChannel(arg) {
  return arg[0] + 'reply';
}

function getJsonFromSpaceFile(data) {
  return '{' +
    data.replace(/"(\S+)"\s*\{/g, '"$1":{')
      .replace(/"(\S+)"\s*"(.+?)"/g, '"$1": "$2",')
      .replace(/,\s*\}/g, '}')
      .replace(/\}\s*"/g, '},"') +
    '}';
}

function saveSettings(settingsModel: SettingsModel) {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settingsModel), {encoding: 'utf8'});
}

function saveAppCache(appCache: AppCache) {
  fs.writeFileSync(getAppCachePath(), JSON.stringify(appCache), {encoding: 'utf8'});
}

function saveMessageCache(messageCache: MessageCache) {
  fs.writeFileSync(getMessageCachePath(), JSON.stringify(messageCache), {encoding: 'utf8'});
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function getAppCachePath() {
  return path.join(app.getPath('userData'), 'cache.json');
}

function getMessageCachePath() {
  return path.join(app.getPath('userData'), 'msgcache.json');
}

function getLoginCachePath() {
  return path.join(app.getPath('userData'), 'lcache.json');
}

function defaultReply(event, args) {
  event.sender.send(getReplyChannel(args), undefined);
}

function saveLoginInfo(key: any, guardSha: any) {
  fs.writeFileSync(getLoginCachePath(), JSON.stringify({key, guardSha}), {encoding: 'utf8'});
}


try {
  let steamUser = new SteamUser({promptSteamGuardCode: false});
  let guardSha;
  let loginKey;
  let oldMessages = [];
  let lastMessageCache: MessageCache;
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
      steamUser.logOff();
      loginKey = undefined;
      guardSha = undefined;
      saveLoginInfo(loginKey, guardSha);
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
  ipcMain.on('refreshGameList', (event, args) => {
    let libraries = [args[1]];
    let libraryVdf = path.join(libraries[0], 'libraryfolders.vdf');
    if (!fs.existsSync(libraryVdf)) {
      dialog.showMessageBox(win, {
        title: 'Incorrect Base Steamapps Path',
        type: 'error',
        message: 'The base steamapps path is incorrect. Please ensure that the path ends with \n' +
        '"steamapps" and that the path entered is for the primary library location'
      });
      event.sender.send(getReplyChannel(args), []);
      return;
    }
    let games: GameInfoRaw[] = [];
    fs.readFile(libraryVdf, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }
      // logger.log(data);
      let text = getJsonFromSpaceFile(data);
      // logger.log(text);
      let otherLibs = JSON.parse(text);
      // logger.log(otherLibs);
      // logger.log(Object.keys(otherLibs['LibraryFolders']).filter((x) => x.match(/\d+/)));
      libraries.push(...Object.keys(otherLibs['LibraryFolders'])
        .filter((x) => x.match(/\d+/))
        .map(x => path.join(otherLibs['LibraryFolders'][x], 'steamapps')));
      // logger.log(libraries);
      for (let l of libraries) {
        let files = fs.readdirSync(l);
        if (err) {
          logger.log(err);
          return;
        }
        // logger.log(files.filter(x => x.match(/.*\.acf/)));
        files.filter(x => x.match(/.*\.acf/)).forEach(x => {
          let data = fs.readFileSync(path.join(l, x), 'utf8');
          if (err) {
            logger.log(err);
            return;
          }
          // logger.log(getJsonFromSpaceFile(data));
          let g: GameInfoRaw = Object.assign(new GameInfoRaw(), JSON.parse(getJsonFromSpaceFile(data)));
          g.AppState.fullPath = path.join(l, 'common', g.AppState.installdir);
          games.push(g);
        });
      }
      event.sender.send(getReplyChannel(args), games);
    });
  });
  ipcMain.on('launchApp', (event, args) => {
    logger.log('launching game id: ' + args[1]);
    let url = 'steam://rungameid/' + args[1];
    opn(url);
    defaultReply(event, args);
  });
  ipcMain.on('installApp', (event, args) => {
    logger.log('installing game id: ' + args[1]);
    let url = 'steam://install/' + args[1];
    opn(url);
    defaultReply(event, args);
  });
  ipcMain.on('deleteLocalContent', (event, args) => {
    logger.log('launching game id: ' + args[1]);
    let url = 'steam://uninstall/' + args[1];
    if (dialog.showMessageBox(win, {
      buttons: ['Yes, I\'m sure', 'No, keep it'], title: 'Warning!',
      message: 'Are you sure you want to delete this game? All saves, user content, ' +
      'and mods present in the app\'s folder will be permanently erased'
    }) === 0) {
      opn(url);
    }
    defaultReply(event, args);
  });
  ipcMain.on('openUrl', (event, args) => {
    let url = args[1];
    if (args.length > 2) {
      opn(url, {app: args[2]});
    } else {
      opn(url);
    }
    defaultReply(event, args);
  });
  ipcMain.on('openFolder', (event, args) => {
    let url = args[1];
    shell.openItem(url);
    defaultReply(event, args);
  });
  ipcMain.on('loadSettings', (event, args) => {
    if (fs.existsSync(getSettingsPath())) {
      fs.readFile(getSettingsPath(), 'utf8', (err, data) => {
        if (err) {
          throw err;
        }
        event.sender.send(getReplyChannel(args), Object.assign(new SettingsModel(), JSON.parse(data)));
      });
    } else {
      let settingsModel = new SettingsModel();
      saveSettings(settingsModel);
      event.sender.send(getReplyChannel(args), settingsModel);
    }
  });
  ipcMain.on('saveSettings', (event, args) => {
    saveSettings(args[1]);
    defaultReply(event, args);
  });
  ipcMain.on('loadAppCache', (event, args) => {
    if (fs.existsSync(getAppCachePath())) {
      fs.readFile(getAppCachePath(), 'utf8', (err, data) => {
        if (err) {
          throw err;
        }
        // logger.log(data);
        // logger.log(JSON.parse(data));
        event.sender.send(getReplyChannel(args), JSON.parse(data));
      });
    } else {
      // logger.log('empty');
      saveAppCache(new AppCache());
      event.sender.send(getReplyChannel(args), new AppCache());
    }
  });
  ipcMain.on('saveAppCache', (event, args) => {
    saveAppCache(args[1]);
    defaultReply(event, args);
  });
  ipcMain.on('loadMessageCache', (event, args) => {
    if (fs.existsSync(getMessageCachePath())) {
      fs.readFile(getMessageCachePath(), 'utf8', (err, data) => {
        if (err) {
          throw err;
        }
        // logger.log(data);
        // logger.log(JSON.parse(data));
        let parse = JSON.parse(data);
        lastMessageCache = new MessageCache().importCache(parse);
        event.sender.send(getReplyChannel(args), lastMessageCache);
      });
    } else {
      // logger.log('empty');
      lastMessageCache = new MessageCache();
      saveMessageCache(lastMessageCache);
      event.sender.send(getReplyChannel(args), lastMessageCache);
    }
  });
  ipcMain.on('saveMessageCache', (event, args) => {
    lastMessageCache = args[1];
    saveMessageCache(args[1]);
    defaultReply(event, args);
  });
  ipcMain.on('launchFriendsWindow', (event, args) => {
    let friendsWindow = new BrowserWindow({width: 600, height: 400});
    friendsWindow.on('close', function () {
      friendsWindow = null;
      if (oldMessages.length > 0) {
        oldMessages.forEach((x: SteamMessage) => {
          if (x.chatEntryType === EChatEntryType.ChatMsg) {
            if (lastMessageCache.messages[x.chatId || x.steamId] !== undefined) {
              lastMessageCache.messages[x.chatId || x.steamId].push(x);
            } else {
              lastMessageCache.messages[x.chatId || x.steamId] = [x];
            }
          }
        });
        saveMessageCache(lastMessageCache);
        oldMessages = [];
      }
    });
    // friendsWindow.webContents.openDevTools()
    friendsWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true,
      hash: '/friends'
    }));
    friendsWindow.show();
    defaultReply(event, args);
  });
  ipcMain.on('getUsernameOptions', (event, args) => {
    let userpath = path.join(args[2] || args[1], '../config/', 'loginusers.vdf');
    console.log(userpath);
    if (fs.existsSync(userpath)) {
      fs.readFile(userpath, 'utf8', (err, data) => {
        if (err) {
          throw err;
        }
        let source = JSON.parse(getJsonFromSpaceFile(data)).users;
        let users = Object.keys(source).map(x => {
          return {steamid: x, AccountName: source[x].AccountName, PersonaName: source[x].PersonaName};
        });
        event.sender.send(getReplyChannel(args), users);
      });
    } else {
      event.sender.send(getReplyChannel(args), []);
    }
  });
  ipcMain.on('isSteamConnected', (event, args) => {
    event.sender.send(getReplyChannel(args), steamUser.publicIP !== undefined);
  });
  ipcMain.on('connectToSteam', (event, args) => {
    if (steamUser.publicIP !== undefined) {
      steamUser.setPersona(EPersonaState.Online);
      steamUser.setUIMode(0);
      event.sender.send(getReplyChannel(args), [steamUser.publicIP !== undefined, steamUser.chats]);
    } else {
      // console.log(cache);
      steamUser.setSentry(guardSha);
      let logOnDetails = {
        accountName: args[1],
        password: args[2],
        authCode: args[3],
        twoFactorCode: args[3]
      };
      steamUser.logOn(logOnDetails);
      steamUser.on('error', (err) => {
        event.sender.send(getReplyChannel(args), [false, {steamGuard: false}]);
      });
      steamUser.on('steamGuard', (domain, callback, lastCodeWrong) => {
        event.sender.send(getReplyChannel(args), [false, {steamGuard: true, lastCodeWrong}]);
        ipcMain.on('steamGuardCode', (event, args) => {
          callback(args[1]);
          ipcMain.removeAllListeners('steamGuardCode');
          event.sender.send(getReplyChannel(['steamGuardCode']), []);
        });
      });
      steamUser.on('loggedOn', (resp) => {
        steamUser.setPersona(EPersonaState.Online);
        steamUser.setUIMode(0);
        steamUser.on('friendOrChatMessage', (steamId: any, message: string, roomId: any) => {
          let steamMessage = new SteamMessage(steamId.getSteamID64() + '', message, EChatEntryType.ChatMsg, roomId.getSteamID64());
          oldMessages.push(steamMessage);
          event.sender.send(getReplyChannel(['message']), steamMessage);
        });
        steamUser.on('friendTyping', (senderID) => {
          let steamMessage = new SteamMessage(senderID.getSteamID64() + '', '', EChatEntryType.Typing);
          oldMessages.push(steamMessage);
          event.sender.send(getReplyChannel(['message']), steamMessage);
        });
        event.sender.send(getReplyChannel(args), [true, steamUser.chats]);
      });
    }
  });
  ipcMain.on('popOldMessages', (event, args) => {
    oldMessages.forEach(x => {
      event.sender.send(getReplyChannel(['message']), x);
    });
    oldMessages = [];
  });
  ipcMain.on('sendMessage', (event, args) => {
    if (steamUser.publicIP !== undefined) {
      steamUser.chatMessage(args[1], args[2]);
      event.sender.send(getReplyChannel(args), true);
    }
    event.sender.send(getReplyChannel(args), false);
  });
  ipcMain.on('logout', (event, args) => {
    steamUser.logOff();
    event.sender.send(getReplyChannel(args), false);
  });
} catch (e) {
  // Catch Error
  // throw e;
}

