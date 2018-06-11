import {ApplicationRef, Component, OnInit} from '@angular/core';
import {ElectronService} from '../../providers/electron.service';
import {GameInfo} from '../../../../shared/GameInfo';
import {HttpClient} from '@angular/common/http';
import {SettingsService} from '../../providers/settings.service';
import {GamesService} from '../../providers/games.service';
import {SettingsModel} from '../../../../shared/SettingsModel';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {

  public static FRIEND_REFRESH_INTERVAL_MS = 60 * 1000;
  games: GameInfo[] = [];
  isLoading = true;
  selectedGame: GameInfo;
  showDrawer = false;
  showInstalled = true;
  showAvailable = false;

  constructor(private electronService: ElectronService,
              public settingsService: SettingsService,
              public gamesService: GamesService,
              private http: HttpClient,
              private applicationRef: ApplicationRef) {
  }

  ngOnInit() {
    this.refreshGameList();
    setTimeout(() => this.setTheme(this.settingsService.settings.darkMode ? 'dark' : 'light'), 100);
    setInterval(() => {
      this.gamesService.refreshFriends().then(() => {
        this.applicationRef.tick();
      });
    }, LibraryComponent.FRIEND_REFRESH_INTERVAL_MS);
  }

  refreshGameList(force = false) {
    this.isLoading = true;
    if (this.settingsService.settings === undefined || this.settingsService.settings.baseLibraryFolder === undefined) {
      setTimeout(() => this.refreshGameList(), 100);
      return;
    }
    this.games = [];
    let onfulfilled = (games) => {
      this.games = games;
      this.applicationRef.tick();
      this.isLoading = false;
      this.gamesService.refreshFriends().then((friends) => {
        this.gamesService.getFriendsAppMap();
      }).catch((friends) => {
        console.log(friends);
        this.gamesService.getFriendsAppMap();
      });
    };
    if (force) {
      this.gamesService.refreshGameList().then(onfulfilled).catch(onfulfilled);
    } else {
      this.gamesService.loadAppCache().then(onfulfilled).catch(onfulfilled);
    }
  }

  setSelectedGame(g: GameInfo) {
    this.selectedGame = g || this.selectedGame;
    this.showDrawer = g !== undefined;
    this.applicationRef.tick();
  }

  launch() {
    this.electronService.rpc('launchApp', [this.selectedGame.steam_appid], () => {
      console.log('launched');
    });
  }

  getFriendlySizeOnDisk() {
    return Math.round((+this.selectedGame.rawInfo.AppState.SizeOnDisk) / 1024 / 1024).toLocaleString();
  }

  getDescriptionText() {
    let description = this.settingsService.settings.useDetailedDescription ? this.selectedGame.detailed_description : this.selectedGame.short_description;
    return description
      .replace(/h5/gi, 'p')
      .replace(/h4/gi, 'h5')
      .replace(/h3/gi, 'h4')
      .replace(/h2/gi, 'h3')
      .replace(/h1/gi, 'h2')
      .replace(/\<img/gi, '<img width="100%"');
  }

  openExplorer(g: GameInfo) {
    this.electronService.rpc('openFolder', [g.rawInfo.AppState.fullPath], () => {
      console.log('launched');
    });
  }

  deletLocalContent(g: GameInfo) {
    this.electronService.rpc('deleteLocalContent', [g.steam_appid], () => {
      console.log('launched');
    });
  }

  getSortedGameList(games: GameInfo[], filterInstalled: boolean | undefined) {
    if (filterInstalled !== undefined) {
      games = games.filter(x => x.isInstalled() === filterInstalled);
    }
    return games.sort((a, b) => a.name > b.name ? 1 : (a.name < b.name ? -1 : 0));
  }

  installGame() {
    this.electronService.rpc('installApp', [this.selectedGame.rawInfo.AppState.appid], () => {
      console.log('installed');
    });
  }

  getFriendlyPlayTime() {
    return Math.round(this.selectedGame.rawInfo.AppState.playtime_forever / 60 * 10) / 10;
  }

  getFriendlyFullPath() {
    return this.selectedGame.rawInfo.AppState.fullPath.replace(/([\\/])/g, ' $1 ');
  }

  setTheme(theme: string) {
    (<any>window).setTheme(theme);
    this.saveSettings();
  }

  saveSettings() {
    this.settingsService.saveSettings();
    this.applicationRef.tick();
  }

  getSavedSettings() {
    return this.settingsService.settings || new SettingsModel();
  }

  getFriendsForApp() {
    return this.gamesService.getFriendsForApp(+this.selectedGame.steam_appid);
  }
}
