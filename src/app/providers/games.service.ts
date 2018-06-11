import {Injectable} from '@angular/core';
import {GameInfoRaw} from '../../../shared/GameInfoRaw';
import {GameInfo} from '../../../shared/GameInfo';
import {ElectronService} from './electron.service';
import {SettingsService} from './settings.service';
import {HttpClient} from '@angular/common/http';
import {PersonModel} from '../../../shared/PersonModel';
import {AppCache} from '../../../shared/AppCache';

@Injectable()
export class GamesService {
  public friendsAppMap: Map<number, string>;
  private games: GameInfo[];
  private apiKey = '8FAE971462658B1D24F70D2B2E5DCEB5';
  private friends: Map<string, PersonModel>;

  constructor(private electronService: ElectronService,
              private settingsService: SettingsService,
              private http: HttpClient) {
  }

  saveAppCache() {
    this.electronService.rpc('saveAppCache', [new AppCache(this.games)], () => {
    });
  }

  loadAppCache(): Promise<GameInfo[]> {
    return new Promise<GameInfo[]>((resolve, reject) => {
      this.electronService.rpc('loadAppCache', [], (cache: AppCache) => {
        if (cache.games.length === 0) {
          this.refreshGameList().then(resolve).catch(reject);
        } else {
          this.games = new AppCache().importCache(cache).games;
          resolve(this.games);
        }
      });
    });
  }

  refreshGameList(): Promise<GameInfo[]> {
    return new Promise<GameInfo[]>((resolve, reject) => {
      this.electronService.rpc('refreshGameList', [this.settingsService.settings.baseLibraryFolder], (data: GameInfoRaw[]) => {
        let availableUrl = 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=' + this.apiKey + '&steamid=' + this.settingsService.settings.steamId + '&format=json';
        this.http.get<{ response: { game_count: number, games: { appid: number, playtime_forever: string, playtime_2weeks: number }[] } }>(availableUrl).toPromise<{ response: { game_count: number, games: { appid: number, playtime_forever: string, playtime_2weeks: number }[] } }>()
          .then((playData) => {
            if (playData.response.game_count > 0) {
              let dataMap = {};
              data.forEach(x => dataMap[x.AppState.appid] = x);
              playData.response.games.forEach(x => {
                let newRaw = dataMap[x.appid] || new GameInfoRaw();
                newRaw.AppState = Object.assign(newRaw.AppState || {},
                  {
                    appid: x.appid,
                    playtime_2weeks: x.playtime_2weeks,
                    playtime_forever: x.playtime_forever
                  });
                return dataMap[x.appid] = newRaw;
              });
              this.convertRawToFull(Object.values(dataMap)).then(resolve).catch(reject);
            } else {
              this.convertRawToFull(data).then(resolve).catch(reject);
            }
          });
      });
    });
  }

  getFriendsAppMap(): Promise<Map<number, string>> {
    return new Promise<Map<number, string>>((resolve, reject) => {
      let gets = [];
      // console.log(this.friends);
      let results: Map<number, string> = new Map<number, string>();
      [...this.friends.values()].forEach(x => {
        // console.log(x);
        gets.push(new Promise((resolve1, reject1) => {
          let availableUrl = 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=' + this.apiKey + '&steamid=' + x.steamid + '&format=json';
          this.http.get<{ response: { game_count: number, games: { appid: number, playtime_forever: string, playtime_2weeks: number }[] } }>(availableUrl).toPromise<{ response: { game_count: number, games: { appid: number, playtime_forever: string, playtime_2weeks: number }[] } }>()
            .then((playData) => {
              if (playData.response.game_count > 0) {
                playData.response.games.forEach(game => {
                  if (results[game.appid] === undefined) {
                    results[game.appid] = [x.steamid];
                  } else {
                    results[game.appid].push(x.steamid);
                  }
                });
              }
              resolve1();
            }).catch(err => {
            reject1(err);
          });
        }));
      });
      Promise.all(gets).then(() => {
        this.friendsAppMap = results;
        resolve(results);
      }).catch(() => {
        this.friendsAppMap = results;
        reject(results);
      });
    });
  }

  refreshFriends(): Promise<Map<string, PersonModel>> {
    return new Promise<Map<string, PersonModel>>((resolve, reject) => {
      let friendsListUrl = 'http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=' + this.apiKey + '&steamid=' + this.settingsService.settings.steamId + '&relationship=friend';
      this.http.get<{ friendslist: { friends: PersonModel[] } }>(friendsListUrl).toPromise<{ friendslist: { friends: PersonModel[] } }>().then(response => {
        let friends = response.friendslist.friends;
        let detailedFriends: Map<string, PersonModel> = new Map<string, PersonModel>();
        let gets = [];
        for (let i = 0; i < Math.ceil(friends.length / 99); i++) {
          gets.push(new Promise<Map<string, PersonModel>>((resolve2, reject2) => {
            let playerInfoUrl = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + this.apiKey + '&steamids=' + friends.splice(i * 99, Math.min((i + 1) * 99, friends.length)).map(f => f.steamid).join(',');
            this.http.get<{ response: { players: PersonModel[] } }>(playerInfoUrl).toPromise<{ response: { players: PersonModel[] } }>().then(data => {
              data.response.players.forEach(x => detailedFriends.set(x.steamid, Object.assign(new PersonModel(), x)));
              resolve2();
            }).catch((err) => {
              reject2(err);
            });
          }));
        }
        Promise.all(gets).then(() => {
          this.friends = detailedFriends;
          resolve(detailedFriends);
        }).catch(() => {
          this.friends = detailedFriends;
          reject(detailedFriends);
        });
      }).catch(reject);
    });
  }

  getFriendsForApp(appid: number) {
    return (this.friendsAppMap[appid] || []).map(x => this.friends.get(x));
  }

  getFriends() {
    if (this.friends === undefined) {
      return undefined;
    }
    let sortMapping = [6, 0, 3, 4, 5, 2, 1, -1];
    return [...this.friends.values()].sort((a, b) => {
      let sort = sortMapping[a.gameid !== undefined ? sortMapping.length - 1 : a.personastate] - sortMapping[b.gameid !== undefined ? sortMapping.length - 1 : b.personastate];
      if (sort === 0) {
        let aname = a.personaname.toLowerCase();
        let bname = b.personaname.toLowerCase();
        sort = aname > bname ? 1 : (aname < bname ? -1 : 0);
      }
      return sort;
    });
  }

  private convertRawToFull(data: GameInfoRaw[]): Promise<GameInfo[]> {
    return new Promise<GameInfo[]>((resolve, reject) => {
      this.games = [];
      // console.log(data);
      let gets = [];
      data.forEach(x => {
        let url = 'https://store.steampowered.com/api/appdetails?appids=' + x.AppState.appid;
        gets.push(new Promise<any>((resolve2, reject2) => {
          this.http.get(url).toPromise<any>().then(response => {
            for (let index in response) {
              if (response.hasOwnProperty(index) && response[index].success) {
                this.games.push(Object.assign(new GameInfo(), response[index].data, {rawInfo: x}));
              }
            }
            resolve2();
          }).catch((err) => {
            reject2();
          });
        }));
      });
      Promise.all(gets).then(() => {
        // console.log(this.games);
        this.saveAppCache();
        resolve(this.games);
      }).catch(() => {
        this.saveAppCache();
        reject(this.games);
      });
    });
  }
}
