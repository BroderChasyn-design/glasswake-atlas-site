// hl cc-ui.js
// by hutaolov3r

(function() {
    'use strict';

    var ANIM = {
        windowFadeIn:  true,
        windowFadeOut: true,
        cardHover:     true
    };

    var ANIM_TIME = {
        window: 280,
        card:   180
    };

    //LOCALE
    // To add a language, copy the EN,RU,JP,CN block and translate it.
    // Key (ru, en, jp, cn) CRPG_UI.open('en')
    // CRPG_UI.open('en') ENG
    // CRPG_UI.open('jp') JP
    // CRPG_UI.open('cn') CN
    // CRPG_UI.open('ru') RU
    var LOCALE = 'en';

    var I18N = {
        ru: {
            title: 'Создание героя',
            name: 'Имя',
            namePlaceholder: 'Введите имя',
            nameChars: 'символов',
            nameHint: 'Только буквы, пробелы и дефис. До 20 символов.',
            classLabel: 'Класс',
            raceLabel: 'Раса',
            originLabel: 'Происхождение',
            statsLabel: 'Параметры',
            pointsLabel: 'Осталось очков',
            reset: 'Сбросить',
            start: 'Начать',
            params: {
                mhp: 'Макс. HP', mmp: 'Макс. MP', atk: 'Атака', def: 'Защита',
                mat: 'Маг. атака', mdf: 'Маг. защита', agi: 'Ловкость', luk: 'Удача'
            },
            paramHints: {
                mhp: 'Максимальный запас здоровья. Определяет, сколько урона персонаж может выдержать до падения.',
                mmp: 'Максимальный запас маны. Расходуется на умения и заклинания.',
                atk: 'Влияет на физический урон от обычных атак и умений ближнего боя.',
                def: 'Снижает получаемый физический урон.',
                mat: 'Влияет на силу магических умений и заклинаний.',
                mdf: 'Снижает получаемый магический урон.',
                agi: 'Скорость действий в бою. Порядок хода, шанс сбежать, шанс застать врага врасплох.',
                luk: 'Удача. Шанс успешного наложения состояний и их длительность.'
            },
            classes: {
                warrior:  { name: 'Воитель', tagline: 'Стойкость и сталь' },
                rogue:    { name: 'Плут', tagline: 'Тень и удар в спину' },
                sorcerer: { name: 'Чародей', tagline: 'Сила в крови' },
                cleric:   { name: 'Жрец', tagline: 'Голос выше' }
            },
            races: {
                human:    { name: 'Человек',    desc: 'Универсал и приспособленец' },
                elf:      { name: 'Эльф',       desc: 'Быстрый и чуткий' },
                dwarf:    { name: 'Дварф',      desc: 'Крепкий и выносливый' },
                orc:      { name: 'Орк',        desc: 'Сильный и яростный' },
                halfling: { name: 'Полурослик', desc: 'Мелкий и удачливый' },
                gnome:    { name: 'Гном',       desc: 'Умный и стойкий к магии' }
            },
            origins: {
                soldier:  { name: 'Солдат',           desc: 'Служба и дисциплина' },
                survivor: { name: 'Уличный выживший', desc: 'Трущобы и инстинкты' },
                scholar:  { name: 'Учёный',           desc: 'Архивы и рукописи' },
                acolyte:  { name: 'Послушник',        desc: 'Храм и вера' },
                noble:    { name: 'Дворянин',         desc: 'Род и интриги' },
                hunter:   { name: 'Охотник',          desc: 'Дикая природа и след' },
                artisan:  { name: 'Ремесленник',      desc: 'Мастерство и труд' },
                outcast:  { name: 'Изгой',            desc: 'Изгнание и свобода' }
            }
        },
        en: {
            title: 'Character Creation',
            name: 'Name',
            namePlaceholder: 'Enter name',
            nameChars: 'characters',
            nameHint: 'Letters, spaces and hyphens only. Up to 20 characters.',
            classLabel: 'Class', raceLabel: 'Race', originLabel: 'Background',
            statsLabel: 'Attributes', pointsLabel: 'Points left',
            reset: 'Reset', start: 'Begin',
            params: {
                mhp: 'Max HP', mmp: 'Max MP', atk: 'Attack', def: 'Defense',
                mat: 'M.Attack', mdf: 'M.Defense', agi: 'Agility', luk: 'Luck'
            },
            paramHints: {
                mhp: 'Maximum health. How much damage the character can take before falling.',
                mmp: 'Maximum mana. Spent on abilities and spells.',
                atk: 'Affects physical damage from basic attacks and melee skills.',
                def: 'Reduces incoming physical damage.',
                mat: 'Affects the power of magical skills and spells.',
                mdf: 'Reduces incoming magic damage.',
                agi: 'Action speed. Turn order, chance to flee, chance to surprise enemies.',
                luk: 'Luck. Chance to apply status effects and their duration.'
            },
            classes: {
                warrior:  { name: 'Warrior', tagline: 'Steel and endurance' },
                rogue:    { name: 'Rogue', tagline: 'Shadow and backstab' },
                sorcerer: { name: 'Sorcerer', tagline: 'Power within' },
                cleric:   { name: 'Cleric', tagline: 'A voice above' }
            },
            races: {
                human:    { name: 'Human',    desc: 'Versatile and adaptable' },
                elf:      { name: 'Elf',      desc: 'Swift and perceptive' },
                dwarf:    { name: 'Dwarf',    desc: 'Sturdy and enduring' },
                orc:      { name: 'Orc',      desc: 'Strong and fierce' },
                halfling: { name: 'Halfling', desc: 'Small and fortunate' },
                gnome:    { name: 'Gnome',    desc: 'Clever and magic-resistant' }
            },
            origins: {
                soldier:  { name: 'Soldier',        desc: 'Service and discipline' },
                survivor: { name: 'Street Survivor',desc: 'Slums and instinct' },
                scholar:  { name: 'Scholar',        desc: 'Archives and manuscripts' },
                acolyte:  { name: 'Acolyte',        desc: 'Temple and faith' },
                noble:    { name: 'Noble',          desc: 'Lineage and intrigue' },
                hunter:   { name: 'Hunter',         desc: 'Wilderness and trail' },
                artisan:  { name: 'Artisan',        desc: 'Craft and toil' },
                outcast:  { name: 'Outcast',        desc: 'Exile and freedom' }
            }
        },
        jp: {
            title: 'キャラクター作成',
            name: '名前',
            namePlaceholder: '名前を入力',
            nameChars: '文字',
            nameHint: '文字、空白、ハイフンのみ。20文字まで。',
            classLabel: 'クラス', raceLabel: '種族', originLabel: '出自',
            statsLabel: '能力値', pointsLabel: '残りポイント',
            reset: 'リセット', start: '開始',
            params: {
                mhp: '最大HP', mmp: '最大MP', atk: '攻撃力', def: '防御力',
                mat: '魔法攻撃', mdf: '魔法防御', agi: '敏捷性', luk: '運'
            },
            paramHints: {
                mhp: '最大体力。戦闘不能になるまでに受けられるダメージ量。',
                mmp: '最大マナ。スキルや呪文の使用に消費。',
                atk: '通常攻撃と近接スキルの物理ダメージ。',
                def: '受ける物理ダメージを軽減。',
                mat: '魔法スキルと呪文の威力。',
                mdf: '受ける魔法ダメージを軽減。',
                agi: '戦闘での行動速度。行動順、逃走、不意打ち。',
                luk: '運。状態異常の付与成功率と持続時間。'
            },
            classes: {
                warrior:  { name: '戦士', tagline: '鋼と忍耐' },
                rogue:    { name: '盗賊', tagline: '影と急所' },
                sorcerer: { name: '魔術師', tagline: '血の力' },
                cleric:   { name: '僧侶', tagline: '高き声' }
            },
            races: {
                human:    { name: '人間',         desc: '万能で適応力がある' },
                elf:      { name: 'エルフ',       desc: '素早く鋭い' },
                dwarf:    { name: 'ドワーフ',     desc: '頑丈で忍耐強い' },
                orc:      { name: 'オーク',       desc: '強く獰猛' },
                halfling: { name: 'ハーフリング', desc: '小さく幸運' },
                gnome:    { name: 'ノーム',       desc: '賢く魔法に強い' }
            },
            origins: {
                soldier:  { name: '兵士', desc: '奉仕と規律' },
                survivor: { name: '街の生存者', desc: '貧民街と本能' },
                scholar:  { name: '学者', desc: '古文書と書物' },
                acolyte:  { name: '侍祭', desc: '神殿と信仰' },
                noble:    { name: '貴族', desc: '家系と陰謀' },
                hunter:   { name: '狩人', desc: '荒野と追跡' },
                artisan:  { name: '職人', desc: '技量と労働' },
                outcast:  { name: '追放者', desc: '追放と自由' }
            }
        },
        cn: {
            title: '角色创建',
            name: '姓名',
            namePlaceholder: '输入姓名',
            nameChars: '字符',
            nameHint: '仅限字母、空格和连字符。最多20个字符。',
            classLabel: '职业', raceLabel: '种族', originLabel: '出身',
            statsLabel: '属性', pointsLabel: '剩余点数',
            reset: '重置', start: '开始',
            params: {
                mhp: '最大HP', mmp: '最大MP', atk: '攻击', def: '防御',
                mat: '魔攻', mdf: '魔防', agi: '敏捷', luk: '幸运'
            },
            paramHints: {
                mhp: '最大生命值。角色被击倒前能承受的伤害。',
                mmp: '最大法力值。用于技能和法术。',
                atk: '普通攻击和近战技能的物理伤害。',
                def: '减少受到的物理伤害。',
                mat: '魔法技能和法术的威力。',
                mdf: '减少受到的魔法伤害。',
                agi: '战斗中的行动速度。行动顺序、逃跑、突袭。',
                luk: '幸运。状态效果的施加成功率与持续时间。'
            },
            classes: {
                warrior:  { name: '战士', tagline: '钢铁与坚韧' },
                rogue:    { name: '游荡者', tagline: '暗影与背刺' },
                sorcerer: { name: '术士', tagline: '血脉之力' },
                cleric:   { name: '牧师', tagline: '高处的呼唤' }
            },
            races: {
                human:    { name: '人类',   desc: '多才多艺' },
                elf:      { name: '精灵',   desc: '敏捷而锐利' },
                dwarf:    { name: '矮人',   desc: '强壮而坚毅' },
                orc:      { name: '兽人',   desc: '强壮而凶猛' },
                halfling: { name: '半身人', desc: '矮小而幸运' },
                gnome:    { name: '侏儒',   desc: '聪明且抗魔' }
            },
            origins: {
                soldier:  { name: '士兵', desc: '服役与纪律' },
                survivor: { name: '街头幸存者', desc: '贫民窟与本能' },
                scholar:  { name: '学者', desc: '档案与手稿' },
                acolyte:  { name: '侍僧', desc: '神殿与信仰' },
                noble:    { name: '贵族', desc: '血统与阴谋' },
                hunter:   { name: '猎人', desc: '荒野与追踪' },
                artisan:  { name: '工匠', desc: '手艺与劳作' },
                outcast:  { name: '弃儿', desc: '流放与自由' }
            }
        }
    };

    function T() { return I18N[LOCALE] || I18N.ru; }

    // Style UI

    var STYLE = [
        '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+SC:wght@400;500;700&display=swap");',

        '#crpg-ui {',
            'position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
            'z-index: 9999; display: none;',
            'font-family: "Inter", "Noto Sans JP", "Noto Sans SC", system-ui, sans-serif;',
            'color: #e6e8ee; font-size: 14px; user-select: none;',
            'font-weight: 400; line-height: 1.5;',
            'background: radial-gradient(ellipse at 50% 30%, #1a2333 0%, #070a11 90%);',
            'overflow: hidden;',
        '}',
        '#crpg-ui.open { display: flex !important; align-items: center; justify-content: center; }',

        '#crpg-ui .window {',
            'position: relative;',
            'width: 96vw; max-width: 1400px;',
            'height: 94vh; max-height: 860px;',
            'min-width: 0; min-height: 0;',
            'display: grid;',
            'grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);',
            'grid-template-rows: minmax(0, 1fr) 76px;',
            'gap: 10px; padding: 10px; box-sizing: border-box;',
            'opacity: 0;',
            'transform: translateY(24px) scale(0.985);',
            'transition: opacity ' + (ANIM.windowFadeIn ? ANIM_TIME.window : 0) + 'ms ease, transform ' + (ANIM.windowFadeIn ? ANIM_TIME.window : 0) + 'ms cubic-bezier(0.2, 0.8, 0.2, 1);',
        '}',
        '#crpg-ui.open .window {',
            'opacity: 1;',
            'transform: translateY(0) scale(1);',
        '}',
        '#crpg-ui.closing .window {',
            'opacity: 0;',
            'transform: translateY(-12px) scale(0.99);',
        '}',

        '#crpg-ui .panel {',
            'position: relative;',
            'background: linear-gradient(180deg, #1b2230 0%, #0e1219 100%);',
            'border: 1px solid rgba(120,150,200,0.22);',
            'padding: 22px 24px;',
            'display: flex; flex-direction: column;',
            'overflow: hidden;',
            'min-height: 0; min-width: 0;',
            'height: 100%;',
            'box-sizing: border-box;',
            'box-shadow: 0 0 40px rgba(0,0,0,0.5), inset 0 0 60px rgba(60,100,180,0.04);',
        '}',

        '#crpg-ui .panel-title {',
            'font-size: 12px; font-weight: 600; color: #9fb4d8;',
            'letter-spacing: 3px; text-transform: uppercase;',
            'text-align: center;',
            'margin-bottom: 16px; padding-bottom: 12px;',
            'border-bottom: 1px solid rgba(120,150,200,0.18);',
            'flex: 0 0 auto;',
            'height: 40px; box-sizing: border-box;',
        '}',

        '#crpg-ui .scrollable {',
            'flex: 1 1 0;',
            'min-height: 0; min-width: 0;',
            'overflow-y: auto; overflow-x: hidden;',
            'padding-right: 8px;',
            'height: 100%;',
        '}',
        '#crpg-ui .scrollable::-webkit-scrollbar { width: 6px; }',
        '#crpg-ui .scrollable::-webkit-scrollbar-track { background: rgba(0,0,0,0.25); }',
        '#crpg-ui .scrollable::-webkit-scrollbar-thumb {',
            'background: rgba(120,150,200,0.35); border-radius: 3px;',
        '}',

        '#crpg-ui .label {',
            'font-size: 10px; text-transform: uppercase; letter-spacing: 2px;',
            'color: #6a7a98; margin-bottom: 8px;',
            'font-weight: 600; flex: 0 0 auto;',
        '}',

        '#crpg-ui .name-input {',
            'width: 100%; padding: 12px 16px; font-size: 15px;',
            'box-sizing: border-box;',
            'background: rgba(10,14,22,0.8);',
            'border: 1px solid rgba(120,150,200,0.3);',
            'color: #e6e8ee; font-family: inherit; outline: none;',
            'letter-spacing: 0.5px; border-radius: 4px;',
            'transition: border-color 0.2s, box-shadow 0.2s;',
        '}',
        '#crpg-ui .name-input:focus {',
            'border-color: #6a94d8;',
            'box-shadow: 0 0 0 3px rgba(106,148,216,0.15);',
            'background: rgba(10,14,22,0.95);',
        '}',
        '#crpg-ui .name-input::placeholder { color: #4a5570; }',

        '#crpg-ui .name-meta {',
            'display: flex; justify-content: space-between; align-items: center;',
            'margin-top: 6px;',
            'font-size: 11px;',
        '}',
        '#crpg-ui .name-counter {',
            'color: #6a7a98; font-variant-numeric: tabular-nums;',
            'letter-spacing: 0.5px;',
            'transition: color 0.15s;',
        '}',
        '#crpg-ui .name-counter.warn { color: #d8b86a; }',
        '#crpg-ui .name-counter.max  { color: #c85454; }',
        '#crpg-ui .name-hint { color: #4a5570; font-size: 10.5px; }',

        '#crpg-ui .name-block {',
            'margin-bottom: 16px; padding-bottom: 16px;',
            'border-bottom: 1px solid rgba(120,150,200,0.12);',
            'flex: 0 0 auto;',
        '}',

        '#crpg-ui .split-columns {',
            'display: grid;',
            'grid-template-columns: 1fr 1fr 1fr;',
            'gap: 10px;',
            'flex: 1 1 0; min-height: 0; height: 100%;',
        '}',
        '#crpg-ui .col {',
            'display: flex; flex-direction: column;',
            'min-height: 0; min-width: 0; overflow: hidden; height: 100%;',
        '}',

        '#crpg-ui .row-item {',
            'display: flex; flex-direction: column; justify-content: center;',
            'gap: 2px; padding: 6px 9px; margin-bottom: 4px;',
            'background: rgba(10,14,22,0.5);',
            'border: 1px solid rgba(120,150,200,0.15);',
            'cursor: pointer;',
            'border-radius: 4px; position: relative;',
            'height: 44px; box-sizing: border-box; flex: 0 0 44px; overflow: hidden;',
            'transition: background 0.15s, border-color 0.15s, transform ' + (ANIM.cardHover ? ANIM_TIME.card : 0) + 'ms ease, box-shadow ' + (ANIM.cardHover ? ANIM_TIME.card : 0) + 'ms ease;',
        '}',
        '#crpg-ui .row-item:hover {',
            'background: rgba(30,42,62,0.7); border-color: rgba(120,150,200,0.4);',
            'transform: translateX(4px);',
            'box-shadow: -3px 0 0 0 #6a94d8, 0 4px 12px rgba(0,0,0,0.25);',
        '}',
        '#crpg-ui .row-item.active {',
            'background: linear-gradient(90deg, rgba(106,148,216,0.22), rgba(106,148,216,0.04));',
            'border-color: #6a94d8;',
            'box-shadow: inset 0 0 20px rgba(106,148,216,0.1);',
        '}',
        '#crpg-ui .row-item.active::before {',
            'content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;',
            'background: #6a94d8;',
        '}',
        '#crpg-ui .row-name {',
            'font-size: 12px; font-weight: 500; color: #c8cfde;',
            'letter-spacing: 0.3px;',
            'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
        '}',
        '#crpg-ui .row-item.active .row-name { color: #ffffff; }',
        '#crpg-ui .row-sub {',
            'font-size: 10px; color: #5a6a88;',
            'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
        '}',
        '#crpg-ui .row-item.active .row-sub { color: #8fa4c8; }',

        '#crpg-ui .right-layout {',
            'display: grid;',
            'grid-template-rows: 152px minmax(0, 1fr);',
            'gap: 14px;',
            'flex: 1 1 0; min-height: 0; height: 100%;',
            'position: relative; z-index: 1;',
        '}',
        '#crpg-ui .preview-box {',
            'display: flex; align-items: center; justify-content: center;',
            'background: #0c121a;',
            'border: 1px solid #2a3648;',
            'overflow: hidden;',
            'height: 152px; box-sizing: border-box;',
            'position: relative; z-index: 2;',
            'transform: translateZ(0);',
            'backface-visibility: hidden;',
        '}',
        '#crpg-ui .portrait-canvas {',
            'width: 144px; height: 144px;',
            'image-rendering: pixelated;',
            'image-rendering: crisp-edges;',
            'background: #0c121a;',
            'display: block;',
            'position: relative; z-index: 3;',
            'transform: translateZ(0);',
            'backface-visibility: hidden;',
        '}',

        '#crpg-ui .info-block {',
            'display: flex; flex-direction: column;',
            'min-height: 0; overflow-y: auto;',
        '}',
        '#crpg-ui .class-title {',
            'font-size: 18px; font-weight: 600; color: #e6e8ee;',
            'text-align: center; margin-bottom: 3px; letter-spacing: 1px;',
        '}',
        '#crpg-ui .class-tagline {',
            'color: #8fa4c8; font-size: 12px; font-style: italic;',
            'text-align: center; margin-bottom: 12px;',
        '}',

        '#crpg-ui .stat-grid {',
            'display: grid;',
            'grid-template-columns: 1fr 1fr;',
            'gap: 6px;',
        '}',

        '#crpg-ui .stat-row {',
            'display: grid;',
            'grid-template-columns: 18px 1fr 24px 46px 24px;',
            'align-items: center; gap: 4px;',
            'padding: 6px 8px;',
            'background: rgba(10,14,22,0.4);',
            'border: 1px solid rgba(120,150,200,0.15);',
            'border-radius: 4px;',
            'height: 40px; box-sizing: border-box;',
        '}',

        '#crpg-ui .stat-help {',
            'width: 16px; height: 16px; border-radius: 50%;',
            'background: rgba(106,148,216,0.15);',
            'border: 1px solid rgba(106,148,216,0.5);',
            'color: #8fa4c8;',
            'display: flex; align-items: center; justify-content: center;',
            'font-size: 10px; font-weight: 700;',
            'cursor: help; user-select: none;',
            'transition: background 0.15s, border-color 0.15s, color 0.15s;',
            'line-height: 1;',
            'grid-column: 1; grid-row: 1;',
        '}',
        '#crpg-ui .stat-help:hover {',
            'background: rgba(106,148,216,0.35);',
            'border-color: #6a94d8;',
            'color: #ffffff;',
        '}',

        '#crpg-ui .stat-name {',
            'color: #a4b0c8; font-size: 11.5px; letter-spacing: 0.3px;',
            'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
            'grid-column: 2; grid-row: 1;',
            'padding-left: 5px;',
        '}',

        '#crpg-ui .stat-row .stat-arrow[data-dir="down"] {',
            'grid-column: 3; grid-row: 1;',
        '}',
        '#crpg-ui .stat-row .stat-arrow[data-dir="up"] {',
            'grid-column: 5; grid-row: 1;',
        '}',

        '#crpg-ui .stat-value {',
            'font-size: 14px; font-weight: 600; color: #ffffff;',
            'text-align: center; font-variant-numeric: tabular-nums;',
            'grid-column: 4; grid-row: 1;',
        '}',

        '#crpg-ui .stat-arrow {',
            'background: rgba(10,14,22,0.6);',
            'border: 1px solid rgba(120,150,200,0.25);',
            'color: #8fa4c8; cursor: pointer;',
            'width: 24px; height: 24px;',
            'font-family: inherit; font-size: 13px; font-weight: 700;',
            'transition: background 0.15s, border-color 0.15s, color 0.15s;',
            'border-radius: 3px; padding: 0;',
            'display: flex; align-items: center; justify-content: center;',
            'line-height: 1;',
        '}',
        '#crpg-ui .stat-arrow:hover:not(:disabled) {',
            'background: rgba(106,148,216,0.2);',
            'color: #ffffff; border-color: #6a94d8;',
        '}',
        '#crpg-ui .stat-arrow:disabled { opacity: 0.15; cursor: not-allowed; }',

        '#crpg-tooltip {',
            'position: fixed; z-index: 10000;',
            'max-width: 320px;',
            'background: linear-gradient(180deg, #232c3e 0%, #131a26 100%);',
            'border: 1px solid #6a94d8;',
            'border-radius: 6px;',
            'padding: 12px 16px;',
            'color: #e6e8ee;',
            'font-family: "Inter", "Noto Sans JP", "Noto Sans SC", system-ui, sans-serif;',
            'font-size: 12.5px; line-height: 1.55;',
            'box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(106,148,216,0.2);',
            'pointer-events: none;',
            'opacity: 0;',
            'transition: opacity 0.12s, transform 0.12s;',
            'transform: translateY(-4px);',
        '}',
        '#crpg-tooltip.visible { opacity: 1; transform: translateY(0); }',
        '#crpg-tooltip .tooltip-title {',
            'color: #9fb4d8; font-weight: 600; font-size: 12px;',
            'letter-spacing: 1px; text-transform: uppercase;',
            'margin-bottom: 6px; padding-bottom: 6px;',
            'border-bottom: 1px solid rgba(120,150,200,0.2);',
        '}',
        '#crpg-tooltip .tooltip-body { color: #c8cfde; }',

        '#crpg-ui .footer {',
            'grid-column: 1 / -1;',
            'display: flex; justify-content: space-between; align-items: center;',
            'padding: 0 24px;',
            'background: linear-gradient(180deg, #1b2230, #0e1219);',
            'border: 1px solid rgba(120,150,200,0.22);',
            'border-radius: 4px; box-sizing: border-box; height: 76px;',
        '}',
        '#crpg-ui .points {',
            'font-size: 12.5px; letter-spacing: 1px; color: #8fa4c8;',
            'text-transform: uppercase; font-weight: 500;',
            'min-width: 240px;',
        '}',
        '#crpg-ui .points .num {',
            'font-size: 20px; color: #6a94d8; font-weight: 700;',
            'margin-left: 10px; font-variant-numeric: tabular-nums;',
            'transition: color 0.2s;',
        '}',
        '#crpg-ui .points.zero .num { color: #7fb87f; }',

        '#crpg-ui .buttons { display: flex; gap: 10px; }',
        '#crpg-ui .btn {',
            'padding: 12px 28px; cursor: pointer;',
            'font-family: inherit; font-size: 12.5px; letter-spacing: 1.5px;',
            'text-transform: uppercase; font-weight: 600;',
            'background: rgba(10,14,22,0.6);',
            'border: 1px solid rgba(120,150,200,0.3);',
            'color: #a4b0c8; transition: all 0.15s;',
            'border-radius: 4px;',
        '}',
        '#crpg-ui .btn:hover {',
            'background: rgba(30,42,62,0.9);',
            'color: #ffffff; border-color: #6a94d8;',
        '}',
        '#crpg-ui .btn-primary {',
            'background: linear-gradient(180deg, #4a78c8, #2e4e88);',
            'color: #ffffff; border-color: #6a94d8;',
            'box-shadow: 0 4px 16px rgba(74,120,200,0.3);',
        '}',
        '#crpg-ui .btn-primary:hover:not(:disabled) {',
            'background: linear-gradient(180deg, #5a88d8, #3e5e98);',
            'box-shadow: 0 6px 24px rgba(74,120,200,0.5);',
        '}',
        '#crpg-ui .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }',

        '@media (max-width: 900px) {',
            '#crpg-ui .window { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) minmax(0, 1fr) 64px; gap: 6px; padding: 6px; }',
            '#crpg-ui .panel { padding: 12px; }',
            '#crpg-ui .split-columns { grid-template-columns: 1fr 1fr; }',
            '#crpg-ui .split-columns .col:nth-child(3) { grid-column: 1 / -1; }',
            '#crpg-ui .right-layout { grid-template-rows: 130px minmax(0, 1fr); gap: 8px; }',
            '#crpg-ui .preview-box { height: 130px; }',
            '#crpg-ui .footer { height: 64px; padding: 0 12px; }',
            '#crpg-ui .btn { padding: 9px 14px; }',
        '}'
    ].join('\n');

    var style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    // Game Param

    var PARAMS = ['mhp', 'mmp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'];
    var PARAM_ID = { mhp: 0, mmp: 1, atk: 2, def: 3, mat: 4, mdf: 5, agi: 6, luk: 7 };

    var NAME_MAX_LENGTH = 20;

    var BASE = { mhp: 100, mmp: 30, atk: 12, def: 10, mat: 10, mdf: 10, agi: 10, luk: 10 };
    var MIN  = { mhp: 50,  mmp: 10, atk: 5,  def: 5,  mat: 5,  mdf: 5,  agi: 5,  luk: 5  };
    var MAX  = { mhp: 400, mmp: 150,atk: 40, def: 40, mat: 40, mdf: 40, agi: 40, luk: 40 };
    var STEP = { mhp: 10,  mmp: 5,  atk: 1,  def: 1,  mat: 1,  mdf: 1,  agi: 1,  luk: 1  };
    var FREE_POINTS = 10;

    var CLASSES = {
        warrior:  { portraitFace: 'Actor1', portraitIndex: 0, characterName: 'Actor1', characterIndex: 0,
            bonus: { mhp: 40, mmp: 0, atk: 4, def: 6, mat: 0, mdf: 4, agi: 0, luk: 0 } },
        rogue:    { portraitFace: 'Actor1', portraitIndex: 4, characterName: 'Actor1', characterIndex: 4,
            bonus: { mhp: 10, mmp: 10, atk: 3, def: 0, mat: 0, mdf: 2, agi: 6, luk: 4 } },
        sorcerer: { portraitFace: 'Actor1', portraitIndex: 1, characterName: 'Actor1', characterIndex: 1,
            bonus: { mhp: 0, mmp: 40, atk: 0, def: 0, mat: 6, mdf: 4, agi: 2, luk: 2 } },
        cleric:   { portraitFace: 'Actor1', portraitIndex: 5, characterName: 'Actor1', characterIndex: 5,
            bonus: { mhp: 20, mmp: 30, atk: 1, def: 3, mat: 3, mdf: 6, agi: 0, luk: 2 } }
    };
    var CLASS_IDS = ['warrior', 'rogue', 'sorcerer', 'cleric'];

    var RACES = {
        human:    { bonus: { mhp: 10, mmp: 0,  atk: 1, def: 1, mat: 1, mdf: 1, agi: 1, luk: 1 } },
        elf:      { bonus: { mhp: 0,  mmp: 5,  atk: 0, def: 0, mat: 0, mdf: 0, agi: 3, luk: 2 } },
        dwarf:    { bonus: { mhp: 35, mmp: 0,  atk: 0, def: 3, mat: 0, mdf: 1, agi: 0, luk: 0 } },
        orc:      { bonus: { mhp: 20, mmp: 0,  atk: 3, def: 0, mat: 0, mdf: -1,agi: 0, luk: 0 } },
        halfling: { bonus: { mhp: 0,  mmp: 5,  atk: 0, def: 0, mat: 0, mdf: 0, agi: 3, luk: 3 } },
        gnome:    { bonus: { mhp: 0,  mmp: 5,  atk: 0, def: 0, mat: 3, mdf: 2, agi: 0, luk: 1 } }
    };
    var RACE_IDS = ['human', 'elf', 'dwarf', 'orc', 'halfling', 'gnome'];

    var ORIGINS = {
        soldier:  { bonus: { mhp: 10, atk: 1, def: 1 } },
        survivor: { bonus: { agi: 2, luk: 2 } },
        scholar:  { bonus: { mmp: 10, mat: 1, mdf: 1 } },
        acolyte:  { bonus: { mhp: 5, mmp: 5, mdf: 2 } },
        noble:    { bonus: { mmp: 5, mat: 1, luk: 2 } },
        hunter:   { bonus: { mhp: 5, atk: 1, agi: 1 } },
        artisan:  { bonus: { def: 2, mdf: 1 } },
        outcast:  { bonus: { atk: 1, agi: 1, luk: 1 } }
    };
    var ORIGIN_IDS = ['soldier', 'survivor', 'scholar', 'acolyte',
                      'noble', 'hunter', 'artisan', 'outcast'];

    // Character position                  
    var START_MAP_ID = 1, START_X = 8, START_Y = 6;

    var st = {
        name: '',
        classId: 'warrior',
        raceId: 'human',
        originId: 'soldier',
        params: {},
        portrait: { faceName: 'Actor1', faceIndex: 0 },
        character: { name: 'Actor1', index: 0 }
    };

    function sanitizeName(raw) {
        if (!raw) return '';
        var cleaned = String(raw).replace(/[0-9]/g, '');
        cleaned = cleaned.replace(/[^\p{L}\p{M}\s\-']/gu, '');
        cleaned = cleaned.replace(/\s{2,}/g, ' ');
        if (cleaned.length > NAME_MAX_LENGTH) cleaned = cleaned.slice(0, NAME_MAX_LENGTH);
        return cleaned;
    }

    function isValidName(name) {
        if (!name) return false;
        if (name.trim().length === 0) return false;
        if (name.length > NAME_MAX_LENGTH) return false;
        if (/[0-9]/.test(name)) return false;
        return true;
    }

    function rebuildParams() {
        for (var i = 0; i < PARAMS.length; i++) st.params[PARAMS[i]] = BASE[PARAMS[i]];

        var cls = CLASSES[st.classId];
        if (cls) for (var k in cls.bonus) if (cls.bonus.hasOwnProperty(k)) st.params[k] += cls.bonus[k];

        var race = RACES[st.raceId];
        if (race) for (var r in race.bonus) if (race.bonus.hasOwnProperty(r)) st.params[r] += race.bonus[r];

        var orig = ORIGINS[st.originId];
        if (orig) for (var o in orig.bonus) if (orig.bonus.hasOwnProperty(o)) st.params[o] += orig.bonus[o];
    }

    function applyClassPreset(id) {
        var cls = CLASSES[id];
        if (!cls) return;
        st.classId = id;
        rebuildParams();
        st.portrait = { faceName: cls.portraitFace, faceIndex: cls.portraitIndex };
        st.character = { name: cls.characterName, index: cls.characterIndex };
    }

    function applyRacePreset(id) {
        if (!RACES[id]) return;
        st.raceId = id;
        rebuildParams();
    }

    function applyOriginPreset(id) {
        if (!ORIGINS[id]) return;
        st.originId = id;
        rebuildParams();
    }

    function pointsSpent() {
        var spent = 0;
        var cls = CLASSES[st.classId];
        var race = RACES[st.raceId];
        var orig = ORIGINS[st.originId];
        for (var i = 0; i < PARAMS.length; i++) {
            var p = PARAMS[i];
            var baseVal = BASE[p];
            if (cls && cls.bonus[p]) baseVal += cls.bonus[p];
            if (race && race.bonus[p]) baseVal += race.bonus[p];
            if (orig && orig.bonus[p]) baseVal += orig.bonus[p];
            spent += (st.params[p] - baseVal) / STEP[p];
        }
        return Math.round(spent);
    }

    function pointsLeft() { return FREE_POINTS - pointsSpent(); }
    function canRaise(id) { return st.params[id] + STEP[id] <= MAX[id] && pointsLeft() >= 1; }
    function canLower(id) {
        var cls = CLASSES[st.classId];
        var race = RACES[st.raceId];
        var orig = ORIGINS[st.originId];
        var baseVal = BASE[id];
        if (cls && cls.bonus[id]) baseVal += cls.bonus[id];
        if (race && race.bonus[id]) baseVal += race.bonus[id];
        if (orig && orig.bonus[id]) baseVal += orig.bonus[id];
        return st.params[id] - STEP[id] >= Math.max(MIN[id], baseVal - STEP[id] * 5);
    }

    var ui = document.getElementById('crpg-ui');
    var isOpen = false;
    var tooltipEl = null;
    var faceImageCache = {};
    var portraitCtx = null;

    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        if (window.CRPG_UI && window.CRPG_UI.isOpen()) return;
        _Scene_Map_update.call(this);
    };

    function ensureTooltip() {
        if (tooltipEl) return tooltipEl;
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'crpg-tooltip';
        document.body.appendChild(tooltipEl);
        return tooltipEl;
    }

    function showTooltip(target, title, body) {
        var el = ensureTooltip();
        el.innerHTML = '<div class="tooltip-title">' + title + '</div>' +
                       '<div class="tooltip-body">' + body + '</div>';
        el.classList.add('visible');
        positionTooltip(target);
    }

    function positionTooltip(target) {
        if (!tooltipEl) return;
        var rect = target.getBoundingClientRect();
        var tw = tooltipEl.offsetWidth;
        var th = tooltipEl.offsetHeight;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var x = rect.right + 14;
        var y = rect.top - 4;
        if (x + tw > vw - 10) x = rect.left - tw - 14;
        if (y + th > vh - 10) y = vh - th - 10;
        if (y < 10) y = 10;
        tooltipEl.style.left = x + 'px';
        tooltipEl.style.top = y + 'px';
    }

    function hideTooltip() { if (tooltipEl) tooltipEl.classList.remove('visible'); }

    function bindHelpIcon(iconEl, paramId) {
        iconEl.addEventListener('mouseenter', function() {
            var t = T();
            showTooltip(iconEl, t.params[paramId] || paramId, (t.paramHints && t.paramHints[paramId]) || '');
        });
        iconEl.addEventListener('mouseleave', hideTooltip);
        iconEl.addEventListener('mousemove', function() { positionTooltip(iconEl); });
    }

    function buildDOM() {
        var t = T();
        ui.innerHTML = '\
        <div class="window">\
          <div class="panel">\
            <div class="panel-title">' + t.title + '</div>\
            <div class="name-block">\
              <div class="label">' + t.name + '</div>\
              <input type="text" class="name-input" id="crpg-name" maxlength="' + NAME_MAX_LENGTH + '" placeholder="' + t.namePlaceholder + '" autocomplete="off" spellcheck="false">\
              <div class="name-meta">\
                <span class="name-hint">' + t.nameHint + '</span>\
                <span class="name-counter" id="crpg-name-counter">0 / ' + NAME_MAX_LENGTH + '</span>\
              </div>\
            </div>\
            <div class="split-columns">\
              <div class="col">\
                <div class="label">' + t.classLabel + '</div>\
                <div class="scrollable" id="crpg-classes"></div>\
              </div>\
              <div class="col">\
                <div class="label">' + t.raceLabel + '</div>\
                <div class="scrollable" id="crpg-races"></div>\
              </div>\
              <div class="col">\
                <div class="label">' + t.originLabel + '</div>\
                <div class="scrollable" id="crpg-origins"></div>\
              </div>\
            </div>\
          </div>\
          <div class="panel">\
            <div class="panel-title">' + t.statsLabel + '</div>\
            <div class="right-layout">\
              <div class="preview-box">\
                <canvas class="portrait-canvas" id="crpg-portrait-canvas" width="144" height="144"></canvas>\
              </div>\
              <div class="info-block">\
                <div class="class-title" id="crpg-class-title"></div>\
                <div class="class-tagline" id="crpg-class-tagline"></div>\
                <div class="stat-grid" id="crpg-stats"></div>\
              </div>\
            </div>\
          </div>\
          <div class="footer">\
            <div class="points" id="crpg-points">' + t.pointsLabel + ': <span class="num">0</span></div>\
            <div class="buttons">\
              <button class="btn" id="crpg-reset">' + t.reset + '</button>\
              <button class="btn btn-primary" id="crpg-start" disabled>' + t.start + '</button>\
            </div>\
          </div>\
        </div>';
       
        var oldCanvas = document.getElementById('crpg-portrait-canvas');
        if (oldCanvas && !oldCanvas._crpgCtx) {
            var freshCanvas = document.createElement('canvas');
            freshCanvas.id = oldCanvas.id;
            freshCanvas.className = oldCanvas.className;
            freshCanvas.width = 144;
            freshCanvas.height = 144;
            oldCanvas.parentNode.replaceChild(freshCanvas, oldCanvas);
            freshCanvas._crpgCtx = freshCanvas.getContext('2d', { alpha: false });
            freshCanvas._crpgCtx.imageSmoothingEnabled = false;
            freshCanvas._crpgCtx.fillStyle = '#0c121a';
            freshCanvas._crpgCtx.fillRect(0, 0, 144, 144);
            portraitCtx = freshCanvas._crpgCtx;
        }

        var nameInput = document.getElementById('crpg-name');
        nameInput.value = st.name;

        nameInput.addEventListener('input', function(e) {
            var sanitized = sanitizeName(e.target.value);
            if (sanitized !== e.target.value) {
                var pos = e.target.selectionStart;
                var removed = e.target.value.length - sanitized.length;
                e.target.value = sanitized;
                var newPos = Math.max(0, pos - removed);
                e.target.setSelectionRange(newPos, newPos);
            }
            st.name = sanitized;
            updateNameCounter();
            updateStartButton();
        });

        nameInput.addEventListener('keydown', function(e) {
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key === 'Backspace' || e.key === 'Delete' ||
                e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                e.key === 'Home' || e.key === 'End' || e.key === 'Tab' ||
                e.key === 'Enter' || e.key === 'Escape') return;
            if (/^[0-9]$/.test(e.key)) { e.preventDefault(); return; }
        }, true);

        nameInput.addEventListener('keyup', function(e) { e.stopPropagation(); }, true);
        nameInput.addEventListener('keypress', function(e) { e.stopPropagation(); }, true);
        nameInput.addEventListener('paste', function(e) {
            e.stopPropagation();
            e.preventDefault();
            var paste = (e.clipboardData || window.clipboardData).getData('text');
            var sanitized = sanitizeName(paste);
            var start = nameInput.selectionStart;
            var end = nameInput.selectionEnd;
            var before = nameInput.value.substring(0, start);
            var after = nameInput.value.substring(end);
            var merged = sanitizeName(before + sanitized + after);
            nameInput.value = merged;
            var newPos = before.length + sanitized.length;
            nameInput.setSelectionRange(newPos, newPos);
            st.name = merged;
            updateNameCounter();
            updateStartButton();
        }, true);

        document.getElementById('crpg-classes').addEventListener('click', function(e) {
            var el = e.target.closest('.row-item');
            if (!el) return;
            applyClassPreset(el.getAttribute('data-id'));
            updateActiveRows();
            renderStats();
            renderPreview();
            renderPoints();
        });
        document.getElementById('crpg-races').addEventListener('click', function(e) {
            var el = e.target.closest('.row-item');
            if (!el) return;
            applyRacePreset(el.getAttribute('data-id'));
            updateActiveRows();
            renderStats();
            renderPoints();
        });
        document.getElementById('crpg-origins').addEventListener('click', function(e) {
            var el = e.target.closest('.row-item');
            if (!el) return;
            applyOriginPreset(el.getAttribute('data-id'));
            updateActiveRows();
            renderStats();
            renderPoints();
        });
        document.getElementById('crpg-stats').addEventListener('click', function(e) {
            var btn = e.target.closest('.stat-arrow');
            if (!btn) return;
            var paramId = btn.getAttribute('data-param');
            var dir = btn.getAttribute('data-dir');
            if (dir === 'up' && canRaise(paramId)) st.params[paramId] += STEP[paramId];
            else if (dir === 'down' && canLower(paramId)) st.params[paramId] -= STEP[paramId];
            else return;

            var valEl = document.querySelector('.stat-value[data-param="' + paramId + '"]');
            if (valEl) valEl.textContent = st.params[paramId];

            var allUps = document.querySelectorAll('.stat-arrow[data-dir="up"]');
            for (var u = 0; u < allUps.length; u++) {
                allUps[u].disabled = !canRaise(allUps[u].getAttribute('data-param'));
            }
            var allDns = document.querySelectorAll('.stat-arrow[data-dir="down"]');
            for (var d = 0; d < allDns.length; d++) {
                allDns[d].disabled = !canLower(allDns[d].getAttribute('data-param'));
            }

            renderPoints();
        });
        document.getElementById('crpg-reset').addEventListener('click', function() {
            st.name = '';
            nameInput.value = '';
            applyClassPreset('warrior');
            applyRacePreset('human');
            applyOriginPreset('soldier');
            updateActiveRows();
            renderStats();
            renderPreview();
            updateNameCounter();
            renderPoints();
        });
        document.getElementById('crpg-start').addEventListener('click', onStart);

        updateNameCounter();
    }

    function updateNameCounter() {
        var counter = document.getElementById('crpg-name-counter');
        if (!counter) return;
        var len = st.name ? st.name.length : 0;
        counter.textContent = len + ' / ' + NAME_MAX_LENGTH;
        counter.classList.remove('warn', 'max');
        if (len >= NAME_MAX_LENGTH) counter.classList.add('max');
        else if (len >= NAME_MAX_LENGTH - 5) counter.classList.add('warn');
    }

    function renderClasses() {
        var t = T();
        var html = '';
        for (var i = 0; i < CLASS_IDS.length; i++) {
            var id = CLASS_IDS[i];
            var cls = t.classes[id] || {};
            html += '<div class="row-item" data-id="' + id + '">' +
                '<div class="row-name">' + (cls.name || id) + '</div>' +
                '<div class="row-sub">' + (cls.tagline || '') + '</div>' +
                '</div>';
        }
        document.getElementById('crpg-classes').innerHTML = html;
    }

    function renderRaces() {
        var t = T();
        var html = '';
        for (var i = 0; i < RACE_IDS.length; i++) {
            var id = RACE_IDS[i];
            var race = t.races[id] || {};
            html += '<div class="row-item" data-id="' + id + '">' +
                '<div class="row-name">' + (race.name || id) + '</div>' +
                '<div class="row-sub">' + (race.desc || '') + '</div>' +
                '</div>';
        }
        document.getElementById('crpg-races').innerHTML = html;
    }

    function renderOrigins() {
        var t = T();
        var html = '';
        for (var i = 0; i < ORIGIN_IDS.length; i++) {
            var id = ORIGIN_IDS[i];
            var orig = t.origins[id] || {};
            html += '<div class="row-item" data-id="' + id + '">' +
                '<div class="row-name">' + (orig.name || id) + '</div>' +
                '<div class="row-sub">' + (orig.desc || '') + '</div>' +
                '</div>';
        }
        document.getElementById('crpg-origins').innerHTML = html;
    }

    function updateActiveRows() {
        var classItems = document.querySelectorAll('#crpg-classes .row-item');
        for (var i = 0; i < classItems.length; i++) {
            classItems[i].classList.toggle('active', classItems[i].getAttribute('data-id') === st.classId);
        }
        var raceItems = document.querySelectorAll('#crpg-races .row-item');
        for (var r = 0; r < raceItems.length; r++) {
            raceItems[r].classList.toggle('active', raceItems[r].getAttribute('data-id') === st.raceId);
        }
        var originItems = document.querySelectorAll('#crpg-origins .row-item');
        for (var j = 0; j < originItems.length; j++) {
            originItems[j].classList.toggle('active', originItems[j].getAttribute('data-id') === st.originId);
        }
    }

    function renderStats() {
        var t = T();
        var html = '';
        for (var i = 0; i < PARAMS.length; i++) {
            var id = PARAMS[i];
            var val = st.params[id];
            var canUp = canRaise(id);
            var canDn = canLower(id);
            html += '<div class="stat-row">' +
                '<div class="stat-help" data-help="' + id + '">?</div>' +
                '<div class="stat-name">' + (t.params[id] || id) + '</div>' +
                '<button class="stat-arrow" data-param="' + id + '" data-dir="down"' + (canDn ? '' : ' disabled') + '>−</button>' +
                '<div class="stat-value" data-param="' + id + '">' + val + '</div>' +
                '<button class="stat-arrow" data-param="' + id + '" data-dir="up"' + (canUp ? '' : ' disabled') + '>+</button>' +
                '</div>';
        }
        document.getElementById('crpg-stats').innerHTML = html;

        var icons = document.querySelectorAll('#crpg-stats .stat-help');
        for (var k = 0; k < icons.length; k++) {
            bindHelpIcon(icons[k], icons[k].getAttribute('data-help'));
        }
    }

    function renderPreview() {
        var t = T();
        var cls = t.classes[st.classId] || {};
        document.getElementById('crpg-class-title').textContent = cls.name || '';
        document.getElementById('crpg-class-tagline').textContent = cls.tagline || '';
        renderPortrait();
    }

    function renderPortrait() {
        var canvas = document.getElementById('crpg-portrait-canvas');
        if (!canvas) return;

        if (!portraitCtx || !canvas._crpgCtx) {
            canvas._crpgCtx = canvas.getContext('2d', { alpha: false });
            canvas._crpgCtx.imageSmoothingEnabled = false;
            canvas._crpgCtx.fillStyle = '#0c121a';
            canvas._crpgCtx.fillRect(0, 0, 144, 144);
            portraitCtx = canvas._crpgCtx;
        }

        var ctx = portraitCtx;
        ctx.imageSmoothingEnabled = false;

        var faceName = st.portrait.faceName;
        var faceIndex = st.portrait.faceIndex;
        var FRAME = 144;
        var sx = (faceIndex % 4) * FRAME;
        var sy = Math.floor(faceIndex / 4) * FRAME;

        ctx.fillStyle = '#0c121a';
        ctx.fillRect(0, 0, FRAME, FRAME);

        var cached = faceImageCache[faceName];
        if (cached && cached.complete) {
            ctx.drawImage(cached, sx, sy, FRAME, FRAME, 0, 0, FRAME, FRAME);
            return;
        }

        var img = new Image();
        img.onload = function() {
            faceImageCache[faceName] = img;
            ctx.imageSmoothingEnabled = false;
            ctx.fillStyle = '#0c121a';
            ctx.fillRect(0, 0, FRAME, FRAME);
            ctx.drawImage(img, sx, sy, FRAME, FRAME, 0, 0, FRAME, FRAME);
        };
        img.src = 'img/faces/' + faceName + '.png';
    }

    function renderPoints() {
        var t = T();
        var el = document.getElementById('crpg-points');
        var left = pointsLeft();
        var numEl = el.querySelector('.num');
        if (numEl) numEl.textContent = left;
        el.classList.toggle('zero', left === 0);
        updateStartButton();
    }

    function updateStartButton() {
        var btn = document.getElementById('crpg-start');
        if (!btn) return;
        var nameOk = isValidName(st.name);
        var pointsOk = pointsLeft() === 0;
        btn.disabled = !(nameOk && pointsOk);
    }

    function renderAll() {
        renderClasses();
        renderRaces();
        renderOrigins();
        updateActiveRows();
        renderStats();
        renderPreview();
        renderPoints();
        var nameInput = document.getElementById('crpg-name');
        if (nameInput) nameInput.value = st.name;
        updateNameCounter();
    }

    function onStart() {
        var nameInput = document.getElementById('crpg-name');
        var finalName = sanitizeName(nameInput ? nameInput.value : '').trim();
        if (!finalName || !isValidName(finalName)) {
            if (nameInput) nameInput.focus();
            return;
        }
        if (pointsLeft() !== 0) return;
        st.name = finalName;

        var actor = $gameActors.actor(1);
        if (!actor) { console.error('[CRPG] Актёр 1 не найден'); return; }

        actor.setName(finalName);
        actor.setCharacterImage(st.character.name, st.character.index);
        actor.setFaceImage(st.portrait.faceName, st.portrait.faceIndex);

        for (var i = 0; i < PARAMS.length; i++) actor.addParam(PARAM_ID[PARAMS[i]], 0);
        for (var j = 0; j < PARAMS.length; j++) {
            var p = PARAMS[j];
            var id = PARAM_ID[p];
            var base = actor.paramBase ? actor.paramBase(id) : 0;
            actor.addParam(id, st.params[p] - base);
        }

        actor.setHp(actor.mhp);
        actor.setMp(actor.mmp);

        actor._crpg = actor._crpg || {};
        actor._crpg.portrait = { faceName: st.portrait.faceName, faceIndex: st.portrait.faceIndex };
        actor._crpg.classId = st.classId;
        actor._crpg.raceId = st.raceId;
        actor._crpg.originId = st.originId;

        console.log('[CRPG] Персонаж создан:', finalName);
        console.log('  класс:', st.classId, 'раса:', st.raceId, 'происхождение:', st.originId);
        console.log('  параметры:', JSON.stringify(st.params));
        console.log('  проверка:', {
            mhp: actor.mhp, mmp: actor.mmp, atk: actor.atk, def: actor.def,
            mat: actor.mat, mdf: actor.mdf, agi: actor.agi, luk: actor.luk
        });

        $gameSwitches.setValue(1, true);
        $gamePlayer.refresh();
        $gamePlayer.reserveTransfer(START_MAP_ID, START_X, START_Y, 2, 2);

        close();
        SceneManager.goto(Scene_Map);
        if (SceneManager._scene && SceneManager._scene.startFadeIn) {
            SceneManager._scene.startFadeIn(30, false);
        }
    }

    function open(locale) {
        if (!ui) { console.error('[CRPG] #crpg-ui не найден'); return; }
        if (locale && I18N[locale]) LOCALE = locale;
        st.name = '';
        portraitCtx = null;
        applyClassPreset('warrior');
        applyRacePreset('human');
        applyOriginPreset('soldier');
        buildDOM();
        renderAll();
        ui.classList.remove('closing');
        ui.style.display = 'flex';
        ui.style.alignItems = 'center';
        ui.style.justifyContent = 'center';
        void ui.offsetWidth;
        ui.classList.add('open');
        isOpen = true;
        var nameInput = document.getElementById('crpg-name');
        if (nameInput) setTimeout(function() { nameInput.focus(); }, 100);
    }

    function close() {
        isOpen = false;
        hideTooltip();
        if (!ui) return;

        if (!ANIM.windowFadeOut) {
            ui.classList.remove('open');
            ui.style.display = 'none';
            ui.innerHTML = '';
            portraitCtx = null;
            return;
        }

        ui.classList.add('closing');
        ui.classList.remove('open');
        setTimeout(function() {
            ui.classList.remove('closing');
            ui.style.display = 'none';
            ui.innerHTML = '';
            portraitCtx = null;
        }, ANIM_TIME.window);
    }

    window.CRPG_UI = {
        open: open,
        close: close,
        isOpen: function() { return isOpen; },
        setLocale: function(l) { if (I18N[l]) LOCALE = l; }
    };

    console.log('[CRPG] crpg-ui.js load, locale:', LOCALE);

})();