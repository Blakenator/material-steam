"use strict";
exports.__esModule = true;
var GameInfo_1 = require("./GameInfo");
var AppCache = /** @class */ (function () {
    function AppCache(games) {
        if (games === void 0) { games = []; }
        this.games = games;
    }
    AppCache.prototype.importCache = function (cache) {
        this.games = (cache.games || []).map(function (x) { return Object.assign(new GameInfo_1.GameInfo(), x); });
        return this;
    };
    return AppCache;
}());
exports.AppCache = AppCache;
