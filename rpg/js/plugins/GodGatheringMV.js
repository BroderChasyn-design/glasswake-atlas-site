/*:
 * @plugindesc Opens the God Gathering card game inside RPG Maker MV.
 * @author OpenAI
 *
 * @param Online Card Game URL
 * @desc HTTPS URL for the account-connected standalone card game.
 * @default https://broderchasyn-design.github.io/glasswake-atlas-site/
 *
 * @help
 * Adds an online card-game option to the title menu. Story events use the bundled,
 * offline-only card game and support these plugin commands:
 *   OpenGodGathering (offline story collection)
 *   OpenGodGatheringOnline
 *   CloseGodGathering
 * The story collection uses a separate local save and never loads account sync.
 */
(function() {
    'use strict';

    var parameters = PluginManager.parameters('GodGatheringMV');
    var onlineGameUrl = String(parameters['Online Card Game URL'] || '').trim();
    if (!onlineGameUrl) onlineGameUrl = 'https://broderchasyn-design.github.io/glasswake-atlas-site/';
    var offlineGameUrl = './GodGathering/index.html';
    if (typeof process === 'object' && process.mainModule) {
        try {
            var path = require('path');
            var url = require('url');
            var projectRoot = path.dirname(StorageManager.localFileDirectoryPath());
            offlineGameUrl = url.pathToFileURL(path.join(projectRoot, 'GodGathering', 'index.html')).href;
        } catch (error) {
            console.error('Could not resolve the bundled offline God Gathering page:', error);
        }
    }
    var overlay = null;
    var resizeHandler = null;

    // The Crossroads and Commons are drawn as zero parallaxes; collide with their painted scenery.
    var _mapIsPassable = Game_Map.prototype.isPassable;
    Game_Map.prototype.isPassable = function(x, y, direction) {
        var note = (typeof $dataMap !== 'undefined' && $dataMap && $dataMap.note) || '';
        if (note.indexOf('<CardTown>') >= 0) {
            var buildingList = /<CardTownBuildings:([^>]+)>/.exec(note);
            var obstacleList = /<CardTownObstacles:([^>]+)>/.exec(note);
            var openingList = /<CardTownOpenings:([^>]+)>/.exec(note);
            var openings = openingList ? openingList[1].split(';') : [];
            if (obstacleList) {
                var obstacles = obstacleList[1].split(';');
                for (var k = 0; k < obstacles.length; k++) {
                    var obstacle = obstacles[k].split(',').map(Number);
                    if (obstacle.length === 2 && obstacle[0] === x && obstacle[1] === y) return false;
                }
            }
            if (buildingList) {
                var buildings = buildingList[1].split(';');
                for (var i = 0; i < buildings.length; i++) {
                    var footprint = buildings[i].split(',').map(Number);
                    if (footprint.length !== 4) continue;
                    if (x >= footprint[0] && y >= footprint[1] && x < footprint[0] + footprint[2] && y < footprint[1] + footprint[3]) {
                        for (var j = 0; j < openings.length; j++) {
                            var opening = openings[j].split(',').map(Number);
                            if (opening[0] === x && opening[1] === y) return _mapIsPassable.call(this, x, y, direction);
                        }
                        return false;
                    }
                }
            }
        }
        return _mapIsPassable.call(this, x, y, direction);
    };

    function openGame(gameUrl, starterDeckKey) {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'god-gathering-mv-overlay';
        overlay.style.cssText = 'position:fixed;top:0;right:0;bottom:0;left:0;width:100vw;height:100vh;z-index:99999;background:#101b22;display:flex;flex-direction:column;font:14px sans-serif;color:#f5edcf;overflow:hidden;';

        var bar = document.createElement('div');
        bar.style.cssText = 'height:44px;min-height:44px;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;padding:0 14px;background:#17272d;border-bottom:1px solid #667;';
        var title = document.createElement('strong');
        title.textContent = 'GOD GATHERING  ·  CARD TABLE';
        title.style.cssText = 'font:12px monospace;letter-spacing:.12em;color:#e4c77f;';
        var close = document.createElement('button');
        close.type = 'button';
        close.textContent = 'Return to the world  ×';
        close.style.cssText = 'border:1px solid #d9b77888;border-radius:4px;background:#263b3d;color:#f5edcf;padding:8px 12px;cursor:pointer;font:13px sans-serif;';
        close.addEventListener('click', closeGame);
        bar.appendChild(title);
        bar.appendChild(close);

        var frame = document.createElement('iframe');
        frame.title = 'God Gathering card game';
        frame.src = gameUrl;
        frame.allow = 'fullscreen';
        frame.style.cssText = 'display:block;position:absolute;top:44px;right:0;bottom:0;left:0;width:100%;height:calc(100% - 44px);border:0;background:#101b22;';
        frame.addEventListener('load', function() {
            if (starterDeckKey && frame.contentWindow) {
                frame.contentWindow.postMessage({ type: 'god-gathering-starter-deck', deckKey: starterDeckKey }, '*');
            }
        });
        overlay.appendChild(bar);
        overlay.appendChild(frame);
        document.body.appendChild(overlay);
        resizeHandler = function() {
            if (!overlay) return;
            overlay.style.width = window.innerWidth + 'px';
            overlay.style.height = window.innerHeight + 'px';
        };
        window.addEventListener('resize', resizeHandler);
        resizeHandler();
    }

    function openOfflineGame() {
        var deckKeys = [null, 'faith_hindu', 'faith_buddhist', 'faith_christian', 'faith_islamic', 'faith_jewish'];
        var deckChoice = (typeof $gameVariables !== 'undefined' && $gameVariables) ? Number($gameVariables.value(1)) : 0;
        var starterDeckKey = deckKeys[deckChoice] || null;
        var separator = offlineGameUrl.indexOf('?') >= 0 ? '&' : '?';
        openGame(offlineGameUrl + separator + 'profile=rpg-offline', starterDeckKey);
    }

    function openOnlineGame() {
        // Open the hosted game as a first-party page so browser account storage and email sign-in work normally.
        if (typeof nw !== 'undefined' && nw.Shell && nw.Shell.openExternal) {
            try {
                nw.Shell.openExternal(onlineGameUrl);
                return;
            } catch (error) {
                console.warn('Could not open the standalone card game in the default browser:', error);
            }
        }
        openGame(onlineGameUrl, null);
    }

    function closeGame() {
        if (!overlay) return;
        overlay.remove();
        overlay = null;
        if (resizeHandler) window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
        if (window.Input && Input.clear) Input.clear();
        if (window.TouchInput && TouchInput.clear) TouchInput.clear();
    }

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        var normalized = String(command || '').toLowerCase();
        if (normalized === 'opengodgathering') openOfflineGame();
        if (normalized === 'opengodgatheringonline') openOnlineGame();
        if (normalized === 'closegodgathering') closeGame();
    };

    var _makeCommandList = Window_TitleCommand.prototype.makeCommandList;
    Window_TitleCommand.prototype.makeCommandList = function() {
        _makeCommandList.call(this);
        this.addCommand('Play Card Game Online', 'godGathering', true);
    };

    var _createCommandWindow = Scene_Title.prototype.createCommandWindow;
    Scene_Title.prototype.createCommandWindow = function() {
        _createCommandWindow.call(this);
        this._commandWindow.setHandler('godGathering', openOnlineGame);
    };
})();
