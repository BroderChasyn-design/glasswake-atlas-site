/*:
 * @plugindesc Setup global stocks for shop items
 * Version 1.0
 * @author Makai Rosi
 *
 * @param Display Max Items
 * @type boolean
 * @on YES
 * @off NO
 * @desc Display how many times more this item can be bought (how many more items are in stock).
 * YES - true     NO - false
 * @default true
 * 
 * @param Hide Max-bought Items
 * @type boolean
 * @on YES
 * @off NO
 * @desc If an item has been bought the max number of times, don't show it in the shop.
 * YES - true     NO - false
 * @default true
 * 
 * @param Max-bought Items Message
 * @type string
 * @desc If an item has been bought the max number of times, display a message next to its name.
 * @default OUT OF STOCK
 * 
 * @param Max-bought Message Color
 * @type int
 * @desc Type the color code number you want the "Max-bought Items Message" text to appear in.
 * This is the x number you would normally use in a \c[x] text code in a "Show Text" command.
 * @default 18
 * 
 * @help
 * //===================================================//
 * //                 INTRODUCTION
 * //===================================================//
 * Global Stocks provides a way to have items that can only be bought a specific 
 * number of times from shops.
 * After the maximum times has been bought, then the item will disappear from 
 * the shop so as not to clutter it.
 * Any shop that contains the item takes into account how many times it has 
 * been bought in total, from any other shop.
 * Even if the player sells it, or consumes it, it can no longer be bought.
 * Global Stocks can also be set to follow a variable, or a function, for 
 * changing stocks.
 * 
 * Free for Commercial and Non-Commercial use.
 * This plugin is FREE. Don't pay for it.
 * Feel free to edit and share, but give credits to Makai Rosi (me) for the 
 * original plugin.
 * 
 * //===================================================//
 * //                 HOW TO USE IT
 * //===================================================//
 * To setup an item with global stock, add one of the following notes to that 
 * item:
 * 
 * 1. <GStocks: N>
 * 
 * N is the number of the maximum times the player can buy this item.
 * 
 * 2. <GStocks Var: V>
 * 
 * V is the variable ID that holds the number of the maximum times the player 
 * can buy this item.
 * 
 * 3. <GStocks Eval: C>
 * 
 * C is any code that will return the number of the maximum times the player 
 * can buy this item.
 * 
 * //===================================================//
 * //                 EXAMPLES
 * //===================================================//
 * 
 * <GStocks: 3> 
 * The player will only be able to buy this item 3 times from shops. Ever.
 *
 * <GStocks Var: 31> 
 * The player will be able to buy this item from shops for as many times as 
 * the value of Variable 31.
 * 
 * <GStocks Eval: yourFunctionName()> 
 * The player will be able to buy this item for as many times as the number
 * that "yourFunctionName" function returns.
 * 
 * <GStocks Eval:
 * let a = 4;
 * let b = 2;
 * if(a==3) a+b;
 * else a-b;> 
 * The code and in this particular example will result in the number 2 
 * (a isn't 3, and a-b = 2 in this example).
 * Therefore the player will be able to buy this item 2 times.
 *
 * //===================================================//
 * //                 PARAMETERS
 * //===================================================//
 *
 * Display Max Items
 * -----------------
 * Show the max buyable number of an item when buying it.
 * For example, an item that has a global stock of 2 and you are buying 1
 * it will display 1/2. Once you buy it, that number will change to /1.
 *
 * Hide Max-bought Items
 * ---------------------
 * When an item has been bought the maximum number of times, remove it from 
 * all shops completely. The item will never be shown again (unless that 
 * number increases).
 
 * Max-bought Items Message
 * ------------------------
 * In case you don't want to hide the items that have been bought the 
 * maximum number of times, you can show a message instead. Leave it blank 
 * if you don't want this.
 * 
 * Max-bought Items Message Color
 * ------------------------------
 * If you want to show a "Max-bought Items Message" in a specific color, 
 * type its number here. This number is the number you would use for a 
 * text code for changing colors. For example, red is 18, as \c[18] would 
 * turn the text red. Type 0 for white.
 * 
 * //===================================================//
 * //                 SCRIPT CALLS
 * //===================================================//
 * 
 * maka.gstocks.isStockItem(itemId)
 * --------------------------------
 * Returns true if the item with this id is an item affected by stocks.
 * Returns false otherwise.
 * 
 * The following script calls only work if the item is a stock item
 * (has a stocks note). So run them along with "isStockItem" function.
 * 
 * maka.gstocks.hasBoughtNu(itemId)
 * --------------------------------
 * Returns the number of items with this id that the player has bought.
 * 
 * maka.gstocks.hasBoughtMax(itemId)
 * --------------------------------
 * Returns true if the item with this id has been bought the max number 
 * of times (is out of stock).
 * Returns false otherwise.
 * 
 * maka.gstocks.addBoughtItem(itemId)
 * --------------------------------
 * Adds 1 to the bought items with this id. Useful if you want to manually 
 * give an item to the player, but still lower its stock.
 * 
 * maka.gstocks.getItemStock(itemId)
 * --------------------------------
 * Returns the stock that the item with this id currently has.
 * 
 * maka.gstocks.resetBought(itemId)
 * --------------------------------
 * Resets the how many items with this id the player has bought to 0.
 * Useful when resetting a stock per time/days passed.
 *
 * maka.gstocks.resetAll()
 * -----------------------
 * Does the same as "resetBought" but for all stock items.
 * 
 * //===================================================//
 * //                 COMPATIBILITY
 * //===================================================//
 * 
 * This has been tested with Yanfly's Core Engine, Shop Menu Core, 
 * Item Core and More Currencies plugins. I found no issues.
 * 
 * There should be no issues for other plugins either, as these 
 * functions also call their previous versions too.
 * 
 * If you are altering the RMMV functions to create something more complex, 
 * feel free to edit, but provide the info that it has been editted in this 
 * help section.
 * 
 * //===================================================//
 * //                 POTENTIAL USES
 * //===================================================//
 *
 * I wrote this plugin for my own use, but decided to write it more clearly 
 * and share it with the community too. This isn't meant to be used to 
 * setup separate shops with stocks, but global stocks instead.
 * Here are some potential uses:
 * 
 * - Buy limited crafting materials and replenish shops per x days
 * - Upgrade your house/base
 * - Buy unique items (like a book, a famous jewel or an item for a quest)
 * - Buy powerful powerups and replenish shops per milestone
 * - Setup a season or period during which certain items are out of stock
 * - Add stock when the player clears an area (for example a sawmill)
 * etc.
 * 
 */
