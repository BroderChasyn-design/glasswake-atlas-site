# Glasswake Atlas

Glasswake Atlas is a self-contained, single-player card game. Its card names,
short lore, and generated illustrations now draw on selected stories and art
traditions from Hindu, Buddhist, Christian, Jewish, Islamic, Sikh, Shinto, and
Yorùbá/Ifá traditions. It does not load Morrowind, OpenMW, mods, or outside art
assets.

## Play

For quick computer play, open `index.html`. To run it as an installable desktop
app, launch `launch-game.cmd` and use the **Install** button when your browser
offers it. The launcher uses Node.js, or Python 3 as a fallback. The local
server listens only on this computer at `127.0.0.1:8766`.
The game itself works offline. Your collection, currency, milestones, ad-topic
choices, and match history save in that browser on this device. Mining remains
available only through the separate `launch.cmd` helper.

Online player accounts and bundle trading use the optional Supabase backend.
The online binder is separate from the device-only collection; server-opened
packs create tradeable cards, and offers can trade bundles of cards. Signed-in
players can build a 30-card Duel deck from their online playable cards. Configure
the Supabase project and apply both migrations described in `SUPABASE_SETUP.md`
before enabling the updated account binder and deck builder.

## Install on a phone

The folder is PWA-ready, but a phone needs an HTTPS web address to install it.
Publish the whole folder to a static HTTPS host, open that address on the phone,
and load the game once while online. On Android, use the browser's **Install**
prompt or menu. On iPhone, open the address in Safari, tap **Share**, then **Add
to Home Screen** and enable **Open as Web App**. After the first load, the app
shell and game assets are cached for offline play. Save data stays on that
device and is not synchronized. Phone play does not include the optional local
Monero miner.

Choose one of five preset schools and duel an AI rival. Select a card in your
hand, then choose a highlighted lane when the card needs a target. Sigils play
immediately. Use **Cycle a card** once per turn to exchange a card in your hand;
end your turn to resolve traps and combat.

## Rules at a glance

- Both sides begin at 20 Vigor and 2 Charge, with a five-card hand.
- At each turn, gain 1 Charge and draw back to five cards when possible.
- Sigils add their printed Charge without using an action.
- Play up to three other cards per turn. Creatures and characters occupy one of
  three lanes and attack automatically when you end your turn.
- A unit attacks the opposing unit in its lane, or the rival directly if that
  lane is open. Combat damage happens simultaneously.
- Characters use their arrival ability when played. Signs resolve immediately;
  snares trigger when an enemy attacks their lane.
- Reduce the rival to 0 Vigor to win. If neither side falls, compare Vigor after
  round 10.

There are five fixed 30-card decks, 396 playable designs, and 24 scenic cards.
Packs cost 100 marks and contain five different designs. Card rarity weights
are 60% Common, 25% Expensive, 12% Extravagant, and 3% Exquisite. Playable cards
have a 2% foil chance, with two signature portraits at 0.5% each. Duels and
collection milestones award earned packs. Extra copies can be traded for marks;
their value decreases as supply grows.

Card art is generated as original SVG compositions and rendered locally. Sacred
figures and stories appear in the collection; the Islamic story cards use
non-figural designs, and the game does not portray prophets. These are brief
creative interpretations, not comprehensive accounts or devotional images.
The collection can be filtered by tradition. No external image service or
religious artwork is loaded.

Islamic story designs have half the selection weight of each other design in
pack pulls. Their numeric combat stats, Charge values, and numeric ability
effects are increased by 10%; card costs and the print-rarity/foil rolls are
unchanged.

The account-exclusive **Noodly Navigator** is a separate, single-copy promo
card. It never appears in packs, can be traded, and can be played from its
owner's collection once per Duel for an immediate win. Signing up with the
founder username automatically grants one reverse-holo copy of every playable
design. The promo is an original, playful nod to a flying pasta spirit.

## Files

- `index.html` is the game entry point.
- `styles.css` contains the full interface styling.
- `game.js` contains the match, collection, pack, trading, and save logic.
- `mechanics.js` contains gameplay-only card stats, abilities, and deck lists.
- `mechanics.json` is the readable gameplay data source.
- `religion-themes.js` contains the tradition labels, card names, lore, and
  original illustration palettes and motifs.
- `manifest.json`, `sw.js`, `pwa.js`, and the `icon-*.png` files provide PWA
  installation and offline caching.
- `pwa_server.js` and `launch-game.cmd` start the game locally without starting
  the miner helper.

## Cultural references

The theme set is a small creative selection, not a survey of every religion or
community within these traditions. For context, see the [Smithsonian National
Museum of Asian Art's religion and art guide](https://asia.si.edu/education/educator-resources/encountering-religion-in-asian-art/),
the [Metropolitan Museum's notes on varied approaches to figural art in Islam](https://www.metmuseum.org/es/learn/educators/curriculum-resources/art-of-the-islamic-world/introduction/frequently-asked-questions),
and its [overview of Ife and Yorùbá sacred history](https://www.metmuseum.org/it/essays/ife-from-ca-6th-century).

To start fresh, clear this site's local storage for the browser, then reopen the
game. This clears the saved binder, marks, milestones, and match history.

## Sponsor Lab prototype

Sponsor Lab demonstrates directed placements using only topics the player
chooses. It is off by default and can be disabled at any time. Preferences stay
in local browser storage. Campaigns are sample content; an ad network or sponsor
backend is not connected. Mining is not used to select ads, and no interest data
is sent to a blockchain or mining pool.

## Optional Monero mining

Mining is off by default. `launch.cmd` runs a small Python helper bound to
`127.0.0.1`; it serves the game and can start a local XMRig process only after
the player presses **Start optional mining** in Sponsor Lab. The player enters
their own public Monero payout address and a pool hostname and port. The game
does not ask for wallet seed words or private keys. The address is held in page
memory and is not saved with the game profile. The selected pool receives the
address and the player's network connection; the pool controls payout timing,
minimums, and any fee.

To enable this feature:

1. Install Python 3 for Windows.
2. Follow the [Monero mining guide](https://web.getmonero.org/get-started/mining/),
   download XMRig from its [official releases](https://github.com/xmrig/xmrig/releases),
   and place `xmrig.exe` beside `launch.cmd` (or make it available on `PATH`).
3. Run `launch.cmd`, open the local address it prints, and enter the wallet and
   pool details. Use a pool that supports TLS when leaving TLS enabled.

The miner uses Monero's RandomX algorithm in light mode and offers 25% or 50%
CPU usage hints. These are miner hints, not exact power limits. Mining stops when
the player presses **Stop mining**, closes the game tab, closes the helper, or
the helper loses the game tab heartbeat for 30 seconds. The helper does not
download XMRig, choose a pool, or start mining on its own. Pool shares and
payouts are not tracked by the game.

This connects opt-in mining to direct player payouts; it does not implement an
on-chain reward token or a real advertising marketplace. Sponsor campaigns
remain local previews until an ad provider and campaign service are selected.
