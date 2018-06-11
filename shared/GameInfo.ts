import {GameInfoRaw} from './GameInfoRaw';

export class GameInfo {
  type: string;
  name: string;
  steam_appid: string;
  detailed_description: string;
  about_the_game: string;
  short_description: string;
  header_image: string;
  website: string;
  developers: string[];
  publishers: string[];
  price_overview: { currency: string, initial: number, final: number, discount_percent: number };
  categories: { id: number, description: string }[];
  genres: { id: number, description: string }[];
  background: string;
  rawInfo: GameInfoRaw;

  isInstalled(): boolean {
    return this.rawInfo.AppState.installdir !== undefined;
  }
}
