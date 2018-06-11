import {SteamMessage} from './SteamMessage';

export class MessageCache {
  public messages: { [index: string]: SteamMessage[] };

  constructor(messages: { [index: string]: SteamMessage[] } = {}) {
    this.messages = messages;
  }

  importCache(cache: any): MessageCache {
    Object.keys(cache.messages).forEach(id => {
      this.messages[id] = (cache.messages[id] || []).map(x => Object.assign(new SteamMessage(), x));
    });
    return this;
  }
}
