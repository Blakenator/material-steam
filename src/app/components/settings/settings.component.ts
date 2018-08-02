import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {ElectronService} from '../../providers/electron.service';
import {SettingsService} from '../../providers/settings.service';
import {SettingsModel} from '../../../../shared/SettingsModel';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  showSettingsDialog = false;
  tempSettings: SettingsModel;
  userOptions: { steamid: string, AccountName: string, PersonaName: string }[] = [];
  advanced: boolean;
  version = '';
  @Output() onSaveAction = new EventEmitter<SettingsModel>();

  constructor(private electronService: ElectronService, private settingsService: SettingsService) {
  }

  ngOnInit() {
    this.settingsService.loadSettings(() => {
      this.tempSettings = Object.assign(new SettingsModel(), this.settingsService.settings);
      this.refreshUsernameOptions();
      this.electronService.rpc('getVersion', [], version => {
        this.version = version;
      });
    });
  }

  checkForUpdates() {
    this.electronService.rpc('checkForUpdates', [], () => {
    });
  }

  saveSettings(autopick = false) {
    this.settingsService.saveSettings(this.tempSettings);
    this.tempSettings = this.settingsService.settings;
    this.showSettingsDialog = false;
    if (!autopick) {
      this.refreshUsernameOptions();
    }
    setTimeout(() => this.onSaveAction.emit(this.tempSettings), 100);
  }

  copyTempSettings() {
    this.tempSettings = Object.assign(new SettingsModel(), this.settingsService.settings);
    this.showSettingsDialog = true;
  }

  cancelChanges() {
    this.showSettingsDialog = false;
  }

  private refreshUsernameOptions() {
    this.electronService.rpc('getUsernameOptions', [this.settingsService.settings.baseLibraryFolder, this.settingsService.settings.baseConfigFoldar], options => {
      this.userOptions = options;
      if (this.userOptions.length === 1) {
        this.tempSettings.steamId = this.userOptions[0].steamid;
        this.saveSettings(true);
      }
    });
  }
}
