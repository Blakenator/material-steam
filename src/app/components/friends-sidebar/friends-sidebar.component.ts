import {Component, OnInit} from '@angular/core';
import {GamesService} from '../../providers/games.service';
import {ElectronService} from '../../providers/electron.service';
import {SettingsModel} from '../../../../shared/SettingsModel';
import {SettingsService} from '../../providers/settings.service';
import {PersonModel} from '../../../../shared/PersonModel';

@Component({
  selector: 'app-friends-sidebar',
  templateUrl: './friends-sidebar.component.html',
  styleUrls: ['./friends-sidebar.component.scss']
})
export class FriendsSidebarComponent implements OnInit {
  constructor(public gamesService: GamesService,
              public electronService: ElectronService,
              public settingsService: SettingsService) {
  }

  ngOnInit() {
  }


  getSavedSettings() {
    return this.settingsService.settings || new SettingsModel();
  }

  popoutFriendsWindow() {
    this.electronService.rpc('launchFriendsWindow', [], () => {
    });
  }

  setExpanded(expanded: boolean) {
    this.getSavedSettings().friendsExpanded = expanded;
    this.settingsService.saveSettings();
  }

  openChatSteam(friend: PersonModel) {
    this.electronService.rpc('openUrl', ['steam://friends/message/' + friend.steamid], () => {

    });
  }
}
