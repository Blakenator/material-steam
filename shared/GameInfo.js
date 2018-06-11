"use strict";
exports.__esModule = true;
var GameInfo = /** @class */ (function () {
    function GameInfo() {
    }
    GameInfo.prototype.isInstalled = function () {
        return this.rawInfo.AppState.installdir !== undefined;
    };
    return GameInfo;
}());
exports.GameInfo = GameInfo;
