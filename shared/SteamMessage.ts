import {EChatEntryType} from './SteamEnums';

export class SteamMessage {
  public steamId: string;
  public message: string;
  public chatEntryType: EChatEntryType;
  public chatId: string;
  public received: Date;
  public seen: boolean;

  constructor(steamId: string = '', message: string = '', chatEntryType: EChatEntryType = EChatEntryType.ChatMsg, chatId: string = '', seen: boolean = false) {
    this.steamId = steamId;
    this.message = message;
    this.chatEntryType = chatEntryType;
    this.chatId = chatId;
    this.received = new Date();
    this.seen = seen;
  }
}
