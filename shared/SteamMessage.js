"use strict";
exports.__esModule = true;
var SteamEnums_1 = require("./SteamEnums");
var SteamMessage = /** @class */ (function () {
    function SteamMessage(steamId, message, chatEntryType, chatId, seen) {
        if (steamId === void 0) { steamId = ''; }
        if (message === void 0) { message = ''; }
        if (chatEntryType === void 0) { chatEntryType = SteamEnums_1.EChatEntryType.ChatMsg; }
        if (chatId === void 0) { chatId = ''; }
        if (seen === void 0) { seen = false; }
        this.steamId = steamId;
        this.message = message;
        this.chatEntryType = chatEntryType;
        this.chatId = chatId;
        this.received = new Date();
        this.seen = seen;
    }
    return SteamMessage;
}());
exports.SteamMessage = SteamMessage;
