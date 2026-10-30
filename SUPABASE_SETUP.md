# Enable accounts and card trading

The game still runs offline without an account. Online accounts use Supabase Auth and PostgreSQL. The database stores only email credentials in Supabase Auth, public usernames/display names/avatar presets, online marks, online inventory, and card bundle offers. Player emails are never queried for the public profile or trade inbox.

## Configure the project

1. Create a Supabase project and copy its project URL plus its **anon** or **publishable** key.
2. Run `supabase/migrations/20261030000100_accounts_trading.sql`, then `supabase/migrations/20261030000200_reverse_holo_decks.sql` in the Supabase SQL Editor, in that order.
3. Put the project URL and public key in `backend-config.js`. Do not use a `service_role` key in the game.
4. In Supabase Auth, enable email sign-in and set the site URL and redirect URL to `https://broderchasyn-design.github.io/glasswake-atlas-site/`.
5. Publish the updated game to the public site repository.

The public anon/publishable key is intended for browser apps. Row Level Security limits table reads, and the database functions validate pack openings and perform each trade atomically. The old device-only binder stays local; online packs build a separate tradeable binder. No existing local save is uploaded or treated as verified inventory.

Each trade side can contain 1–50 card lines with quantities, so players can offer one valuable card for a bundle of cards. Offered cards are held in escrow while the offer is pending and are returned if declined, cancelled, or expired. Requested copies are checked again inside the acceptance transaction.

Players can optionally enable authenticator-app TOTP in their account page. After enrollment, sign-in requires a valid six-digit challenge before the account screen opens. RLS additionally requires an AAL2 session to read online inventory, wallet, and trade offers, and server functions check the AAL state for collection changes. Turning MFA off requires a current authenticator code.

The five preset Duel decks are always playable. Signed-in players can also build a 30-card Duel deck from the playable cards in their online binder (up to three copies of a design). After applying the second migration, signing up with the username `BroderChasyn` automatically grants one common reverse-holo copy of every playable card plus the unique Noodly Navigator promo. Scenic cards are excluded because they are not playable in Duel. The promo is excluded from booster packs and has a one-copy database limit that includes cards held in trade escrow. No public self-claim function is exposed.
