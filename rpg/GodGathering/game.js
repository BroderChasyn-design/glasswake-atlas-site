(() => {
  'use strict';
  const M = window.MECHANICS;
  const saveKey = new URLSearchParams(window.location.search).get('profile') === 'rpg-offline'
    ? 'god-gathering-rpg-offline-save-v1'
    : 'glasswake-atlas-save-v1';
  let stored = null;
  try { stored = localStorage.getItem(saveKey); } catch (e) { /* Game remains playable if browser storage is disabled. */ }
  const save = stored ? safeParse(stored) : null;
  function safeParse(text) { try { return JSON.parse(text); } catch (e) { return null; } }

  const peoples = window.RELIGION_THEMES || [];
  if (peoples.length !== 8) throw new Error('Religious theme data is missing.');
  const isIslamic=card=>(peoples[card.traditionIndex] && peoples[card.traditionIndex].key)==='islamic';
  const boost10=n=>Math.round(n*1.1*10)/10;
  const scaleCard=(card,ti)=>{
    const scaled={...card,traditionIndex:ti};
    if(isIslamic(scaled)){
      for(const stat of ['attack','health','charge'])if(Number.isFinite(card[stat]))scaled[stat]=boost10(card[stat]);
      if(typeof card.abilityText==='string')scaled.abilityText=card.abilityText.replace(/\d+(?:\.\d+)?/g,n=>String(boost10(Number(n))));
    }
    return scaled;
  };
  const heroes = M.heroes.map((h,i) => {
    const ti=i%peoples.length, p=peoples[ti], cycle=Math.floor(i/peoples.length);
    const name=cycle<p.figures.length ? p.figures[cycle] : `${p.people[cycle%p.people.length]} of ${p.places[Math.floor(cycle/p.people.length)%p.places.length]}`;
    const lore=`${p.stories[(cycle+Math.floor(cycle/6))%p.stories.length]} This original game illustration is a creative interpretation, not a devotional image.`;
    return scaleCard({...h,id:`figure_${String(i+1).padStart(3,'0')}`,name,kind:'character',people:p.name,lore,artSeed:i+101,signature:i===123||i===286},ti);
  });
  const base = M.base.map((c,i) => {const ti=i%peoples.length,p=peoples[ti];return scaleCard({...c,name:p.cards[Math.floor(i/peoples.length)%p.cards.length],id:`card_${String(i+1).padStart(3,'0')}`,artSeed:i+11,lore:`${p.stories[i%p.stories.length]} This card is an original interpretation, not a sacred object. `},ti);});
  const playable = [...base,...heroes];
  const landscapes = Array.from({length:24},(_,i)=>{const ti=i%peoples.length,p=peoples[ti],place=p.places[Math.floor(i/peoples.length)%p.places.length];return {id:`vista_${String(i+1).padStart(2,'0')}`,name:place,kind:'scenic',traditionIndex:ti,lore:p.stories[i%p.stories.length],artSeed:i+801};});
  const catalog = [...playable,...landscapes];
  const noodlyCard={id:'noodly_navigator',name:'The Noodly Navigator',kind:'spell',cost:0,effect:'instant_victory',traditionIndex:0,artSeed:9801,themeKey:'noodly',exclusive:true,lore:'A playful original tribute to a flying pasta spirit. Its golden strands spiral through the clouds, and every tide seems to turn in its favor.'};
  window.GlasswakeAtlas = window.GlasswakeAtlas || {};
  window.GlasswakeAtlas.catalog = [...catalog,noodlyCard];
  const cardById = Object.fromEntries([...catalog,noodlyCard].map(c=>[c.id,c]));
  const originalBaseIds = M.base.map(c=>c.id);
  const baseIdMap = Object.fromEntries(originalBaseIds.map((id,i)=>[id,base[i].id]));
  const decks = M.decks.map((d,i)=>({
    ...d,
    name:['Path of Resolve','Path of Insight','Path of Compassion','Path of Patience','Path of Service'][i],
    tagline:['Fast units and open-lane pressure','Build Charge, then field heavy units','Healing and board control','Set traps to punish attacks','Fill lanes and support allies'][i],
    cards:d.cards.map(id=>baseIdMap[id]||id)
  }));
  const deckByKey=Object.fromEntries(decks.map(d=>[d.key,d]));
  const RARITIES=[{id:'common',name:'Common',weight:60,value:10},{id:'expensive',name:'Expensive',weight:25,value:30},{id:'extravagant',name:'Extravagant',weight:12,value:120},{id:'exquisite',name:'Exquisite',weight:3,value:500}];
  const START_VIGOR=30, LANE_COUNT=5;
  const strength=(card,n)=>isIslamic(card)?boost10(n):n;
  const fmt=n=>Number.isInteger(n)?String(n):String(Math.round(n*10)/10);
  const fresh = {coins:500,packs:0,owned:{},wins:0,matches:0,packsOpened:0,quests:{},history:[],adPrefs:{enabled:false,interests:[]},cosmetics:{owned:['tideglass'],equipped:'tideglass'}};
  const profile=Object.assign(fresh, save||{}); profile.packs=Math.max(0,Number(profile.packs)||0); profile.npcRecords=profile.npcRecords||{}; profile.owned = profile.owned || {}; profile.quests = profile.quests || {}; profile.history = profile.history || []; profile.savedDecks = profile.savedDecks || []; profile.adPrefs = profile.adPrefs || {enabled:false,interests:[]}; profile.adPrefs.interests = profile.adPrefs.interests || []; profile.cosmetics = profile.cosmetics || {owned:['tideglass'],equipped:'tideglass'}; profile.cosmetics.owned = profile.cosmetics.owned || ['tideglass']; if(!profile.cosmetics.owned.includes('tideglass'))profile.cosmetics.owned.push('tideglass'); if(!profile.cosmetics.owned.includes(profile.cosmetics.equipped))profile.cosmetics.equipped='tideglass';
  const palettes=[
    {id:'tideglass',name:'Tideglass',price:0,description:'The original sea-glass table colors.'},
    {id:'emberlight',name:'Emberlight',price:250,description:'Warm amber accents and a sunset glow.'},
    {id:'jade-current',name:'Jade Current',price:400,description:'Fresh jade accents with a calm green tide.'},
    {id:'violet-dusk',name:'Violet Dusk',price:600,description:'Soft violet highlights for the evening table.'}
  ];
  let view='home', chosenDeck=decks[0].key, selectedRival=null, match=null, selected=null, cycleMode=false, collectionFilter='All', traditionFilter='All traditions', searchText='', detailCard=null, modal=null, deckBuilderInventory=[], deckBuilderPicks=[], deckBuilderName='My Deck', customDeckItems=null;
  if(profile.starterDeckChosen)chosenDeck=profile.starterDeckChosen;
  const minerForm={wallet:'',host:'',port:'',threads:'25',tls:true};
  const minerHelperAvailable=location.protocol==='http:'&&location.hostname==='127.0.0.1'&&location.port==='8765';
  const app=document.querySelector('#app');
  const el=(tag,attrs={},children=[])=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='class')n.className=v;else if(k==='html')n.innerHTML=v;else if(k.startsWith('on')){if(v)n.addEventListener(k.slice(2).toLowerCase(),v)}else if(typeof v==='boolean')(v?n.setAttribute(k,''):n.removeAttribute(k));else if(v!==null&&v!==undefined)n.setAttribute(k,v)}for(const c of Array.isArray(children)?children:[children])if(c!=null)n.append(c instanceof Node?c:document.createTextNode(String(c)));return n};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const saveGame=()=>{try{localStorage.setItem(saveKey,JSON.stringify(profile))}catch (e) {/* Keep the current session playable without persistence. */}document.querySelector('#wallet').textContent=profile.coins.toLocaleString()};
  const toast=text=>{const old=document.querySelector('.toast');old && old.remove();const n=el('div',{class:'toast'},text);document.body.append(n);setTimeout(()=>n.remove(),2400)};
  const rarityRoll=()=>{let n=Math.random()*100;for(const r of RARITIES){n-=r.weight;if(n<0)return r}return RARITIES[0]};
  const ownedTotal=id=>Object.values(profile.owned[id]||{}).reduce((a,b)=>a+b,0);
  const ownedCommon=id=>(profile.owned[id] && profile.owned[id].common)||0;
  const ownedDesigns=()=>Object.values(profile.owned).filter(v=>Object.values(v).some(n=>n>0)).length;
  const allOwnedCopies=()=>Object.values(profile.owned).reduce((n,r)=>n+Object.values(r).reduce((a,b)=>a+b,0),0);
  const addCopy=(id,rarity='common',foil=false)=>{const key=foil?`${rarity}_foil`:rarity;profile.owned[id] = profile.owned[id] || {};profile.owned[id][key]=(profile.owned[id][key]||0)+1;};
  const marketValue=(c,rarity='common')=>Math.max(1,Math.floor(((RARITIES.find(r=>r.id===rarity)||{}).value||10)/Math.sqrt(Math.max(1,ownedTotal(c.id)))));
  const cardLore=(c)=>c.lore || baseLore(c.kind,c.artSeed);
  function baseLore(kind,i){const lines={creature:['A sure-footed scout from the salt marshes.','Its call carries farther than a lighthouse bell.','A patient hunter of the tidal pools.'],spell:['A strand of old light, shaped by a steady hand.','The current bends where this sign is drawn.','A weather charm passed between chartmakers.'],trap:['A quiet warning hidden beneath the path.','One tug wakes the small gears inside.','A snare woven from wire and river reed.'],gem:['A chip of sea-glass holds a spark of stored motion.','Its glow brightens near a strong current.','A navigator’s charge stone, cut by hand.'],character:['A familiar face at the crossroads of the atlas.','Known for reaching the harbor before the storm.','Keeps a second chart for the journey home.']};const a=lines[kind]||lines.character;return a[i%a.length]}
  function artData(c){if(c.id==='noodly_navigator'){const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 166"><defs><linearGradient id="night" x2="0" y2="1"><stop stop-color="#19283b"/><stop offset="1" stop-color="#34566a"/></linearGradient><linearGradient id="pasta" x2="1" y2="1"><stop stop-color="#fff0b0"/><stop offset=".48" stop-color="#e6a94f"/><stop offset="1" stop-color="#b96632"/></linearGradient></defs><rect width="180" height="166" fill="url(#night)"/><g fill="#fff1bd"><circle cx="24" cy="24" r="2"/><circle cx="153" cy="31" r="2"/><circle cx="42" cy="55" r="1.5"/><circle cx="137" cy="68" r="1.5"/><circle cx="25" cy="105" r="1.5"/></g><path d="M27 38q28 4 34 28t25 8q20-9 22-34m-70 42q23-14 35 7t30-2q15-10 28 4M38 111q29-16 43 1t26-3q18-12 34 0m-78-73q16 18 4 35m52-19q-17 17-10 32m-64 27q5 19-8 35m50-33q-2 17 14 29m30-36q-12 15-4 30" fill="none" stroke="url(#pasta)" stroke-width="7" stroke-linecap="round"/><path d="M56 67q4-20 23-16 13 2 14 16l-8 25-18 0Zm38 1q5-18 22-13 13 4 12 18l-10 20-18-3Z" fill="url(#pasta)" stroke="#ffe5a0" stroke-width="2"/><circle cx="74" cy="69" r="5" fill="#30263a"/><circle cx="106" cy="70" r="5" fill="#30263a"/><circle cx="75" cy="68" r="1.5" fill="#fff"/><circle cx="107" cy="69" r="1.5" fill="#fff"/><path d="M80 83q10 8 18 0" fill="none" stroke="#75462f" stroke-width="3" stroke-linecap="round"/><path d="M50 117q40 21 80 0" fill="none" stroke="#8de0d2" stroke-width="3" opacity=".8"/><path d="M8 145q24-11 48 0t48 0 48 0 28 0" fill="none" stroke="#74b6c3" stroke-width="2"/></svg>';return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg)}const n=(c.artSeed||hash(c.id))*37, hue=(n*17)%360, hue2=(hue+64+(n%82))%360, p=peoples[(c.traditionIndex==null?((c.artSeed||0)%peoples.length):c.traditionIndex)];const kind=c.kind;let motif='';
    if(kind==='character'&&p.portrait===false)motif=`<path d="M34 35h112M34 131h112M48 35v96m84-96v96" stroke="${p.accent}" stroke-width="2" opacity=".75"/><path d="M90 36 140 83 90 130 40 83Z" fill="none" stroke="${p.accent}" stroke-width="3"/><path d="M90 52 123 83 90 114 57 83Z" fill="none" stroke="#f4e5bd" stroke-width="2"/><circle cx="90" cy="83" r="12" fill="url(#orb)"/><path d="M50 52q40-38 80 0M50 114q40 38 80 0" fill="none" stroke="${p.accent}" stroke-width="2"/>`;
    else if(kind==='character')motif=`<path d="M35 147 Q42 111 72 105 L72 82 Q52 71 57 47 Q62 19 88 20 Q117 21 117 51 Q117 74 98 84 L100 105 Q130 113 139 147Z" fill="url(#robe)"/><ellipse cx="87" cy="54" rx="23" ry="28" fill="${p.tone}"/><path d="M63 48 Q61 19 87 18 Q115 18 112 49 Q100 35 88 38 Q73 42 63 48Z" fill="#283538"/><path d="M68 58h13m14 0h13" stroke="#283538" stroke-width="3"/><path d="M69 116l18 17 19-17" fill="none" stroke="#e7d19a" stroke-width="3"/><circle cx="88" cy="64" r="30" fill="none" stroke="${p.accent}" opacity=".55"/>`;
    else if(kind==='scenic') motif=`<path d="M0 111L28 81 49 100 84 54 120 95 146 69 180 102V166H0Z" fill="#233c3c"/><path d="M0 127Q40 113 83 130T180 124V166H0Z" fill="#254b53"/><path d="M0 141Q38 128 80 145T180 139" fill="none" stroke="#94d0c3" opacity=".7"/><circle cx="133" cy="43" r="19" fill="#ecd39b" opacity=".85"/><path d="M20 117l18-20 11 12 8-14" fill="none" stroke="#d9bc82" stroke-width="2"/>`;
    else if(kind==='creature') motif=`<path d="M36 103Q40 72 72 71L91 49 108 75Q133 77 142 98L128 111 124 142 112 143 108 116H67L60 143 47 143 50 113Z" fill="url(#robe)"/><path d="M93 51l-7-22 19 16m-46 38-23-17 28 6m56 6 22-22-8 35" fill="#e1c18b"/><circle cx="115" cy="84" r="3" fill="#f3d78c"/><path d="M69 104q21 9 43-2" fill="none" stroke="#e8d3a1" stroke-width="3"/>`;
    else if(kind==='spell') motif=`<circle cx="90" cy="85" r="42" fill="#18292d" stroke="#e5cd8e" stroke-width="2"/><circle cx="90" cy="85" r="29" fill="none" stroke="#a4d8c4" stroke-width="2"/><circle cx="90" cy="85" r="15" fill="url(#orb)"/><path d="M90 25v35m0 50v35M30 85h35m50 0h35M47 42l24 25m38 38 24 24m0-87-25 25m-37 38-24 24" stroke="#dce5bd" stroke-width="3"/><path d="M90 49l7 24 23 12-23 9-7 25-8-25-23-9 23-12Z" fill="#f1d89e" opacity=".8"/>`;
    else if(kind==='trap') motif=`<path d="M44 42l91 88M135 42 44 130" stroke="#c89c68" stroke-width="7"/><path d="M90 47 101 73l28 12-28 13-11 28-12-28-28-13 28-12Z" fill="#24383b" stroke="#f0d492" stroke-width="3"/><circle cx="90" cy="85" r="10" fill="#d8886d"/><path d="M37 38h14v14H37zm91 0h14v14h-14zm-91 78h14v14H37zm91 0h14v14h-14z" fill="#dfb771"/>`;
    else motif=`<path d="M90 31 127 58 116 111 90 139 64 111 53 58Z" fill="url(#orb)" stroke="#f3d99d" stroke-width="3"/><path d="M90 31v108M53 58l74 0M64 111l52 0" fill="none" stroke="#f5e6bd" opacity=".68" stroke-width="2"/><circle cx="90" cy="85" r="7" fill="#fff4c5"/>`;
    const style=p.key==='hindu'?`<g fill="none" stroke="${p.accent}" stroke-width="2" opacity=".8"><path d="M90 15q-12 12 0 24 12-12 0-24m-19 7q-3 17 14 20-1-17-14-20m38 0q-17 3-14 20 17-3 14-20"/><circle cx="90" cy="34" r="17"/></g>`:
      p.key==='buddhist'?`<g stroke="${p.accent}" stroke-width="2" opacity=".7"><circle cx="150" cy="30" r="12" fill="none"/><path d="M150 11v38m-19-19h38m-32-13 26 26m0-26-26 26"/></g>`:
      p.key==='christian'?`<g fill="none" stroke="${p.accent}" stroke-width="3" opacity=".7"><path d="M150 14v36m-12-24h24"/><path d="M15 150V80q0-22 22-22t22 22v70"/></g>`:
      p.key==='jewish'?`<g fill="none" stroke="${p.accent}" stroke-width="2" opacity=".7"><path d="M150 15v34m-12-25h24m-22 8h20m-17 8h14m-11 8h8m-24 0q0 10 8 10t8-10m-8 10v8"/><path d="m28 18 13 8v15l-13 8-13-8V26Z"/></g>`:
      p.key==='islamic'?`<g fill="none" stroke="${p.accent}" stroke-width="2" opacity=".65"><path d="M18 20 34 36 18 52 2 36Zm144 78 16 16-16 16-16-16Zm-72-95 13 13-13 13-13-13Z"/><path d="M0 75q30-32 60 0t60 0 60 0M0 145q30-32 60 0t60 0 60 0"/></g>`:
      p.key==='sikh'?`<g fill="none" stroke="${p.accent}" stroke-width="3" opacity=".75"><path d="M150 12v41m-9-33h18m-9-8-7 11 7 8 7-8Z"/><path d="M133 52h34"/></g>`:
      p.key==='shinto'?`<g fill="none" stroke="${p.accent}" stroke-width="3" opacity=".72"><path d="M126 38h44m-38 8h32m-27 0v27m22-27v27m-29 0h36"/><circle cx="31" cy="30" r="11" fill="${p.accent}" opacity=".45"/></g>`:
      `<g fill="none" stroke="${p.accent}" stroke-width="3" opacity=".72"><path d="M90 18q-22 18 0 36 22-18 0-36ZM24 130q20-20 40 0t40 0 40 0"/><circle cx="90" cy="95" r="18"/></g>`;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 166"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="hsl(${hue},34%,19%)"/><stop offset="1" stop-color="hsl(${hue2},38%,34%)"/></linearGradient><linearGradient id="robe" x2="1" y2="1"><stop stop-color="hsl(${hue2},46%,57%)"/><stop offset="1" stop-color="hsl(${hue},42%,30%)"/></linearGradient><radialGradient id="orb"><stop stop-color="#f9e8ad"/><stop offset=".42" stop-color="hsl(${hue2},73%,66%)"/><stop offset="1" stop-color="hsl(${hue},58%,35%)"/></radialGradient></defs><rect width="180" height="166" fill="url(#bg)"/>${style}<path d="M0 28 31 11l28 18 24-19 35 23 36-20 26 14M0 143l42-19 22 22 29-16 31 15 30-18 26 12" fill="none" stroke="#d5d1a3" opacity=".18"/><circle cx="22" cy="35" r="2" fill="#f5dfaa"/><circle cx="155" cy="43" r="2" fill="#f5dfaa"/>${motif}<rect x="4" y="4" width="172" height="158" rx="4" fill="none" stroke="${p.accent}" stroke-width="2"/><path d="M75 154h30" stroke="${p.accent}" stroke-width="2"/><path d="M90 150l5 5-5 5-5-5Z" fill="${p.accent}"/></svg>`;
    return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  }
  function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function cardNode(c,opts={}){const rarity=opts.rarity||'common';const foil=opts.foil||c.foil||false;const reverseHolo=opts.reverseHolo||c.reverseHolo||false;const theme=c.themeKey==='noodly'?{key:'noodly',accent:'#edbd62',name:'Noodly Mythos'}:peoples[(c.traditionIndex==null?0:c.traditionIndex)];const card=el('div',{class:`card tradition-${theme.key} ${foil?'foil':''} ${reverseHolo?'reverse-holo':''} ${opts.selected?'selected':''}`,style:`--tradition-accent:${theme.accent}`,onclick:opts.onClick||null});if(opts.count!=null)card.append(el('span',{class:'card-count'},`×${opts.count}`));const img=el('img',{class:'card-art',src:artData(c),alt:`Original ${theme.name} inspired illustration for ${c.name}`});card.append(img);const body=el('div',{class:'card-body'});body.append(el('div',{class:'card-name'},c.name));body.append(el('div',{class:'card-meta'},[el('span',{class:`rarity-${rarity}`},reverseHolo?'Reverse Holo':foil?'Foil':((RARITIES.find(r=>r.id===rarity)||{}).name||'Common')),el('span',{},meta(c))]));body.append(el('div',{class:'card-tradition'},theme.name));card.append(body);return card}
  function meta(c){if(c.kind==='gem')return `+${fmt(c.charge)} charge`;if(c.kind==='scenic')return 'atlas view';if(c.kind==='character'||c.kind==='creature')return `${c.cost} cost · ${fmt(c.attack)}/${fmt(c.health)}`;return `${c.cost} cost · ${c.kind}`}
  function display(viewName){view=viewName;detailCard=null;document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===viewName));render()}
  document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>display(b.dataset.view)));
  function header(kicker,title,desc,actions){return el('div',{class:'page-head'},[el('div',{},[el('div',{class:'eyebrow'},kicker),el('h1',{class:'title'},title),el('p',{class:'subtitle'},desc)]),el('div',{class:'toolbar'},actions||[])])}
  function stat(label,value){return el('div',{class:'stat'},[el('span',{},label),el('b',{},value)])}
  function panel(title,body){return el('section',{class:'panel'},[el('h2',{},title),body])}
  function starterCardScore(card,strategy){
    const attack=card.attack||0, health=card.health||0, cost=card.cost||0;
    let score=attack+health*.8-cost*.25;
    if(strategy==='rush')score+=(card.kind==='creature'||card.kind==='character'?6:0)+(cost<=2?5:cost>=5?-3:0);
    if(strategy==='ramp')score+=(card.kind==='gem'?8:0)+(cost>=4?5:0)+(['charge','charge2'].includes(card.ability)?7:0);
    if(strategy==='control')score+=(card.kind==='spell'?7:0)+(['heal2','heal_all','heal_weakest','sweep','disarm_all','enemy2'].includes(card.ability)?8:0);
    if(strategy==='traps')score+=(card.kind==='trap'?12:0)+(['disarm_lane','disarm_all'].includes(card.ability)?5:0);
    if(strategy==='rally')score+=(card.kind==='character'||card.kind==='creature'?5:0)+(card.ability==='rally'?12:0);
    return score;
  }
  function starterPrints(deck){
    const ranked=deck.cards.map((id,index)=>({id,index,card:cardById[id]})).sort((a,b)=>starterCardScore(b.card,deck.strategy)-starterCardScore(a.card,deck.strategy));
    const seen={}, picks=[];
    for(const item of ranked)if(!seen[item.id]){seen[item.id]=true;picks.push(item.index);if(picks.length===3)break}
    const rarityByIndex={};picks.forEach((index,n)=>rarityByIndex[index]=n===0?'exquisite':'extravagant');
    let expensive=0;
    for(let i=0;i<deck.cards.length;i++)if(rarityByIndex[i]===undefined){if(expensive<6){rarityByIndex[i]='expensive';expensive++}else rarityByIndex[i]='common'}
    return deck.cards.map((card_id,index)=>({card_id,rarity:rarityByIndex[index],foil:false,reverse_holo:false}));
  }
  function starterDescription(deck){
    const descriptions={rush:'Rush uses low-cost units to take lanes early and pressure open space.',ramp:'Ramp builds Charge with Sigils, then deploys powerful high-cost cards.',control:'Control uses healing and removal to slow the rival and win careful trades.',traps:'Traps sets snares and punishes the rival when units attack.',rally:'Rally fills lanes and boosts allies for a coordinated attack.'};
    return descriptions[deck.strategy]||deck.tagline;
  }
  function showStarterExplanation(deck,sample){
    if(modal)modal.remove();
    modal=el('div',{class:'modal-backdrop starter-explanation-backdrop',onclick:e=>{if(e.target===e.currentTarget){modal.remove();modal=null}}},el('section',{class:'modal starter-explanation'},[
      el('div',{class:'starter-explanation-art'},cardNode(sample,{rarity:'exquisite'})),
      el('div',{class:'starter-explanation-copy'},[el('div',{class:'eyebrow'},`Archetype · ${deck.strategy}`),el('h2',{},deck.name),el('p',{},starterDescription(deck)),el('p',{},`30 cards · 1 Exquisite · 2 Extravagant · 6 Expensive · 21 Common. Rarity changes collection value, not card strength.`)]),
      el('div',{class:'starter-explanation-actions'},[el('button',{class:'btn primary',onclick:()=>{modal.remove();modal=null;chooseStarterDeck(deck)}},'Choose this path'),el('button',{class:'btn ghost',onclick:()=>{modal.remove();modal=null}},'Back to all paths')])
    ]));
    document.body.append(modal);
  }
  function tutorialDeckChoice(){
    const options=decks.map(deck=>{
      const sample=cardById[deck.cards.find(id=>cardById[id]&&(cardById[id].kind==='character'||cardById[id].kind==='creature'))||deck.cards[0]];
      const icon=el('button',{class:'starter-icon',type:'button',title:`Learn about ${deck.name}`,'aria-label':`Explain the ${deck.name} deck`,onclick:()=>showStarterExplanation(deck,sample)},el('img',{src:artData(sample),alt:`${deck.name} card art`}));
      return el('article',{class:'panel starter-choice'},[icon,el('div',{class:'starter-choice-copy'},[el('div',{class:'eyebrow'},deck.strategy),el('h2',{},deck.name),el('p',{},deck.tagline)]),el('p',{class:'starter-rarity'},'30 cards · 1 Exquisite · 2 Extravagant · 6 Expensive · 21 Common'),el('button',{class:'btn primary',onclick:()=>chooseStarterDeck(deck)},'Choose this path')]);
    });
    app.replaceChildren(header('Your first lesson','Choose a starting path','Tap a card icon for an explanation. All five choices show here with the same 30-card balance and rarity mix.',[]),el('div',{class:'starter-grid'},options),el('section',{class:'panel starter-note'},[el('h3',{},'After you choose'),el('p',{},'Your deck is added to your collection and My Decks. The guided duel teaches Charge, lane placement, and ending your turn.') ]));
  }
  function chooseStarterDeck(deck){
    if(profile.starterDeckChosen)return;
    const cards=starterPrints(deck);
    cards.forEach(item=>addCopy(item.card_id,item.rarity,false));
    profile.savedDecks.push({name:`${deck.name} · Starter`,cards:cards.map(item=>({...item})),starter:true});
    profile.starterDeckChosen=deck.key;saveGame();tutorialWelcome();
  }
  function strategyLesson(strategy){
    const plans={rush:'Curve out low-cost units early, contest several lanes, then choose Attack to pressure open lanes. Do not leave all your Charge unused.',ramp:'Play Sigils early to build Charge, then spend it on the strongest units you can safely deploy. Keep enough bodies to defend while saving for expensive cards.',control:'Use removal on the most dangerous enemy, heal when it preserves a unit or your Vigor, and avoid spending every answer on small threats.',traps:'Place traps in lanes the rival is likely to attack, then use units and Defend orders to make those attacks costly. Keep trap coverage spread across lanes.',rally:'Build a board of several allies before using Rally effects. Protect key allies with Defend and use multiple lanes so one trap cannot stop your whole attack.'};
    return plans[strategy]||'Balance your curve, Charge, board presence, and lane orders.';
  }
  function rivalLesson(strategy){
    const warnings={rush:'Expect quick, low-cost units and early pressure. Contest lanes early; use Defend to blunt a strong attacker.',ramp:'Watch for a late power spike after Sigils build Charge. Save removal for a large unit and keep pressure on before it arrives.',control:'Expect healing and removal. Bait answers with modest threats, then commit a key unit when removal is spent.',traps:'Assume a lane may be trapped before attacking. Spread units across lanes and use a low-value attacker to trigger a snare.',rally:'Several allies can become dangerous together. Remove or block a support unit before the board-wide boost lands.'};
    return warnings[strategy]||'Study the rival’s board and leave yourself more than one lane to respond.';
  }
  function tutorialWelcome(){
    const deck=decks.find(item=>item.key===profile.starterDeckChosen);
    if(!deck){tutorialDeckChoice();return}
    const rivalTips=decks.filter(item=>item.key!==deck.key).map(item=>el('details',{class:'tutorial-hazard'},[el('summary',{},`${item.name} · ${item.strategy}`),el('p',{},rivalLesson(item.strategy))]));
    const earned=!!profile.tutorialRewardClaimed;
    app.replaceChildren(
      header('Guided lesson','Learn your deck, then beat the rival',`${deck.name} is your starter. This tutorial match can be retried until you win.${earned?' Your five-pack tutorial reward has already been claimed.':''}`,[]),
      el('div',{class:'grid tutorial-briefing-grid'},[
        el('section',{class:'panel tutorial-welcome'},[
          el('div',{class:'eyebrow'},'Your strategy · '+deck.strategy),el('h2',{},deck.name),el('p',{},strategyLesson(deck.strategy)),
          el('h3',{},'Step-by-step match plan'),
          el('ol',{},[
            el('li',{},'Play a Sigil first when you need Charge. Sigils do not use one of your three action plays.'),
            el('li',{},'Deploy units into different open lanes. Keep enough Charge to react to the rival.'),
            el('li',{},'Set each unit to Attack or Defend. Attacks deal full damage; a defender counters an attacker at half strength.'),
            el('li',{},'Before ending your turn, check five lane rows: unit, trap, and utility spaces. Ward protects; Heal restores.'),
            el('li',{},'End the turn to resolve attacks and traps, then adjust your plan. Win by bringing the rival to 0 Vigor.')
          ]),
          el('p',{class:'tutorial-reward-note'},earned?'Reward claimed: 5 booster packs.': 'First win reward: 5 booster packs. A loss keeps the tutorial available so you can try again.'),
          el('div',{class:'hero-buttons'},[
            el('button',{class:'btn primary',onclick:()=>startStarterTutorial()},earned?'Replay guided match':'Start / retry guided match'),
            el('button',{class:'btn',onclick:()=>display('collection')},'View collection'),
            el('button',{class:'btn ghost',onclick:()=>display('mydecks')},'View My Decks')
          ])
        ]),
        el('section',{class:'panel tutorial-hazards'},[el('div',{class:'eyebrow'},'Other archetypes to watch'),el('h2',{},'Know the rival’s plan'),el('p',{},'These are the four AI styles you can challenge after the tutorial. Open each for its warning and response.'),...rivalTips])
      ])
    );
  }
  function startStarterTutorial(){
    try{
      const deck=decks.find(item=>item.key===profile.starterDeckChosen);
      if(!deck){toast('Choose a starting path before beginning the tutorial.');tutorialDeckChoice();return}
      let starter=profile.savedDecks.find(item=>item.starter&&item.cards&&item.cards.length===30);
      if(!starter){starter={name:`${deck.name} · Starter`,cards:starterPrints(deck),starter:true};profile.savedDecks.push(starter);saveGame()}
      const rival=decks.find(item=>item.key!==deck.key);
      if(!rival)throw new Error('No practice opponent deck is available.');
      chosenDeck=deck.key;selectedRival=rival.key;customDeckItems=starter.cards.map(item=>({...item}));
      startMatch(true,rival.key);
      if(!match)throw new Error('The match did not initialize.');
    }catch(error){
      console.error('Could not start the guided duel:',error);
      view='home';
      app.replaceChildren(header('Tutorial setup','The guided duel could not start','The game hit an error while preparing the match. You can retry below.',[]),el('section',{class:'panel account-panel account-error'},[el('p',{},error.message||'Unknown setup error.'),el('button',{class:'btn primary',onclick:()=>tutorialWelcome()},'Back to tutorial') ]));
    }
  }
  function home(){
    if(!profile.starterDeckChosen){tutorialDeckChoice();return}
    const unique=ownedDesigns(),pct=Math.floor(unique/catalog.length*100);
    const hero=el('section',{class:'hero'},[el('div',{class:'hero-copy'},[el('div',{class:'eyebrow'},'Stories and art from living traditions'),el('h1',{class:'title'},'Many paths.\nOne card table.'),el('p',{class:'subtitle'},'Explore original card art inspired by Hindu, Buddhist, Christian, Jewish, Islamic, Sikh, Shinto, and Yorùbá/Ifá traditions. Sacred stories and figures appear alongside places, teachings, and symbols; the three-lane duel rules stay the same.'),el('div',{class:'hero-buttons'},[el('button',{class:'btn primary',onclick:()=>newMatch()},'Begin a Duel'),el('button',{class:'btn ghost',onclick:()=>display('collection')},'View Collection')])]),el('div',{class:'hero-art'},[cardNode(cardById['card_036'],{onClick:()=>display('collection')}),cardNode(cardById['figure_124'],{onClick:()=>display('collection')}),cardNode(landscapes[11],{onClick:()=>display('collection')})])]);
    const stats=el('div',{class:'grid stats'},[stat('Designs found',`${unique} / ${catalog.length}`),stat('Duels won',profile.wins),stat('Packs opened',profile.packsOpened),stat('Marks',profile.coins)]);
    const quests=el('div',{class:'quest-list'},questRows());
    const left=el('section',{class:'panel'},[el('div',{class:'eyebrow'},'Milestones'),el('h2',{},'Your Collection'),el('p',{},'Wins and newly discovered designs bring booster packs.'),quests]);
    const lore=el('section',{class:'panel'},[el('div',{class:'eyebrow'},'About this edition'),el('h2',{},'Inspired by living traditions'),el('p',{},'The collection draws on selected stories and visual traditions from eight religions. Each card is an original, brief interpretation; the references are not comprehensive and do not replace learning from practitioners or sacred sources.'),el('p',{},'The same five strategic deck styles and three-lane duel remain. Card names, lore, and generated illustrations now carry the religious themes.')]);
    const placement=adSlot();
    const lesson=profile.tutorialRewardClaimed?el('section',{class:'panel tutorial-step'},[el('div',{class:'eyebrow'},'Guided lesson complete'),el('p',{},'You earned the five booster pack tutorial reward. Revisit the strategy notes or replay the practice match any time.'),el('button',{class:'btn',onclick:()=>tutorialWelcome()},'Tutorial & archetype guide')]):el('section',{class:'panel tutorial-step'},[el('div',{class:'eyebrow'},'Tutorial · reward waiting'),el('p',{},'Beat the guided match to earn 5 booster packs. If you lose, retry it from here.'),el('button',{class:'btn primary',onclick:()=>tutorialWelcome()},'Continue tutorial')]);
    app.replaceChildren(hero,stats,...(lesson?[lesson]:[]),...(placement?[placement]:[]),el('div',{class:'grid home-lower'},[left,lore]));
  }
  const adTopics=[['strategy','Deck strategy'],['fantasy','Fantasy worlds'],['illustration','Card illustration'],['collecting','Collectibles']];
  const demoCampaigns=[
    {brand:'The Drafting Table',topic:['strategy'],headline:'Think a turn ahead.',copy:'A sample placement for tabletop tactics and deckbuilding readers.',offer:'DEMO CAMPAIGN'},
    {brand:'Ink & Current',topic:['illustration','collecting'],headline:'Meet the makers behind the cards.',copy:'A sample placement for original illustration and collectible art.',offer:'DEMO CAMPAIGN'},
    {brand:'Far Lantern Press',topic:['fantasy'],headline:'Find your next strange shore.',copy:'A sample placement for independent fantasy stories and games.',offer:'DEMO CAMPAIGN'}
  ];
  function adSlot(){if(!profile.adPrefs.enabled||!profile.adPrefs.interests.length)return null;const matches=demoCampaigns.filter(c=>c.topic.some(t=>profile.adPrefs.interests.includes(t)));if(!matches.length)return null;const c=matches[profile.wins%matches.length];return el('section',{class:'ad-slot'},[el('div',{},[el('div',{class:'eyebrow'},`Sponsored preview · ${c.offer}`),el('h3',{},c.brand),el('p',{},c.headline),el('span',{},c.copy)]),el('div',{class:'ad-mark'},'✧'),el('button',{class:'btn ghost',onclick:()=>display('adcenter')},'Ad preferences')])}
  function questRows(){const q=[['Win your first duel',profile.wins>=1,profile.wins,1],['Win five duels',profile.wins>=5,profile.wins,5],['Discover 105 designs',ownedDesigns()>=105,ownedDesigns(),105],['Complete the Atlas',ownedDesigns()>=420,ownedDesigns(),420]];return q.map(([name,done,n,total],i)=>el('div',{class:'quest-row'},[el('div',{},[el('span',{},name),el('div',{class:'progress'},el('i',{style:`width:${Math.min(100,n/total*100)}%`}))]),el('b',{},done?'CLAIMED':`${n}/${total}`)]))}
  function collection(){
    if(detailCard){const c=detailCard,tradition=peoples[(c.traditionIndex==null?0:c.traditionIndex)].name;const actions=[el('button',{class:'btn',onclick:()=>{detailCard=null;render()}},'Back to collection')];if(ownedTotal(c.id)>1)actions.push(el('button',{class:'btn primary',onclick:()=>sellCopy(c)},'Trade one duplicate'));app.replaceChildren(header('Collection','Card Study',`Illustrated entry · ${c.kind==='scenic'?'vista':c.kind}`,actions),el('div',{class:'detail'},[cardNode(c,{rarity:'common',count:ownedTotal(c.id)}),el('div',{class:'detail-copy'},[el('div',{class:'eyebrow'},`${tradition} · ${c.kind==='scenic'?'place':'story'}`),el('h2',{},c.name),el('p',{},cardLore(c)),el('p',{},isIslamic(c)?'Balance rule: Islamic story designs have half the pack selection weight of other designs. Numeric combat stats, Charge values, and ability effects are 10% higher; card costs are unchanged.':'This is an original game interpretation informed by a living religious tradition; it is not a substitute for its sacred texts or practices.'),el('div',{class:'detail-stats'},statPiece(c)),el('p',{},`Copies in your binder: ${ownedTotal(c.id)}.`),el('p',{},`Current market value: ${marketValue(c)} marks.`)])]));return;}
    const filters=['All','Characters','Creatures','Spells','Traps','Sigils','Vistas'];
    const filter=el('div',{class:'filter-list'},filters.map(f=>el('button',{class:collectionFilter===f?'selected':'',onclick:()=>{collectionFilter=f;render()}},`${f} ${f==='All'?`(${catalog.length})`:''}`)));
    const sidebar=el('aside',{class:'panel filter-panel'},[el('h3',{},'Browse atlas'),filter,el('div',{style:'margin-top:20px'},[el('div',{class:'eyebrow'},'Collection progress'),el('p',{},`${ownedDesigns()} of 420 designs discovered.`),el('div',{class:'progress'},el('i',{style:`width:${ownedDesigns()/420*100}%`}))])]);
    const search=el('input',{class:'input',placeholder:'Find a card…',value:searchText,oninput:e=>{searchText=e.target.value;fillCards()}});
    const traditionSelect=el('select',{class:'select',onchange:e=>{traditionFilter=e.target.value;fillCards()}},[el('option',{value:'All traditions'},'All traditions'),...peoples.map(p=>el('option',{value:p.name},p.name))]);traditionSelect.value=traditionFilter;
    const top=header('The 420-card collection','Traditions Library','Explore original card art and short notes inspired by eight religious traditions. Open packs to add copies; foil pulls are tracked separately.',[search,traditionSelect]);
    const grid=el('div',{class:'card-grid',id:'collection-grid'});function fillCards(){const found=catalog.filter(c=>{const kindOK=collectionFilter==='All'||({Characters:c.kind==='character',Creatures:c.kind==='creature',Spells:c.kind==='spell',Traps:c.kind==='trap',Sigils:c.kind==='gem',Vistas:c.kind==='scenic'})[collectionFilter],traditionOK=traditionFilter==='All traditions'||peoples[(c.traditionIndex==null?0:c.traditionIndex)].name===traditionFilter;return kindOK&&traditionOK&&c.name.toLowerCase().includes(searchText.toLowerCase())});grid.replaceChildren(...found.map(c=>cardNode(c,{count:ownedTotal(c.id),onClick:()=>{detailCard=c;render()}})));if(!found.length)grid.append(el('div',{class:'empty'},'No cards match these filters.'));}
    app.replaceChildren(top,el('div',{class:'collection-layout'},[sidebar,grid]));fillCards();
  }
  const archetypeFallback=c=>c.kind==='gem'?'ramp':c.kind==='trap'?'traps':c.kind==='spell'?'control':c.kind==='creature'?'rush':'rally';
  function offlineInventory(){return Object.entries(profile.owned).flatMap(([card_id,prints])=>Object.entries(prints).filter(([,quantity])=>quantity>0).map(([print,quantity])=>({card_id,quantity,rarity:print.endsWith('_foil')?print.slice(0,-5):print,foil:print.endsWith('_foil'),reverse_holo:false})));}
  function renderArchetypes(items){
    const playable=(items||[]).filter(item=>cardById[item.card_id]&&cardById[item.card_id].kind!=='scenic'&&item.quantity>0);
    const groups=decks.map(d=>({...d,items:playable.filter(item=>d.cards.includes(item.card_id)||(!decks.some(other=>other.cards.includes(item.card_id))&&archetypeFallback(cardById[item.card_id])===d.strategy))}));
    const sections=groups.map(group=>{const cards=group.items.map(item=>cardNode(cardById[item.card_id],{count:item.quantity,rarity:item.rarity,foil:item.foil,reverseHolo:item.reverse_holo}));return el('section',{class:'panel archetype-section'},[el('div',{class:'eyebrow'},group.strategy),el('h2',{},group.name),el('p',{class:'account-subtitle'},`${group.items.length} designs · ${group.tagline}`),cards.length?el('div',{class:'card-grid'},cards):el('p',{class:'account-empty'},'No cards in this archetype yet.')]);});
    app.replaceChildren(header('Card organization','Archetype Collections','Your playable cards are grouped by the five deck styles. Cards used by a preset can appear in more than one archetype.',[el('button',{class:'btn',onclick:openAccountDeckBuilder},'Build a deck')]),...sections);
  }
  async function showArchetypes(){
    app.replaceChildren(header('Card organization','Archetype Collections','Loading your account binder…',[]));
    try{const loader=(window.GlasswakeAtlas && window.GlasswakeAtlas.loadOnlineInventory);if(typeof loader==='function'){const items=await loader();renderArchetypes(items);return}}catch (e) {/* Offline collection view remains available. */}
    renderArchetypes(offlineInventory());
  }
  function renderSavedDecks(){
    const cards=profile.savedDecks.map((deck,index)=>el('article',{class:'panel saved-deck-card'},[
      el('div',{class:'eyebrow'},`${deck.cards.length} cards`),
      el('h2',{},deck.name),
      el('p',{class:'account-subtitle'},`${deck.cards.filter(c=>(cardById[c.card_id] && cardById[c.card_id].kind)==='gem').length} sigils · saved on this device`),
      el('div',{class:'hero-buttons'},[
        el('button',{class:'btn primary',onclick:()=>{customDeckItems=deck.cards.map(item=>({...item,...cardById[item.card_id]}));chosenDeck=profile.starterDeckChosen||decks[0].key;selectedRival=null;display('match')}},'Play deck'),
        el('button',{class:'btn ghost',onclick:()=>{profile.savedDecks.splice(index,1);saveGame();renderSavedDecks()}},'Delete')
      ])
    ]));
    app.replaceChildren(header('Your saved decks','My Decks','Decks you build from your account binder stay here on this device, ready to play again.',[
      el('button',{class:'btn primary',onclick:openAccountDeckBuilder},'Build a deck'),
      el('button',{class:'btn',onclick:()=>display('match')},'Preset decks')
    ]),cards.length?el('div',{class:'saved-deck-grid'},cards):el('section',{class:'panel empty'},'No saved decks yet. Build one from your account binder.'));
  }
  function statPiece(c){if(c.kind==='scenic')return [el('b',{},'Vista')];if(c.kind==='gem')return [el('b',{},`+${fmt(c.charge)} charge`)];return [el('b',{},`${c.cost} cost`),...((c.attack!=null)?[el('b',{},`${fmt(c.attack)} ATK`),el('b',{},`${fmt(c.health)} VIG`)] : [])]}
  function market(){
    const earnedPacks=Math.max(0,Number(profile.packs)||0);
    const pack=el('section',{class:'panel booster'},[el('div',{class:'pack-art'}),el('div',{},[el('div',{class:'eyebrow'},`Five cards · ${earnedPacks} sealed packs in your Packs tab`),el('h2',{},'A sealed chart pack'),el('p',{},'Every pack contains five different designs selected from the complete 420-card set. Rarity is rolled for each card; playable cards have a separate foil chance.'),el('p',{},'Islamic story designs have half the pull weight of each other design. Their numeric gameplay values are boosted by 10%; their Charge costs stay the same.'),el('p',{},'A card cannot repeat inside one pack. Duplicates across later packs add to your binder and lower that design’s market value.'),el('button',{class:'btn primary',disabled:profile.coins<100,onclick:buyPack},'Buy a sealed pack · 100 marks')])]);
    const paletteCards=palettes.map(palette=>{const owned=profile.cosmetics.owned.includes(palette.id),equipped=profile.cosmetics.equipped===palette.id;return el('article',{class:`palette-card palette-preview-${palette.id}`},[el('div',{class:'palette-swatch'},'✦'),el('div',{},[el('h3',{},palette.name),el('p',{},palette.description),el('small',{},owned?'Owned · saved on this device':`${palette.price} marks · local purchase`) ]),el('button',{class:equipped?'btn':'btn primary',disabled:equipped,onclick:()=>buyPalette(palette.id)},equipped?'Equipped':owned?'Equip':`Buy · ${palette.price} marks`)])});
    const cosmetics=el('section',{class:'panel cosmetics-shop'},[el('div',{class:'eyebrow'},'Offline cosmetics'),el('h2',{},'Table palettes'),el('p',{},'Buy and equip these color themes with marks. Purchases save on this device and work without an account or internet connection.'),el('div',{class:'palette-list'},paletteCards)]);
    const odds=el('section',{class:'panel'},[el('div',{class:'eyebrow'},'Pull rates'),el('h2',{},'Four print runs'),el('table',{class:'table'},el('tbody',{},RARITIES.map(r=>el('tr',{},[el('td',{class:`rarity-${r.id}`},r.name),el('td',{},`${r.weight}% per card`),el('td',{},`${r.value} mark base value`)])))),el('p',{},'Most playable designs have a 2% foil chance per card. Two signature portraits have a 0.5% foil chance each. Foil art catches the light and is worth 50× the print run value before supply adjustment.')]);
    const trade=el('section',{class:'panel'},[el('div',{class:'eyebrow'},'Harbor exchange'),el('h2',{},'Trade a duplicate'),el('p',{},'The chartroom will buy one spare copy of a design you already own. Values fall with supply across all print runs.'),el('button',{class:'btn',onclick:()=>{display('collection')}},'Choose from your collection')]);
    app.replaceChildren(header('Packs & trade','Booster Hall','Spend local marks on packs and table palettes. Your purchases and collection stay on this device when you play offline.',[]),el('div',{class:'grid market-layout'},[pack,cosmetics,odds,trade]));
  }
  function packsView(){
    const count=Math.max(0,Number(profile.packs)||0);
    const actions=count?[el('button',{class:'btn primary',onclick:()=>openStoredPacks(1)},'Open one pack'),el('button',{class:'btn',onclick:()=>openStoredPacks(count)},`Open all · ${count}`)]:[];
    app.replaceChildren(header('Your sealed boosters','Packs',`${count} unopened pack${count===1?'':'s'}. Open them here one at a time or all at once.`,actions),count?el('section',{class:'panel sealed-pack-shelf'},Array.from({length:Math.min(count,60)},(_,i)=>el('button',{class:'sealed-pack',onclick:()=>openStoredPacks(1),'aria-label':`Open sealed booster ${i+1}`},[el('span',{},'✦'),el('b',{},'GOD GATHERING'),el('small',{},'SEALED PACK')])).concat(count>60?[el('p',{class:'account-help'},`And ${count-60} more sealed packs…`)]:[])):el('section',{class:'panel empty'},'No sealed packs yet. Buy one in Booster Hall or earn packs by playing.'));
  }
  function buyPalette(id){const palette=palettes.find(item=>item.id===id);if(!palette)return;if(profile.cosmetics.owned.includes(id)){profile.cosmetics.equipped=id;saveGame();render();toast(`${palette.name} palette equipped.`);return}if(profile.coins<palette.price){toast(`You need ${palette.price} marks for ${palette.name}.`);return}profile.coins-=palette.price;profile.cosmetics.owned.push(id);profile.cosmetics.equipped=id;saveGame();render();toast(`${palette.name} palette added to your collection.`)}
  function rules(){
    const sections=[['The match','Each side begins at 30 Vigor, 2 Charge, and a five-card hand. There is no round limit. A duel ends when one side reaches 0 Vigor.'],['Charge & turns','At the start of your turn, gain 1 Charge (maximum 10) and draw back to five cards when possible. Play a sigil to gain its printed Charge without spending an action. You may cycle one card from hand each turn, and play up to three action cards.'],['Five lanes and orders','Each lane has a unit slot, a trap slot, and a utility slot. Choose Attack or Defend for each unit before ending your turn. Attacks deal full damage to opposing units or an open rival; Defenders take the hit and counter at half strength.'],['Trap and utility slots','Each lane has its own trap and utility space. Snares trigger when an enemy attacks that lane. Ward and Heal can be placed in a utility space and activate when a friendly unit is there. Other signs resolve immediately.'],['Five strategic paths','Path of Resolve favors fast attackers. Path of Insight builds Charge for expensive cards. Path of Compassion heals and controls the board. Path of Patience uses snares and defense. Path of Service fills lanes and supports allies. These are game strategies, not names for religious communities.'],['Traditions collection','There are 396 playable designs and 24 scenic cards inspired by eight traditions. Pack pulls five distinct designs. The collection page filters by card type and tradition. Card art and lore are original game interpretations.']];
    const panels=sections.map(([title,copy])=>el('section',{class:'panel'},[el('h3',{},title),el('p',{},copy)]));
    app.replaceChildren(header('Rules & lore','Field Guide','The quick read for your first voyage. The same five-deck duel, rebuilt as an independent browser game.',[]),el('div',{class:'grid guide-grid'},panels));
  }
  function adcenter(){
    const p=profile.adPrefs;
    const toggle=el('label',{class:'ad-consent'},[el('input',{type:'checkbox',checked:!!p.enabled,onchange:e=>{p.enabled=e.target.checked;saveGame();render()}}),el('span',{},[el('b',{},'Allow interest-based sponsor previews'),el('small',{},'Off by default. Change or withdraw this choice at any time.')])]);
    const chips=el('div',{class:'interest-list'},adTopics.map(([key,label])=>el('button',{class:`interest-chip ${p.interests.includes(key)?'selected':''}`,disabled:!p.enabled,onclick:()=>{p.interests=p.interests.includes(key)?p.interests.filter(x=>x!==key):[...p.interests,key];saveGame();render()}},[el('span',{},p.interests.includes(key)?'✓':'＋'),label])));
    const matches=p.enabled?demoCampaigns.filter(c=>c.topic.some(t=>p.interests.includes(t))):[];
    const preview=matches.length?matches.map(c=>el('article',{class:'campaign-preview'},[el('div',{class:'eyebrow'},c.offer),el('h3',{},c.brand),el('b',{},c.headline),el('p',{},c.copy),el('div',{class:'ad-tags'},c.topic.map(t=>el('span',{},(adTopics.find(x=>x[0]===t)||[])[1]||t)))])):el('div',{class:'empty'},p.enabled?'Choose one or more interests to preview a matching placement.':'Interest-based placement is off. Enable it to see a local preview.');
    const settings=el('section',{class:'panel'},[el('div',{class:'eyebrow'},'Player controls'),el('h2',{},'Choose what you want to see'),el('p',{},'This prototype uses only the topics you select here. It does not read your match history or collection to pick an ad.'),toggle,el('div',{class:'interest-list'},chips),el('p',{class:'privacy-note'},'Your selected interests stay in this browser. Campaigns are sample content; no ad network is connected. Mining and wallet details are handled separately and are never used to select ads.')]);
    const previewPanel=el('section',{class:'panel'},[el('div',{class:'eyebrow'},'Local matching · no network request'),el('h2',{},'Placement preview'),preview]);
    const minerStatus=el('div',{class:'miner-status',id:'miner-status'},'Checking local miner helper…');
    const minerLog=el('pre',{class:'miner-log',id:'miner-log'},'Miner output appears here after you start it.');
    const wallet=el('input',{class:'input miner-input',type:'text',autocomplete:'off',spellcheck:'false',placeholder:'Your Monero payout address',value:minerForm.wallet,oninput:e=>minerForm.wallet=e.target.value});
    const pool=el('input',{class:'input miner-input',type:'text',autocomplete:'off',spellcheck:'false',placeholder:'Pool host (for example, your chosen pool)',value:minerForm.host,oninput:e=>minerForm.host=e.target.value});
    const port=el('input',{class:'input miner-port',type:'number',min:'1',max:'65535',placeholder:'Port',value:minerForm.port,oninput:e=>minerForm.port=e.target.value});
    const threads=el('select',{class:'select',onchange:e=>minerForm.threads=e.target.value},[el('option',{value:'25',selected:minerForm.threads==='25'},'CPU limit hint · 25%'),el('option',{value:'50',selected:minerForm.threads==='50'},'CPU limit hint · 50%')]);
    const tls=el('label',{class:'miner-tls'},[el('input',{type:'checkbox',checked:minerForm.tls,onchange:e=>minerForm.tls=e.target.checked}),el('span',{},'Use TLS for the pool connection')]);
    const start=el('button',{class:'btn primary',id:'miner-start',onclick:startMining},'Start optional mining');
    const stop=el('button',{class:'btn',id:'miner-stop',onclick:stopMining,disabled:true},'Stop mining');
    const miner=el('section',{class:'panel miner-panel'},[el('div',{class:'eyebrow'},'Optional · Monero RandomX'),el('h2',{},'Compute participation'),el('p',{},'Mining is off until you press Start. Rewards go directly to the public wallet address you enter; this game never asks for a seed phrase.'),minerStatus,minerLog,el('label',{class:'field-label'},['Payout address',wallet]),el('div',{class:'pool-fields'},[el('label',{class:'field-label'},['Pool host',pool]),el('label',{class:'field-label'},['Port',port])]),threads,tls,el('div',{class:'miner-buttons'},[start,stop]),el('p',{class:'privacy-note'},'The selected pool receives your wallet address and network connection. Your address is held in page memory only; it is not saved in the game profile. CPU limits are miner hints, not a guarantee of exact power use. Mining stops if you press Stop, close this tab, or shut down the helper.')]);
    app.replaceChildren(header('Advertising & rewards','Sponsor Lab','Opt in to player-selected ad previews or optional Monero mining. Each setting is separate.',[]),el('div',{class:'grid ad-layout'},[settings,previewPanel,miner]));
    refreshMinerStatus();
  }
  async function refreshMinerStatus(){const box=document.querySelector('#miner-status'),start=document.querySelector('#miner-start'),stop=document.querySelector('#miner-stop');if(!box)return;if(!minerHelperAvailable){box.textContent='Miner helper is not connected. Use launch.cmd to enable this optional feature.';if(start)start.disabled=true;if(stop)stop.disabled=true;return}try{const res=await fetch('/api/miner/status',{cache:'no-store',headers:{'X-Glasswake-App':'1'}}),data=await res.json();if(!res.ok)throw new Error(data.error||'Local helper unavailable');box.textContent=data.running?`Mining is ON · process ${data.pid} · CPU limit hint ${data.threadsHint}%`:(data.xmrigAvailable?'Mining is OFF. XMRig is available; it starts only after your click.':'Mining is OFF. Install the official XMRig binary and put xmrig.exe beside the helper.');if(start)start.disabled=!data.xmrigAvailable||data.running;if(stop)stop.disabled=!data.running;if(data.lastOutput&&box){const log=document.querySelector('#miner-log');if(log)log.textContent=data.lastOutput}}catch(e){box.textContent=`Local helper error: ${e.message}`;if(start)start.disabled=true;if(stop)stop.disabled=true}}
  async function startMining(){if(!minerHelperAvailable){toast('Launch the game with launch.cmd to use the local miner helper.');return}if(!minerForm.wallet.trim()||!minerForm.host.trim()||!minerForm.port){toast('Enter your payout address and the pool host and port.');return}const button=document.querySelector('#miner-start');if(button)button.disabled=true;try{const res=await fetch('/api/miner/start',{method:'POST',headers:{'Content-Type':'application/json','X-Glasswake-App':'1'},body:JSON.stringify({wallet:minerForm.wallet.trim(),host:minerForm.host.trim(),port:Number(minerForm.port),threadsHint:Number(minerForm.threads),tls:minerForm.tls})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not start miner');toast('Miner started. You can stop it here at any time.');await refreshMinerStatus()}catch(e){toast(`Miner not started: ${e.message}`);if(button)button.disabled=false}}
  async function stopMining(){if(!minerHelperAvailable)return;try{const res=await fetch('/api/miner/stop',{method:'POST',headers:{'Content-Type':'application/json','X-Glasswake-App':'1'},body:'{}'});const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not stop miner');toast('Mining stopped.');await refreshMinerStatus()}catch(e){toast(`Could not stop miner: ${e.message}`)}}
  function newMatch(){match=null;selected=null;selectedRival=null;customDeckItems=null;cycleMode=false;display('match')}
  const npcRoster={
    rush:{name:'Pip Quickcurrent',icon:'⚡',intro:'A bold early attacker who teaches tempo and open-lane pressure.'},
    ramp:{name:'Mara Deepwell',icon:'◈',intro:'A patient planner who saves Charge for powerful plays.'},
    control:{name:'Sable Quietwater',icon:'☼',intro:'A careful tactician who answers threats and outlasts rivals.'},
    traps:{name:'Niko Wirewise',icon:'⌁',intro:'A clever ambusher who rewards reading the rival’s next move.'},
    rally:{name:'Toma Brightchorus',icon:'✦',intro:'A team captain who fills lanes and strengthens allies.'}
  };
  function matchHome(){
    const picker=el('div',{class:'deck-picker'},decks.map(d=>el('button',{class:`deck-choice ${chosenDeck===d.key&&!customDeckItems?'chosen':''}`,onclick:()=>{chosenDeck=d.key;customDeckItems=null;selectedRival=null;render()}},[el('span',{},d.strategy),el('h3',{},d.name),el('p',{},d.tagline)])));
    const rivals=decks.filter(d=>d.key!==chosenDeck);
    const opponentCards=rivals.map(deck=>{
      const npc=npcRoster[deck.strategy],sample=cardById[deck.cards.find(id=>cardById[id]&&(cardById[id].kind==='character'||cardById[id].kind==='creature'))||deck.cards[0]],record=(profile.npcRecords&&profile.npcRecords[deck.key])||{wins:0,matches:0};
      return el('article',{class:'panel npc-card'},[el('div',{class:'npc-portrait','aria-hidden':'true'},npc.icon),el('div',{class:'npc-info'},[el('div',{class:'eyebrow'},`${deck.strategy} · ${record.wins} wins`),el('h2',{},npc.name),el('p',{},npc.intro)]),el('img',{class:'npc-deck-art',src:artData(sample),alt:`${deck.name} card art`}),el('button',{class:'btn primary',onclick:()=>challengeNPC(deck.key)},'Challenge')]);
    });
    app.replaceChildren(header('Practice table','Choose an opponent','Pick your deck, then challenge any of the other four archetypes. Each rival uses that archetype’s AI deck; there is no required order.',[]),el('section',{class:'panel practice-deck-picker'},[el('div',{class:'eyebrow'},'Your deck'),el('h2',{},'Choose your archetype'),el('p',{},'The opponent list updates to show every archetype except the one you selected.'),picker]),el('div',{class:'npc-grid'},opponentCards));
  }
  function challengeNPC(key){
    if(key===chosenDeck){toast('Choose a rival using a different archetype.');return}
    selectedRival=key;startMatch(false);
  }
  function openAccountDeckBuilder(){
    const loader=(window.GlasswakeAtlas && window.GlasswakeAtlas.loadOnlineInventory);
    app.replaceChildren(header('Account collection','Deck builder','Loading your playable reverse-holo cards…',[]));
    const inventoryRequest=typeof loader==='function'?loader():Promise.resolve(offlineInventory());
    inventoryRequest.then(items=>{deckBuilderInventory=items.filter(item=>cardById[item.card_id]&&!cardById[item.card_id].exclusive&&cardById[item.card_id].kind!=='scenic'&&item.quantity>0);deckBuilderPicks=[];customDeckItems=null;renderDeckBuilder()}).catch(error=>{app.replaceChildren(header('Card collection','Deck builder','Could not load your playable collection.',[el('button',{class:'btn ghost',onclick:()=>display('match')},'Back to Duel')]),el('section',{class:'panel account-panel account-error'},error.message||'Could not load your collection.'))})
  }
  function renderDeckBuilder(){
    const options=[...deckBuilderInventory].sort((a,b)=>(cardById[a.card_id].name||'').localeCompare(cardById[b.card_id].name||''));
    if(!options.length){app.replaceChildren(header('Your collection','Deck builder','Your collection has no playable cards yet. Open a local booster pack first.',[el('button',{class:'btn',onclick:()=>display('market')},'Open Booster Hall'),el('button',{class:'btn ghost',onclick:()=>display('match')},'Back to Duel')]));return}
    const keyOf=item=>`${item.card_id}|${item.rarity}|${item.foil?'1':'0'}|${item.reverse_holo?'1':'0'}`;
    const labelOf=item=>`${cardById[item.card_id].name} · ${item.reverse_holo?'Reverse Holo':item.foil?'Foil':item.rarity} · have ${item.quantity}`;
    const selectedCount=item=>deckBuilderPicks.filter(pick=>keyOf(pick)===keyOf(item)).length;
    const designCount=id=>deckBuilderPicks.filter(pick=>pick.card_id===id).length;
    const selector=el('select',{class:'select','aria-label':'Choose a card from your binder'},options.map(item=>el('option',{value:keyOf(item)},labelOf(item))));
    const addButton=el('button',{class:'btn primary',onclick:()=>{const item=options.find(candidate=>keyOf(candidate)===selector.value);if(!item)return;if(selectedCount(item)>=item.quantity){toast('You have added all copies of that print.');return}if(designCount(item.card_id)>=3){toast('A deck can include at most three copies of one design.');return}if(deckBuilderPicks.length>=30){toast('This deck already has 30 cards.');return}deckBuilderPicks.push(item);renderDeckBuilder()}},'Add card');
    const picked=deckBuilderPicks.length?deckBuilderPicks.map((item,index)=>el('div',{class:'deck-build-item'},[el('span',{},[el('b',{},cardById[item.card_id].name),el('small',{},`${item.reverse_holo?'Reverse Holo':item.foil?'Foil':item.rarity} · ${meta(cardById[item.card_id])}`)]),el('button',{class:'btn ghost',onclick:()=>{deckBuilderPicks.splice(index,1);renderDeckBuilder()},'aria-label':`Remove ${cardById[item.card_id].name}`},'Remove')])):el('p',{class:'account-empty'},'Add cards from your binder to start the deck.');
    const sigils=deckBuilderPicks.filter(item=>cardById[item.card_id].kind==='gem').length;
    const status=el('p',{class:'account-subtitle'},`${deckBuilderPicks.length}/30 cards · ${sigils} sigils. Add at least 30 cards; six or more sigils are recommended.`);
    const nameInput=el('input',{class:'input',type:'text',maxlength:'32',placeholder:'Deck name',value:deckBuilderName,oninput:e=>{deckBuilderName=e.target.value}});
    const saveDeck=el('button',{class:'btn',disabled:deckBuilderPicks.length!==30,onclick:()=>{const name=deckBuilderName.trim();if(!name){toast('Give this deck a name first.');nameInput.focus();return}profile.savedDecks.push({name,cards:deckBuilderPicks.map(item=>({card_id:item.card_id,rarity:item.rarity,foil:Boolean(item.foil),reverse_holo:Boolean(item.reverse_holo)}))});saveGame();toast(`${name} saved to My Decks.`);display('mydecks')}},'Save to My Decks');
    const play=el('button',{class:'btn primary',disabled:deckBuilderPicks.length!==30,onclick:()=>{customDeckItems=[...deckBuilderPicks];chosenDeck=profile.starterDeckChosen||decks[0].key;selectedRival=null;display('match')}},'Play this deck');
    app.replaceChildren(header('Your collection','Deck builder','Choose owned playable cards. Save a named deck here and find it later under My Decks.',[el('button',{class:'btn ghost',onclick:()=>display('mydecks')},'My Decks'),el('button',{class:'btn ghost',onclick:()=>display('match')},'Back to presets')]),el('section',{class:'panel account-panel'},[el('div',{class:'deck-builder-add'},[selector,addButton]),status,el('div',{class:'deck-build-list'},picked),el('div',{class:'deck-save-row'},[nameInput,saveDeck]),el('div',{class:'hero-buttons'},[play,el('button',{class:'btn ghost',onclick:()=>{deckBuilderPicks=[];renderDeckBuilder()}},'Clear deck')])]))
  }
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function makeSide(key,isAI=false,customCards=null){const d=key?deckByKey[key]:null;const deck=shuffle(customCards||(d?d.cards.map(id=>cardById[id]).filter(Boolean):[]));const side={vigor:START_VIGOR,maxVigor:START_VIGOR,energy:2,hand:[],deck,units:Array(LANE_COUNT).fill(null),traps:Array(LANE_COUNT).fill(null),supports:Array(LANE_COUNT).fill(null),actions:0,cycled:false,key:key||'account_binder',name:(d && d.name)||'Account Binder Deck',strategy:(d && d.strategy)||'custom'};for(let i=0;i<5;i++)if(deck.length)side.hand.push(deck.shift());ensureOpeningGem(side);return side}
  function ensureOpeningGem(side){if(side.hand.some(c=>c.kind==='gem'))return;const index=side.deck.findIndex(c=>c.kind==='gem');if(index>=0&&side.hand.length){const g=side.deck.splice(index,1)[0];side.deck.push(side.hand[side.hand.length-1]);side.hand[side.hand.length-1]=g}}
  function startMatch(tutorial,rivalKey){const rival=decks.find(d=>d.key===(rivalKey||selectedRival)&&d.key!==chosenDeck)||((tutorial)?decks.find(d=>d.key!==chosenDeck):null);if(!rival){if(tutorial)throw new Error('No AI opponent deck was found.');toast('Choose a rival before starting the match.');return}const playerCards=customDeckItems?customDeckItems.map(item=>({...cardById[item.card_id],foil:Boolean(item.foil),reverseHolo:Boolean(item.reverse_holo)})):null;match={player:makeSide(playerCards?null:chosenDeck,false,playerCards),rival:makeSide(rival.key,true),round:1,phase:'player',tutorial:Boolean(tutorial),tutorialStep:0,notice:tutorial?'Lesson 1: click a Sigil in your hand to gain Charge.':'Your opening hand is ready. Play a sigil, then spend Charge to build your line.',ended:false,collectionSpecialAvailable:false,collectionSpecialUsed:false};match.rival.name=npcRoster[rival.strategy].name;const thisMatch=match;selected=null;cycleMode=false;view='match';render();const loader=(window.GlasswakeAtlas && window.GlasswakeAtlas.loadOnlineInventory);if(typeof loader==='function')loader().then(items=>{if(match!==thisMatch)return;thisMatch.collectionSpecialAvailable=items.some(item=>item.card_id==='noodly_navigator'&&item.quantity>0);if(thisMatch.collectionSpecialAvailable)render()}).catch(()=>{});}
  function drawFive(s){while(s.hand.length<5&&s.deck.length)s.hand.push(s.deck.shift())}
  function hitSide(s,n){s.vigor=Math.max(0,Math.min(s.maxVigor||START_VIGOR,s.vigor-n))}
  function hitUnit(s,lane,n){const unit=s.units[lane];if(!unit)return;if(unit.ward>0){const absorbed=Math.min(n,unit.ward);unit.ward-=absorbed;n-=absorbed;if(unit.ward<=0){unit.ward=0;s.supports[lane]=null}}unit.vigor-=n}
  function clearFallen(s){for(let i=0;i<LANE_COUNT;i++)if(s.units[i]&&s.units[i].vigor<=0)s.units[i]=null}
  function healUnit(s,lane,n){if(s.units[lane])s.units[lane].vigor=Math.min(s.maxVigor||START_VIGOR,s.units[lane].card.health,s.units[lane].vigor+n)}
  function removeFromHand(side,c){const i=side.hand.indexOf(c);if(i>=0)side.hand.splice(i,1)}
  function isUtilityCard(c){return c.kind==='spell'&&(c.effect==='ward'||c.effect==='heal')}
  function activateUtility(side,lane){const utility=side.supports[lane],unit=side.units[lane];if(!utility||!unit)return;if(utility.effect==='ward'){healUnit(side,lane,strength(utility,2));unit.ward=2;match.notice=`${utility.name} protects lane ${lane+1} from the next 2 damage.`}else if(utility.effect==='heal'){healUnit(side,lane,strength(utility,3));side.supports[lane]=null;match.notice=`${utility.name} restores Vigor in lane ${lane+1}.`}}
  function playGem(side,c){removeFromHand(side,c);side.energy=Math.min(10,side.energy+c.charge);drawFive(side);match.notice=`${c.name} adds ${c.charge} Charge.`;if(match.tutorial&&side===match.player&&match.tutorialStep===0){match.tutorialStep=1;match.notice=`Step 2: ${c.name} added Charge. Deploy a unit in an open lane.`}}
  function canTarget(c,lane,side,rival){if(c.kind==='creature'||c.kind==='character')return !side.units[lane];if(c.kind==='trap')return !side.traps[lane];if(isUtilityCard(c))return !side.supports[lane];if(c.kind==='spell')return true;return false}
  function playAction(side,rival,c,lane){if(!side.hand.includes(c)||side.actions>=3||side.energy<(c.cost||0))return false;
    if(c.kind==='creature'||c.kind==='character'){
      if(side.units[lane])return false;removeFromHand(side,c);side.energy-=c.cost;side.actions++;
      side.units[lane]={card:c,vigor:c.health,attackBonus:0,stun:0,ward:0,stance:'defend'};if(c.kind==='character')ability(side,rival,c,lane);activateUtility(side,lane);if(!side.supports[lane])match.notice=`${c.name} enters lane ${lane+1}. ${c.kind==='character'?c.abilityText||'':''}`;
    }else if(c.kind==='spell'&&isUtilityCard(c)){
      if(side.supports[lane])return false;removeFromHand(side,c);side.energy-=c.cost;side.actions++;side.supports[lane]=c;activateUtility(side,lane);if(side.supports[lane])match.notice=`${c.name} is set in the utility slot for lane ${lane+1}.`;
    }else if(c.kind==='spell'){
      removeFromHand(side,c);side.energy-=c.cost;side.actions++;spell(side,rival,c,lane);match.notice=`${c.name} resolves.`;
    }else if(c.kind==='trap'){
      if(side.traps[lane])return false;removeFromHand(side,c);side.energy-=c.cost;side.actions++;side.traps[lane]=c;match.notice=`${c.name} is set in the trap slot for lane ${lane+1}.`;
    } else return false;
    drawFive(side);if(match.tutorial&&side===match.player&&(c.kind==='creature'||c.kind==='character')&&match.tutorialStep<2){match.tutorialStep=2;match.notice='Step 3: set your unit to Attack or Defend using its lane buttons.'}return true;
  }
  function spell(side,rival,c,lane){switch(c.effect){case'ashfire':if(rival.units[lane]){hitUnit(rival,lane,strength(c,3));clearFallen(rival)}else hitSide(rival,strength(c,2));break;case'frost':if(rival.units[lane]){hitUnit(rival,lane,strength(c,2));if(rival.units[lane])rival.units[lane].stun=1;clearFallen(rival)}else hitSide(rival,strength(c,1));break;case'storm':for(let i=0;i<LANE_COUNT;i++)hitUnit(rival,i,strength(c,2));clearFallen(rival);break;case'drain':hitSide(rival,strength(c,3));side.energy=Math.min(10,side.energy+strength(c,1));break}}
  function ability(side,rival,c,lane){switch(c.ability){case'heal2':side.vigor=Math.min(side.maxVigor||START_VIGOR,side.vigor+strength(c,2));break;case'charge':side.energy=Math.min(10,side.energy+strength(c,1));break;case'disarm_lane':rival.traps[lane]=null;break;case'rally':for(const u of side.units)if(u)u.attackBonus+=strength(c,1);break;case'sweep':for(let i=0;i<LANE_COUNT;i++)hitUnit(rival,i,strength(c,1));clearFallen(rival);break;case'heal_weakest':{let best=-1;for(let i=0;i<LANE_COUNT;i++)if(side.units[i]&&side.units[i].vigor<side.units[i].card.health&&(best<0||side.units[i].vigor<side.units[best].vigor))best=i;if(best>=0)healUnit(side,best,strength(c,2));else side.vigor=Math.min(side.maxVigor||START_VIGOR,side.vigor+strength(c,2));break}case'charge2':side.energy=Math.min(10,side.energy+strength(c,2));break;case'heal_all':for(let i=0;i<LANE_COUNT;i++)healUnit(side,i,strength(c,1));break;case'enemy2':hitSide(rival,strength(c,2));break;case'disarm_all':rival.traps=Array(LANE_COUNT).fill(null);break}}
  function triggerTrap(defender,attacker,lane){const trap=defender.traps[lane],unit=attacker.units[lane];if(!trap||!unit||unit.stun>0)return;defender.traps[lane]=null;switch(trap.effect){case'spike':hitUnit(attacker,lane,strength(trap,2));break;case'snare':hitUnit(attacker,lane,strength(trap,1));if(attacker.units[lane])attacker.units[lane].stun=1;break;case'tripwire':hitUnit(attacker,lane,strength(trap,2));if(attacker.units[lane])attacker.units[lane].stun=1;break;case'guard':defender.vigor=Math.min(defender.maxVigor||START_VIGOR,defender.vigor+strength(trap,2));hitUnit(attacker,lane,strength(trap,1));break}clearFallen(attacker);match.notice=`${trap.name} triggers in lane ${lane+1}.`}
  function setAIStances(){
    const side=match.rival,player=match.player;
    for(let i=0;i<LANE_COUNT;i++)if(side.units[i]){
      const own=side.units[i],enemy=player.units[i];
      own.stance=(side.strategy==='rush'||side.strategy==='rally'||!enemy||own.card.attack+(own.attackBonus||0)>=enemy.vigor)?'attack':'defend';
    }
  }
  function combat(){
    for(let i=0;i<LANE_COUNT;i++){triggerTrap(match.rival,match.player,i);triggerTrap(match.player,match.rival,i)}
    setAIStances();
    const pD=Array(LANE_COUNT).fill(0),rD=Array(LANE_COUNT).fill(0);let pFace=0,rFace=0;
    for(let i=0;i<LANE_COUNT;i++){
      const p=match.player.units[i],r=match.rival.units[i],pReady=p&&p.stun<=0,rReady=r&&r.stun<=0;
      const pAttack=pReady&&p.stance==='attack',rAttack=rReady&&r.stance==='attack';
      if(pAttack){const a=p.card.attack+(p.attackBonus||0);if(r){rD[i]+=a;if(rReady&&!rAttack)pD[i]+=(r.card.attack+(r.attackBonus||0))*.5}else rFace+=a}
      if(rAttack){const a=r.card.attack+(r.attackBonus||0);if(p){pD[i]+=a;if(pReady&&!pAttack)rD[i]+=(p.card.attack+(p.attackBonus||0))*.5}else pFace+=a}
      if(p&&p.stun>0)p.stun--;if(r&&r.stun>0)r.stun--;
    }
    for(let i=0;i<LANE_COUNT;i++){if(pD[i])hitUnit(match.player,i,pD[i]);if(rD[i])hitUnit(match.rival,i,rD[i])}
    hitSide(match.player,pFace);hitSide(match.rival,rFace);clearFallen(match.player);clearFallen(match.rival);
    if(pFace||rFace)match.notice=`Combat: your attacks deal ${fmt(rFace)} Vigor; the rival deals ${fmt(pFace)}.`;
  }
  function result(){if(match.player.vigor<=0)return 'loss';if(match.rival.vigor<=0)return 'win';return null}
  function beginPlayerTurn(){match.phase='player';match.player.energy=Math.min(10,match.player.energy+1);match.player.actions=0;match.player.cycled=false;for(const unit of match.player.units)if(unit)unit.stance='defend';drawFive(match.player);match.notice=`Round ${match.round}. Choose Attack or Defend for each unit before ending your turn.`;if(match.tutorial&&match.tutorialStep>=3)match.notice='Review the board, traps, and utility spaces, then choose when to end your turn.';selected=null;cycleMode=false}
  function setPlayerStance(lane,stance){
    if(!match||match.phase!=='player'||match.ended||!match.player.units[lane])return;
    match.player.units[lane].stance=stance;
    if(match.tutorial&&match.tutorialStep===2){match.tutorialStep=3;match.notice=`Step 4: lane ${lane+1} will ${stance}. Set your other orders, then end the turn.`}
    else match.notice=`Lane ${lane+1} will ${stance}.`;
    render();
  }
  function finishPlayerTurn(){if(!match||match.phase!=='player'||match.ended)return;if(match.tutorial&&match.tutorialStep<4){match.tutorialStep=4;match.notice='Step 5: the turn resolved. Check Vigor, unit damage, traps, and Charge; repeat your deck plan until the rival reaches 0.'}selected=null;cycleMode=false;match.phase='rival';match.rival.energy=Math.min(10,match.rival.energy+1);match.rival.actions=0;drawFive(match.rival);aiTurn();combat();const out=result();if(out){finishMatch(out);return}match.round++;beginPlayerTurn();render()}
  function aiLane(side,strategy){let best=-1,score=-Infinity;for(let i=0;i<LANE_COUNT;i++)if(!side.units[i]){const occupied=!!match.player.units[i];let value=strategy==='rush'?(occupied?2:8):strategy==='control'?(occupied?6:2):strategy==='traps'?(occupied?7:1):strategy==='rally'?(occupied?3:6):(occupied?4:5);value+=(LANE_COUNT-i)*.01;if(value>score){best=i;score=value}}return best}
  function aiTurn(){const side=match.rival,other=match.player;for(const c of [...side.hand].filter(x=>x.kind==='gem'))playGem(side,c);let guard=0;
    while(side.actions<3&&guard++<20){const options=side.hand.filter(c=>c.kind!=='gem'&&side.energy>=c.cost);options.sort((a,b)=>aiScore(b,side,other)-aiScore(a,side,other));let chosen=null,lane=0;for(const c of options){const target=aiTarget(c,side,other);if(target!==null){chosen=c;lane=target;break}}if(!chosen)break;playAction(side,other,chosen,lane);for(const g of side.hand.filter(x=>x.kind==='gem'))playGem(side,g)} }
  function aiScore(c,side,other){let value=(c.attack||0)*1.8+(c.health||0)+(c.kind==='character'?4:0);if(c.effect==='storm')value+=7;if(c.effect==='drain')value+=5;if(c.ability==='rally')value+=side.units.filter(Boolean).length*3;if(c.kind==='trap')value+=4;if(isUtilityCard(c))value+=3;return value}
  function aiTarget(c,side,other){if(c.kind==='creature'||c.kind==='character')return aiLane(side,side.strategy);if(c.kind==='trap'){for(let i=0;i<LANE_COUNT;i++)if(other.units[i]&&!side.traps[i])return i;for(let i=0;i<LANE_COUNT;i++)if(!side.traps[i])return i;return null}if(isUtilityCard(c)){for(let i=0;i<LANE_COUNT;i++)if(!side.supports[i]&&((c.effect==='heal'&&side.units[i]&&side.units[i].vigor<side.units[i].card.health)||(c.effect==='ward'&&side.units[i])))return i;for(let i=0;i<LANE_COUNT;i++)if(!side.supports[i])return i;return null}if(c.kind==='spell'){if(c.effect==='ashfire'||c.effect==='frost'){let best=-1;for(let i=0;i<LANE_COUNT;i++)if(other.units[i]&&(best<0||other.units[i].vigor<other.units[best].vigor))best=i;return best>=0?best:(other.vigor>0?0:null)}return 0}return null}
  function finishMatch(out){if(match.tutorial&&out==='win'){profile.tutorialComplete=true;if(!profile.tutorialRewardClaimed){profile.packs=(profile.packs||0)+5;profile.tutorialRewardClaimed=true;profile.quests['first-win']=true;match.tutorialRewardGranted=true;toast('Tutorial beaten · 5 booster packs added.')}}if(match.rival&&match.rival.key&&npcRoster[match.rival.strategy]){const key=match.rival.key,record=profile.npcRecords[key]||{wins:0,matches:0};record.matches++;if(out==='win')record.wins++;profile.npcRecords[key]=record}match.ended=true;match.phase='ended';match.result=out;profile.matches++;if(out==='win'){profile.wins++;profile.coins+=80;profile.history.unshift({result:'win',deck:match.player.name,round:match.round});awardMilestones()}else{profile.coins+=25;profile.history.unshift({result:out,deck:match.player.name,round:match.round})}profile.history=profile.history.slice(0,8);saveGame();render()}
  function awardMilestones(){const milestones=[['first-win',1,1],['five-wins',5,2],['ten-wins',10,4]];for(const [id,n,packs] of milestones)if(profile.wins>=n&&!profile.quests[id]){profile.quests[id]=true;profile.packs=(profile.packs||0)+packs;toast(`${n} duel${n>1?'s':''} won — ${packs} booster pack${packs>1?'s':''} earned.`)}const discovered=ownedDesigns();for(const [n,packs] of [[105,1],[210,2],[315,4],[420,8]]){const id=`designs-${n}`;if(discovered>=n&&!profile.quests[id]){profile.quests[id]=true;profile.packs=(profile.packs||0)+packs;toast(`${n} atlas designs found — ${packs} booster packs earned.`)}}}
  function weightedPickIndex(pool){const total=pool.reduce((sum,c)=>sum+(isIslamic(c) ? 0.5 : 1),0);let roll=Math.random()*total;for(let i=0;i<pool.length;i++){roll-=isIslamic(pool[i]) ? 0.5 : 1;if(roll<0)return i}return pool.length-1}
  function randomPack(){const pool=shuffle([...catalog]);const pulled=[];for(let i=0;i<Math.min(5,pool.length);i++){const c=pool.splice(weightedPickIndex(pool),1)[0],rarity=rarityRoll();let foil=false;if(c.kind!=='scenic'){if(c.signature)foil=Math.random()<.005;else foil=Math.random()<.02}addCopy(c.id,rarity.id,foil);pulled.push({card:c,rarity:rarity.id,foil})}profile.packsOpened++;awardMilestones();saveGame();return pulled}
  function buyPack(){if(profile.coins<100){toast('You need 100 marks for a pack.');return}profile.coins-=100;profile.packs=(Number(profile.packs)||0)+1;saveGame();toast('Sealed booster added to your Packs tab.');render()}
  function openStoredPacks(count){count=Math.min(Math.max(0,Number(count)||0),Number(profile.packs)||0);if(!count){toast('No sealed packs are available.');return}profile.packs-=count;saveGame();try{const groups=Array.from({length:count},()=>randomPack());saveGame();showPacks(groups,count===1?'Opening one booster pack':`Opening ${count} booster packs`)}catch(error){profile.packs=(Number(profile.packs)||0)+count;saveGame();console.error('Could not open booster pack:',error);toast('The packs could not open. They were returned to your Packs tab.');render()}}
  function closePack(){modal && modal.remove();modal=null;render()}
  function showPacks(groups,title){
    const packGroups=groups.map((pulls,packIndex)=>el('section',{class:'pack-pull-group'},[groups.length>1?el('h3',{},`Pack ${packIndex+1}`):null,el('div',{class:'pack-reveal'},pulls.map((pull,cardIndex)=>{
      const card=cardNode(pull.card,{rarity:pull.rarity,foil:pull.foil,count:ownedTotal(pull.card.id)});
      const back=el('span',{class:'pack-card-back'},[el('span',{class:'pack-card-star'},'✦'),el('b',{},'GOD GATHERING'),el('small',{},'Click to reveal')]);
      const front=el('span',{class:'pack-card-front'},card);
      const flip=el('span',{class:'pack-flip-inner'},[back,front]);
      const tile=el('div',{class:'pack-flip pack-opening',role:'button',tabindex:0,'aria-label':'Face-down card. Click to reveal its design and rarity.',style:`--flip-delay:${Math.min(cardIndex+packIndex*5,20)*70}ms`,onclick:()=>revealCard(tile)},flip);
      tile.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();revealCard(tile)}});
      return tile;
    }))]));
    function revealCard(tile){if(tile.classList.contains('is-revealed'))return;tile.classList.add('is-revealed');tile.setAttribute('aria-label','Card revealed. Its design and rarity are shown.')}
    modal=el('div',{class:'modal-backdrop'},el('div',{class:'modal pack-opening-modal'},[el('div',{class:'eyebrow'},'Booster reveal'),el('h2',{},title),el('p',{},'Tap each face-down card to turn it over and reveal its design and rarity.'),...packGroups,el('div',{class:'hero-buttons'},[el('button',{class:'btn',onclick:()=>modal.querySelectorAll('.pack-flip').forEach(revealCard)},'Reveal all cards'),el('button',{class:'btn primary',onclick:closePack},'Return to Packs')])]));document.body.append(modal)
  }
  function sellCopy(c){let rarity=RARITIES.find(r=>((profile.owned[c.id] && profile.owned[c.id][r.id])||0)>1);if(!rarity){toast('Keep at least one copy of each print in your binder.');return}const price=Math.max(1,Math.floor(rarity.value/Math.sqrt(Math.max(1,ownedTotal(c.id)))));profile.owned[c.id][rarity.id]--;profile.coins+=price;saveGame();toast(`${c.name} traded for ${price} marks.`);render()}
  function cycleCard(c){if(!match||match.phase!=='player'||match.player.cycled||match.player.hand.length<2)return;removeFromHand(match.player,c);if(match.player.deck.length)match.player.hand.push(match.player.deck.shift());match.player.cycled=true;cycleMode=false;selected=null;match.notice=`${c.name} traded for the next chart in your deck.`;render()}
  function pickCard(c){if(!match||match.phase!=='player'||match.ended)return;if(cycleMode){cycleCard(c);return}if(c.kind==='gem'){playGem(match.player,c);selected=null;render();return}if(match.player.actions>=3){toast('You have played three action cards this turn.');return}if(match.player.energy<c.cost){toast('Not enough Charge for that card.');return}if(c.kind==='spell'&&['storm','drain'].includes(c.effect)){playAction(match.player,match.rival,c,0);selected=null;render();return}selected=selected===c?null:c;render()}
  function clickLane(i){if(!match||match.phase!=='player'||match.ended)return;if(cycleMode){return}if(!selected)return;if(!canTarget(selected,i,match.player,match.rival)){toast('That lane is not available for this card.');return}if(playAction(match.player,match.rival,selected,i)){if(match.tutorial&&match.tutorialStep<2&&(selected.kind==='creature'||selected.kind==='character')){match.tutorialStep=2;match.notice='Step 3: unit deployed. Set it to Attack or Defend using its lane buttons.'}selected=null;render()}}
  function cycleCardStatus(){return Boolean(match && match.player && match.player.cycled)}
  function tutorialMatchGuide(){
    if(!match||!match.tutorial)return null;
    const stage=match.tutorialStep;
    const current=stage===0?'Step 1 of 5 · Play a Sigil to gain Charge. Sigils do not use an action.':stage===1?'Step 2 of 5 · Deploy a unit in an open lane. If none is in your hand, cycle a card or play another useful card.':stage===2?'Step 3 of 5 · Choose Attack or Defend on your unit. Attacks hit hard; Defend counters at half strength.':stage===3?'Step 4 of 5 · Check each lane’s unit, trap, and utility spaces. Ward blocks damage; Heal restores a unit. Then end your turn.':'Step 5 of 5 · Turn resolved. Review Vigor, Charge, damage, and triggered traps. Repeat your deck plan until the rival reaches 0 Vigor.';
    const deck=decks.find(item=>item.key===profile.starterDeckChosen);
    const warnings=decks.filter(item=>item.key!==profile.starterDeckChosen).map(item=>el('details',{class:'tutorial-hazard'},[el('summary',{},`${item.name} · ${item.strategy}`),el('p',{},rivalLesson(item.strategy))]));
    return el('section',{class:'panel tutorial-live'},[el('div',{class:'eyebrow'},'Guided duel · round '+match.round),el('h3',{},current),el('p',{},deck?strategyLesson(deck.strategy):''),el('details',{class:'tutorial-hazard'},[el('summary',{},`Current rival · ${match.rival.strategy}`),el('p',{},rivalLesson(match.rival.strategy))]),el('details',{class:'tutorial-hazard'},[el('summary',{},'Other archetypes to watch for'),...warnings])]);
  }
  function matchView(){if(!match){matchHome();return}const p=match.player,r=match.rival;
    const top=el('div',{class:'page-head'},[el('div',{},[el('div',{class:'eyebrow'},`Round ${match.round} · ${match.phase==='player'?'your turn':match.phase==='ended'?'complete':'rival turn'}`),el('h1',{class:'title'},match.ended?'Voyage complete':'God Gathering Duel'),el('p',{class:'subtitle'},'Five lanes, manual Attack or Defend orders, and one current to turn the match.')]),el('div',{class:'toolbar'},[el('button',{class:'btn',onclick:()=>{match=null;display('match')}},'New match'),el('button',{class:'btn',onclick:()=>display('rules')},'Rules')])]);
    const arena=el('section',{class:'arena'});
    arena.append(el('div',{class:'arena-top'},[el('span',{class:'player-label'},`RIVAL · ${r.name}`),el('span',{class:'vigor'},`♥ ${fmt(r.vigor)} Vigor`),el('span',{class:'charge'},`✧ ${fmt(r.energy)} Charge`)]));
    arena.append(makeLanes(r,p,'enemy'));
    arena.append(makeLanes(p,r,'player'));
    arena.append(el('div',{class:'arena-bottom'},[el('span',{class:'player-label'},`YOU · ${p.name}`),el('span',{class:'vigor'},`♥ ${fmt(p.vigor)} Vigor`),el('span',{class:'charge'},`✧ ${fmt(p.energy)} Charge`)]));
    const hand=el('div',{class:'hand'},p.hand.map(c=>cardNode(c,{selected:c===selected,onClick:()=>pickCard(c)})));
    const buttons=el('div',{class:'hero-buttons'},[el('button',{class:`btn ${cycleMode?'primary':''}`,onclick:()=>{cycleMode=!cycleMode;selected=null;render()}},cycleCardStatus()?'Cycle used':cycleMode?'Choose a card to cycle':'Cycle a card'),el('button',{class:'btn primary',onclick:finishPlayerTurn,disabled:match.phase!=='player'||match.ended},'End turn')]);
    const handBox=el('div',{class:'hand-wrap'},[el('div',{class:'hand-title'},[el('span',{},`Your hand · ${p.hand.length}/5`),el('span',{},`${p.deck.length} cards in deck · ${p.actions}/3 actions`)]),hand,buttons]);
    const notice=el('section',{class:'panel'},[el('h3',{},'Current'),el('p',{class:'notice'},selected?`${selected.name} · ${meta(selected)}. Choose a highlighted lane to play.`:cycleMode?'Select one card in your hand to replace it.':match.notice)]);
    const logs=el('section',{class:'panel'},[el('h3',{},'Last voyage'),el('div',{class:'event-log'},profile.history.length?profile.history.map(h=>el('p',{},`${h.result==='win'?'Victory':h.result==='loss'?'Defeat':'Draw'} · ${h.deck} · round ${h.round}`)):el('p',{},'Your first voyage is waiting.'))]);
    const specialPanel=match.collectionSpecialAvailable&&!match.collectionSpecialUsed&&!match.ended?el('section',{class:'panel collection-special'},[
      el('div',{class:'eyebrow'},'Account-exclusive · tradeable'),cardNode(noodlyCard,{rarity:'exquisite'}),
      el('p',{},'Play The Noodly Navigator from your collection, outside your deck. This playful, one-of-a-kind card ends this Duel in an immediate victory.'),
      el('button',{class:'btn primary',disabled:match.phase!=='player',onclick:async()=>{
        
        const loader=(window.GlasswakeAtlas && window.GlasswakeAtlas.loadOnlineInventory);if(typeof loader!=='function')return;
        try{const current=await loader();if(!current.some(item=>item.card_id==='noodly_navigator'&&item.quantity>0))throw new Error('This card is no longer in your account collection.');match.collectionSpecialUsed=true;finishMatch('win')}
        catch(error){toast(error.message||'Could not verify ownership of this card.');match.collectionSpecialAvailable=false;render()}
      }},'Play from collection · Win Duel')
    ]):null;
    const actions=el('div',{class:'side-panel'},[tutorialMatchGuide(),notice,el('section',{class:'panel'},[el('h3',{},'Match notes'),el('p',{},'Sigils do not spend an action. You may play three other cards per turn. Choose Attack or Defend for each unit before ending your turn. A defender takes the attack and counters at half strength.'),el('p',{},'A highlighted lane can receive the selected card. Each lane has a unit slot, a trap slot, and a utility slot.')]),specialPanel,logs].filter(Boolean));
    if(match.ended){
      const won=match.result==='win',title=won?'A clear passage':'Lost to the current';
      const copy=match.tutorial?(won?(match.tutorialRewardGranted?'You beat the guided tutorial and earned 5 booster packs. They are ready in Booster Hall.':'You beat the guided tutorial. Your 5-pack reward was already claimed.'):'Your tutorial result does not lock your starter deck. Study the hints, then retry until you win; the five booster packs are awarded on your first victory.'):(won?'You win 80 marks and a contract toward your next booster.':'You take 25 marks for the voyage. The next match is yours to chart.');
      const resultButtons=match.tutorial?[el('button',{class:'btn primary',onclick:()=>won?display('home'):startStarterTutorial()},won?'Continue':'Retry guided tutorial'),el('button',{class:'btn ghost',onclick:()=>tutorialWelcome()},'Review tutorial guide')]:[el('button',{class:'btn primary',onclick:()=>{match=null;startMatch()}},'Play again')];
      const result=el('div',{class:'match-result'},[el('div',{class:'eyebrow'},match.tutorial?'Guided tutorial result':'Duel result'),el('h2',{},title),el('p',{},copy),el('div',{class:'hero-buttons',style:'justify-content:center'},resultButtons)]);
      app.replaceChildren(top,el('div',{class:'panel'},result),el('div',{class:'grid duel-layout',style:'margin-top:16px'},[arena,actions]));return;
    }
    app.replaceChildren(top,el('div',{class:'duel-layout'},[el('div',{},[arena,handBox]),actions]));
  }
  function makeLanes(front,back,kind){
    const names=['West shoal','West inlet','Midwater','East inlet','Old causeway'],lanes=el('div',{class:'lanes'});
    for(let i=0;i<LANE_COUNT;i++){
      const own=kind==='player',unit=front.units[i],trap=front.traps[i],support=front.supports[i];
      const lane=el('div',{class:`lane ${own&&selected&&canTarget(selected,i,match.player,match.rival)&&match.phase==='player'?'target':''}`,onclick:()=>own?clickLane(i):null});
      lane.append(el('div',{class:'lane-title'},names[i]));
      lane.append(el('div',{class:`lane-zone unit-zone ${unit?'occupied':''}`},unit?[
        el('b',{},unit.card.name),el('span',{class:'unit-stats'},`${fmt(unit.card.attack+(unit.attackBonus||0))} ATK · ${fmt(unit.vigor)}/${fmt(unit.card.health)} VIG`),
        unit.stun?el('span',{class:'trap-tag'},'Chilled'):null,unit.ward?el('span',{class:'zone-status'},`Ward ${fmt(unit.ward)}`):null,
        own?el('div',{class:'stance-buttons'},[
          el('button',{class:`stance-button ${unit.stance==='attack'?'active':''}`,disabled:match.phase!=='player',onclick:e=>{e.stopPropagation();setPlayerStance(i,'attack')}},'Attack'),
          el('button',{class:`stance-button ${unit.stance==='defend'?'active':''}`,disabled:match.phase!=='player',onclick:e=>{e.stopPropagation();setPlayerStance(i,'defend')}},'Defend')
        ]):null
      ]:'Unit slot'));
      lane.append(el('div',{class:`lane-zone trap-zone ${trap?'occupied':''}`},[el('span',{class:'zone-label'},'Trap'),trap?el('b',{},trap.name):'Empty']));
      lane.append(el('div',{class:`lane-zone utility-zone ${support?'occupied':''}`},[el('span',{class:'zone-label'},'Utility'),support?el('b',{},support.name):'Empty']));
      lanes.append(lane);
    }
    return lanes;
  }
  function render(){document.documentElement.dataset.palette=(profile.cosmetics&&profile.cosmetics.equipped)||'tideglass';document.querySelector('#wallet').textContent=profile.coins.toLocaleString();if(view==='home')home();else if(view==='match')matchView();else if(view==='collection')collection();else if(view==='archetypes')showArchetypes();else if(view==='mydecks')renderSavedDecks();else if(view==='market')market();else if(view==='packs')packsView();else if(view==='adcenter')adcenter();else if(view==='account'){if(typeof window.GlasswakeAtlas.renderAccount==='function')window.GlasswakeAtlas.renderAccount(app);else app.replaceChildren(header('Player account','Accounts & trading','Online accounts are being prepared.',[]))}else if(view==='rules')rules();if(modal&&!modal.isConnected)document.body.append(modal)}
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal){modal.remove();modal=null}});
  if(minerHelperAvailable){setInterval(()=>{fetch('/api/miner/heartbeat',{method:'POST',headers:{'X-Glasswake-App':'1'},body:'{}'}).catch(()=>{});if(view==='adcenter')refreshMinerStatus()},5000);window.addEventListener('pagehide',()=>{fetch('/api/miner/stop',{method:'POST',headers:{'Content-Type':'application/json','X-Glasswake-App':'1'},body:'{}',keepalive:true}).catch(()=>{})})}
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||!event.data||event.data.type!=='god-gathering-starter-deck')return;
    if(!deckByKey[event.data.deckKey])return;
    profile.starterDeckChosen=event.data.deckKey;chosenDeck=event.data.deckKey;saveGame();
    if(view==='home')render();
  });
  saveGame();render();
})();



