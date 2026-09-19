# FreshKeep

A small, installable web app for tracking grocery expiry dates. No accounts, no server — everything is stored on your device.

Live: https://jeffxguo.me/freshkeep/

- Shelf-life presets per category fill in the expiry date; an "opened on" date shortens it
- Barcode scanning (camera) with Open Food Facts lookup and a local memory for codes you've scanned
- Used / Toss / +1 day actions with undo; "toss all expired"
- Shopping list auto-filled from items you use up or toss, with one-tap restock
- Waste log with monthly stats and most-wasted items
- Custom locations and categories, dark mode, text size, export/import backup
- Works offline; installable to the home screen; background expiry notifications on Android Chrome

Built with plain HTML/CSS/JS — no build step. `index.html` is the whole app; `sw.js` handles offline caching and background checks.