//plugin starts here

var maka = maka || {};
maka.gstocks = maka.gstocks || {};

maka.parameters = PluginManager.parameters('maka-globalStocks');
maka.param = maka.param || {};

maka.param.hideItems = eval(String(maka.parameters['Hide Max-bought Items']));
maka.param.displayMaxItems = eval(String(maka.parameters['Display Max Items']));
maka.param.maxItemsMessage = String(maka.parameters['Max-bought Items Message']);
maka.param.maxMessageColor = parseInt(maka.parameters['Max-bought Message Color']);

maka.SCENESHOP_DOBUY = Scene_Shop.prototype.doBuy;
Scene_Shop.prototype.doBuy = function (number) {
    maka.SCENESHOP_DOBUY.call(this, number);
    if (maka.gstocks.isStockItem(this._item.id)) {
        let diff = number;
        while (diff > 0) {
            maka.gstocks.addBoughtItem(this._item.id);
            diff--;
        };

        if (maka.param.hideItems) this._buyWindow._shopGoods = maka.gstocks.removeMax(this._buyWindow._shopGoods);
    }
};

maka.WINDOWSHOPBUY_INITIALIZE = Window_ShopBuy.prototype.initialize;
Window_ShopBuy.prototype.initialize = function (x, y, height, shopGoods) {
    if (maka.param.hideItems) shopGoods = maka.gstocks.removeMax(shopGoods);
    maka.WINDOWSHOPBUY_INITIALIZE.call(this, x, y, height, shopGoods);
};

maka.WINDOWSHOPBUY_DRAWITEMNAME = Window_ShopBuy.prototype.drawItemName;
Window_ShopBuy.prototype.drawItemName = function (item, x, y, width) {
    maka.WINDOWSHOPBUY_DRAWITEMNAME.call(this, item, x, y, width);
    if (maka.gstocks.isStockItem(item.id) && maka.gstocks.hasBoughtMax(item.id)){
        this.changeTextColor(this.textColor(maka.param.maxMessageColor));
        this.drawText(maka.param.maxItemsMessage, x, y, width, 'center');
        this.changeTextColor(this.normalColor());
    }
};

