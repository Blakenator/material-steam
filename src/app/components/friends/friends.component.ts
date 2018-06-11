import {ApplicationRef, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {SettingsService} from '../../providers/settings.service';
import {ElectronService} from '../../providers/electron.service';
import {GamesService} from '../../providers/games.service';
import {LibraryComponent} from '../library/library.component';
import {SteamMessage} from '../../../../shared/SteamMessage';
import {SettingsComponent} from '../settings/settings.component';
import {PersonModel} from '../../../../shared/PersonModel';
import {ChatRoomMap, EChatEntryType} from '../../../../shared/SteamEnums';
import {MessageCache} from '../../../../shared/MessageCache';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss']
})
export class FriendsComponent implements OnInit {
  messages: { [index: string]: SteamMessage[] } = {};
  selectedChat: string;
  chatRooms: ChatRoomMap;
  isConnected = false;
  isLoading = false;
  password = '';
  guardCode = '';
  loginError = false;
  @ViewChild(SettingsComponent) settingsComponent: SettingsComponent;
  newMessage: string;
  isTyping = false;
  typingTimeout;

  constructor(private settingsService: SettingsService,
              private electronService: ElectronService,
              private applicationRef: ApplicationRef,
              private cdr: ChangeDetectorRef,
              public gamesService: GamesService) {
  }

  ngOnInit() {
    setTimeout(() => (<any>window).setTheme(this.settingsService.settings.darkMode ? 'dark' : 'light'), 100);
    this.refreshFriends();
    this.electronService.listen('message', (message: any) => {
      console.log(message);
      let msg: SteamMessage = Object.assign(new SteamMessage(), message, {received: new Date(message.received)});
      let id = msg.chatId || msg.steamId;
      if (msg.chatEntryType === EChatEntryType.Typing) {
        console.log(this.selectedChat, msg.chatId);
        if (this.selectedChat === id) {
          this.isTyping = true;
          this.cdr.detectChanges();
          clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            this.cdr.detectChanges();
          }, 5000);
        }
      } else if (msg.chatEntryType === EChatEntryType.ChatMsg) {
        if (id === this.selectedChat) {
          msg.seen = true;
        }
        if (this.messages[id] === undefined) {
          this.messages[id] = [msg];
        } else {
          this.messages[id].push(msg);
        }
        this.saveMessageCache();
        this.cdr.detectChanges();
      }
    });
    this.electronService.rpc('popOldMessages', [], () => {
    });
    this.electronService.rpc('loadMessageCache', [], cache => {
      this.messages = new MessageCache().importCache(cache).messages;
    });
    this.electronService.rpc('isSteamConnected', [], (connected: boolean) => {
      this.isConnected = connected;
    });
  }

  connect() {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.loginError = false;
    this.electronService.rpc('connectToSteam',
      [this.settingsComponent.userOptions.find(x => x.steamid === this.settingsService.settings.steamId).AccountName,
        this.password, this.guardCode.toLowerCase()], (args: any[]) => {
        this.isLoading = false;
        if (args[0]) {
          delete(this.password);
          this.chatRooms = args[1];
          this.isConnected = args[0];
          this.cdr.detectChanges();
        } else {
          this.loginError = true;
          this.cdr.detectChanges();
        }
      });
  }

  public getSelectedChatInfo(selectedChat) {
    if (selectedChat === undefined) {
      return undefined;
    }
    let friend: PersonModel = this.gamesService.getFriends().find(x => x.steamid === selectedChat);
    return {
      title: friend.personaname,
      subtitle: 'Joined ' + new Date(friend.timecreated * 1000).toLocaleDateString()
    };
  }

  sendNewMessage() {
    this.isLoading = true;
    this.electronService.rpc('sendMessage', [this.selectedChat, this.newMessage], (sent) => {
      if (sent) {
        let message = new SteamMessage(this.settingsService.settings.steamId, this.newMessage, EChatEntryType.ChatMsg, '', true);
        if (this.messages[this.selectedChat] === undefined) {
          this.messages[this.selectedChat] = [message];
        } else {
          this.messages[this.selectedChat].push(message);
        }
        console.log('recur4');
        // this.applicationRef.tick();
        this.newMessage = '';
        this.saveMessageCache();
      } else {
        console.log('message send failed');
      }
      this.isLoading = false;
    });
  }

  saveMessageCache() {
    this.electronService.rpc('saveMessageCache', [new MessageCache(this.messages)], () => {
    });
  }

  getUnreadMessages(chatId: string): number {
    let res = 0;
    (this.messages[chatId] || []).forEach(x => res += x.seen ? 0 : 1);
    return res;
  }

  setSelectedChat(chat: string) {
    this.selectedChat = chat;
    (this.messages[this.selectedChat] || []).forEach(x => x.seen = true);
    this.saveMessageCache();
  }

  getFriendlyTimeSent(message: SteamMessage) {
    return new Date(message.received).toLocaleTimeString();
  }

  private refreshFriends() {
    if (this.settingsService.settings === undefined) {
      setTimeout(() => this.refreshFriends(), 100);
      return;
    }
    this.gamesService.refreshFriends().then(() => {
    });
    setInterval(() => {
      this.gamesService.refreshFriends().then(() => {
        console.log('recur5');
        // this.applicationRef.tick();
      });
    }, LibraryComponent.FRIEND_REFRESH_INTERVAL_MS);
  }

  logout() {
    this.electronService.rpc('logout', [], (args: any[]) => {
      this.isConnected = false;
      this.cdr.detectChanges();
    });
  }
}
