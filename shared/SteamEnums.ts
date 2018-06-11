// <editor-fold desc="export enumS">
// export module SteamEnums {
export enum EChatEntryType {
  Invalid = 0,
  ChatMsg = 1,
  Typing = 2,
  InviteGame = 3,
  LeftConversation = 6,
  Entered = 7,
  WasKicked = 8,
  WasBanned = 9,
  Disconnected = 10,
  HistoricalChat = 11,
  Reserved1 = 12,
  Reserved2 = 13,
  LinkBlocked = 14
}

export enum EPersonaState {
  Offline = 0,
  Online = 1,
  Busy = 2,
  Away = 3,
  Snooze = 4,
  LookingToTrade = 5,
  LookingToPlay = 6,
  Max = 7
}

export enum EChatMemberStateChange {
  Entered = 0x01,
  Left = 0x02,
  Disconnected = 0x04,
  Kicked = 0x08,
  Banned = 0x10,
  VoiceSpeaking = 0x1000,
  VoiceDoneSpeaking = 0x2000
}

export interface ChatRoomMap {
  [index: string]: { [index: string]: { rank: string, permissions: string } };
}

// }
// </editor-fold>