maka.SCENESHOP_MAXBUY = Scene_Shop.prototype.maxBuy;
Scene_Shop.prototype.maxBuy = function () {
    if (maka.gstocks.isStockItem(this._item.id)) {

        let boughtItems = $gameSystem.boughtItemIDs[this._item.id].number;

        var max = $gameParty.maxItems(this._item) - boughtItems;

        var price = this.buyingPrice();
        if (price > 0) {
            return Math.min(max, Math.floor(this.money() / price));
        } else {
            return max;
        }
    }
    else return maka.SCENESHOP_MAXBUY.call(this);
};

maka.WINDOWSHOPNUMBER_DRAWNUMBER = Window_ShopNumber.prototype.drawNumber;
Window_ShopNumber.prototype.drawNumber = function () {
    if (maka.gstocks.isStockItem(this._item.id)) {
        var x = this.cursorX();
        var y = this.itemY();
        var width = this.cursorWidth() - this.textPadding();
        this.resetTextColor();

        let additionalText = ``;
        let boughtItems = $gameSystem.boughtItemIDs[this._item.id].number;

        if (maka.param.displayMaxItems) additionalText = `/${maka.gstocks.getItemStock(this._item.id) - boughtItems}`;

        this.drawText(this._number + additionalText, x, y, width, 'right');
    }
    else maka.WINDOWSHOPNUMBER_DRAWNUMBER.call(this);
};

maka.GAMEPARTY_MAXITEMS = Game_Party.prototype.maxItems;
Game_Party.prototype.maxItems = function (item) {
    let max = maka.GAMEPARTY_MAXITEMS.call(this, item);
    if (item && item.id && maka.gstocks.isStockItem(item.id) &&
        maka.gstocks.getItemStock(item.id) < max)
        max = maka.gstocks.getItemStock(item.id);
    return max;
};

(function () {

    let maxNote = `<GStocks:`;
    let varNote = `<GStocks Var:`;
    let codeNote = `<GStocks Eval:`;

    maka.gstocks.removeMax = function (shopGoods) {
        for (let i = 0; i < shopGoods.length; i++) {
            let id = shopGoods[i][1];
            if (this.isStockItem(id) &&
                this.hasBoughtMax(id)) {
                shopGoods.splice(i, 1);
                i--;
            }
        }
        return shopGoods;
    }

    maka.gstocks.hasBoughtMax = function (id) {
        let number = this.hasBoughtNu(id);
        if (number >= this.getItemStock(id)) return true;
        else return false;
    }

    maka.gstocks.hasBoughtNu = function (id) {
        return $gameSystem.boughtItemIDs[id].number;
    }

    maka.gstocks.addBoughtItem = function (id) {
        $gameSystem.boughtItemIDs[id].number++;
    }

    maka.gstocks.getItemStock = function (id) {
        let note = this.getNote(id);
        let noteType = this.getNoteType(note);
        if (!noteType) return 0;
        else {
            let lastIndex = note.indexOf('>', note.indexOf(noteType));
            let codeIndex = note.indexOf(noteType) + noteType.length;
            let code = note.substring(codeIndex, lastIndex);
            if (noteType == maxNote) {
                return Number(code);
            }
            else if (noteType == varNote) {
                return $gameVariables.value(Number(code))
            }
            else if (noteType == codeNote) {
                return eval(code);
            }
        }
    }

    maka.gstocks.getNote = function (id) {
        if (!$dataItems[id]) return '';
        return $dataItems[id].note;
    }

    maka.gstocks.getNoteType = function (note) {
        if (note.indexOf(maxNote) > -1) return maxNote;
        else if (note.indexOf(varNote) > -1) return varNote;
        else if (note.indexOf(codeNote) > -1) return codeNote;
        else return 0;
    }

    maka.gstocks.isStockItem = function (id) {
        let note = this.getNote(id);
        let noteType = this.getNoteType(note);
        if (noteType) {
            this.setup(id);
            return true;
        }
        else return false;
    }

    maka.gstocks.setup = function (id) {
        if (!$gameSystem.boughtItemIDs) $gameSystem.boughtItemIDs = {};
        if (id) {
            if (!$gameSystem.boughtItemIDs[id]) $gameSystem.boughtItemIDs[id] = {};
            if (!$gameSystem.boughtItemIDs[id].number) $gameSystem.boughtItemIDs[id].number = 0;
        }
    }

    maka.gstocks.resetBought = function (id) {
        this.setup(id);
        $gameSystem.boughtItemIDs[id].number = 0;
    }

    maka.gstocks.resetAll = function () {
        $gameSystem.boughtItemIDs = {};
    }

})(maka.gstocks);