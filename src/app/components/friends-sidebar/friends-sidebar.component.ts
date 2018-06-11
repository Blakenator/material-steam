import {Component, OnInit} from '@angular/core';
import {GamesService} from '../../providers/games.service';
import {ElectronService} from '../../providers/electron.service';

@Component({
  selector: 'app-friends-sidebar',
  templateUrl: './friends-sidebar.component.html',
  styleUrls: ['./friends-sidebar.component.scss']
})
export class FriendsSidebarComponent implements OnInit {

  constructor(public gamesService: GamesService, public electronService: ElectronService) {
  }

  ngOnInit() {
  }

  popoutFriendsWindow() {
    this.electronService.rpc('launchFriendsWindow', [], () => {
    });
  }
}
