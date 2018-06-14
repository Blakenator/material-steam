import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {GameInfo} from '../../../../shared/GameInfo';
import {ElectronService} from '../../providers/electron.service';

@Component({
  selector: 'app-game-card',
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.scss']
})
export class GameCardComponent implements OnInit {
  @Input() gameInfo: GameInfo;
  @Input() displaySize: number;
  @Output() onClickAction = new EventEmitter<GameInfo>();

  constructor(private electronService: ElectronService) {
  }

  ngOnInit() {
  }

  launch() {
    this.electronService.rpc('launchApp', [this.gameInfo.rawInfo.AppState.appid], () => {
      console.log('launched');
    });
  }

  openExplorer(g: GameInfo) {
    console.log(g);
    this.electronService.rpc('openFolder', [g.rawInfo.AppState.fullPath], () => {
      console.log('opened');
    });
  }

  installGame() {
    this.electronService.rpc('installApp', [this.gameInfo.rawInfo.AppState.appid], () => {
      console.log('installed');
    });
  }

  openStore(g: GameInfo) {
    this.electronService.rpc('openUrl', ['steam://store/' + g.rawInfo.AppState.appid], () => {
      console.log('launched');
    });
  }

  openWorkshop(g: GameInfo) {
    this.electronService.rpc('openUrl', ['steam://url/SteamWorkshopPage/' + g.rawInfo.AppState.appid], () => {
      console.log('launched');
    });
  }
}
