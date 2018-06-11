"use strict";
exports.__esModule = true;
var SettingsModel = /** @class */ (function () {
    function SettingsModel(baseLibraryFolder, steamId, darkMode, useDetailedDescription, displaySize) {
        if (baseLibraryFolder === void 0) { baseLibraryFolder = 'C:\\Program Files (x86)\\Steam\\steamapps\\'; }
        if (steamId === void 0) { steamId = '76561197960435530'; }
        if (darkMode === void 0) { darkMode = false; }
        if (useDetailedDescription === void 0) { useDetailedDescription = false; }
        if (displaySize === void 0) { displaySize = 0; }
        this.baseLibraryFolder = baseLibraryFolder;
        this.steamId = steamId;
        this.darkMode = darkMode;
        this.useDetailedDescription = useDetailedDescription;
        this.displaySize = displaySize;
    }
    return SettingsModel;
}());
exports.SettingsModel = SettingsModel;
