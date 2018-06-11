"use strict";
exports.__esModule = true;
var SteamMessage_1 = require("./SteamMessage");
var MessageCache = /** @class */ (function () {
    function MessageCache(messages) {
        if (messages === void 0) { messages = {}; }
        this.messages = messages;
    }
    MessageCache.prototype.importCache = function (cache) {
        var _this = this;
        Object.keys(cache.messages).forEach(function (id) {
            _this.messages[id] = (cache.messages[id] || []).map(function (x) { return Object.assign(new SteamMessage_1.SteamMessage(), x); });
        });
        return this;
    };
    return MessageCache;
}());
exports.MessageCache = MessageCache;
