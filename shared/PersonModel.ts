export class PersonModel {
  static stateColors = ['hsl(120, 0%, 50%)', 'hsl(180, 50%, 50%)', 'hsl(0, 50%, 50%)',
    'hsl(240, 50%, 50%)', 'hsl(36, 50%, 50%)', 'hsl(120, 90%, 50%)', 'hsl(120, 90%, 50%)'];
  static stateNames = [' - Offline', ' - Online', ' - Busy',
    ' - Away', ' - Snooze', ' - Looking to trade', ' - Looking to play'];
  public steamid: string;
  public friend_since: number;
  public personaname: string;
  public avatarfull: string;
  public personastate: number;
  public gameid: string;
  public gameextrainfo: string;
  public timecreated: number;

  getFriendlyFriendName() {
    if (this.gameid === undefined) {
      return this.personaname + PersonModel.stateNames[this.personastate];
    } else {
      return this.personaname + ' - In Game - ' + this.gameextrainfo;
    }
  }

  getStatusBorder() {
    if (this.gameid === undefined) {
      return PersonModel.stateColors[this.personastate];
    } else {
      return 'hsl(120, 90%, 50%)';
    }
  }
}
