import {GameInfo} from './GameInfo';

export class AppCache {
  public games: GameInfo[];

  constructor(games: GameInfo[] = []) {
    this.games = games;
  }

  importCache(cache: any): AppCache {
    this.games = (cache.games || []).map(x => Object.assign(new GameInfo(), x));
    return this;
  }
}
