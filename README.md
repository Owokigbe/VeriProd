# Veriprod

Veriprod checks whether a product is genuine before you pay for it. This repository holds the customer app: a phone web app (PWA) that people open in a browser or add to their home screen.

It is a prototype. The brands, products and codes are made-up examples, and payments, airtime top-ups, USSD and NAFDAC reports are simulated.

## What the customer app does

- **Scan a QR code** with the live camera, or from a photo when the camera is not available.
- **Type the code** printed under the QR when there is no camera.
- **Give a result**: Genuine, Warning (expired or recalled), Fake (never issued or never activated) or Likely clone (the same code scanned in too many places).
- **Report a product** from the home screen or from a bad result, with a photo and a pin dropped on a map.
- **Hotspots**: areas within 20 miles of the user where fakes were reported or fake codes were scanned in the last 90 days.
- **Rewards** for answering a quick question after a genuine scan. One reward per pack, capped per month.
- **Subscription** of ₦500 a month after 3 free scans, plus an ad banner.
- **Individual and business accounts**. Business scans are logged as stock checks and earn no rewards.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The app page |
| `app.css` | Styles, light and dark |
| `app.js` | All app logic: code checks, scanning, maps, reports, hotspots, rewards |
| `test-packs.html` | Example pack QR codes for testing, kept outside the app |
| `manifest.webmanifest`, `sw.js`, `icons/` | What makes it installable and able to open with no data |
| `vendor/` | Third-party libraries, see `vendor/README.md` |

There is no build step. The files are served as they are.

## Run it on your computer

Any static file server works. For example:

```
npx serve .
```

Then open the address it prints. The camera and location only work on `https://` addresses or on `localhost`.

## Testing a scan

Open `test-packs.html` on one screen and scan a code from it with the app on a phone. Each pack shows the result to expect.

## What is not built yet

- **A backend.** Scans, reports and the subscription are stored on each phone only. Hotspots therefore show only that phone's own reports until there is a shared server.
- **The brand registry.** The serials live in `app.js` as examples. The real version reads brand serial systems through their APIs and issues signed serials for brands that have none.
- **Payments, airtime rewards and USSD.**
- **The company dashboard**, which is a separate app.

The map uses OpenStreetMap's public tiles, which are fine for a prototype. A launch needs a paid or self-hosted tile source.
