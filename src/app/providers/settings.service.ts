import {Injectable} from '@angular/core';
import {ElectronService} from './electron.service';
import {SettingsModel} from '../../../shared/SettingsModel';

@Injectable()
export class SettingsService {
  settings: SettingsModel;

  constructor(private electronService: ElectronService) {
  }

  loadSettings(callback:Function=()=>{}) {
    if (this.settings === undefined) {
      this.electronService.rpc('loadSettings', [], (settings) => {
        this.settings = settings;
        callback();
      });
    }
  }

  saveSettings(tempSettings: SettingsModel = this.settings) {
    this.electronService.rpc('saveSettings', [tempSettings], () => {
    });
    this.settings = tempSettings;
  }
}
