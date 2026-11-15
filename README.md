# Veriprod

Veriprod checks whether a product is genuine before you pay for it. This repository holds the customer app: a phone web app (PWA) that people open in a browser or add to their home screen.

It is a prototype. The brands, products, codes and hotspots are test data, and payments, airtime top-ups, USSD and NAFDAC reports are simulated.

## What the customer app does

- **Scan a QR code** with the live camera, or from a photo when the camera is not available.
- **Type the code** printed under the QR when there is no camera.
- **Give a result**: Genuine, Warning (expired or recalled), Fake (never issued or never activated) or Likely clone (the same code scanned in too many places).
- **Multi-item packs.** A carton has one code and every item inside has its own. A scan shows how many items are in the pack and how many have been scanned and purchased, split between shoppers and businesses, and how many are in use.
- **Report a product** from the home screen or from a bad result. The product can be scanned inside the report, with a photo and a pin dropped on a map.
- **Hotspots** around the user's live location. The user picks the distance, from 5 miles up to 100 miles (160 km). Shows where fakes were reported or fake codes were scanned in the last 90 days.
- **Rewards** for answering a quick question after a genuine scan. One reward per item, capped per month.
- **Subscription** of ₦500 a month for shoppers after 3 free scans, plus an ad banner.

## What a business account does

Shops, pharmacies and distributors switch to a business account in the Account tab. Setting one up asks for the business name, its CAC registration number and its type. Business scans are counted separately from shoppers' scans and earn no rewards. The business plan is ₦2,000 a month after 3 free scans. Business accounts have no Hotspots or Rewards tabs.

- **Check a delivery.** Name the supplier, then scan cartons one after another with the camera left on. Genuine items go into the stock record and count as purchased by a business.
- **Flagged codes** are listed apart with a one-tap report that carries the code, the location and the supplier's name.
- **Deliveries tab** keeps past deliveries and single item checks.
- **Veriprod verified.** A business books an inspection from the Account tab: a day, a time, the address and a contact. Until it is verified, a bar at the bottom of every screen nudges it to book. The booking is stored on the phone only, and nothing in the app can mark a business as verified yet. That needs the backend and an inspector tool.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The app page |
| `app.css` | Styles, light and dark |
| `app.js` | All app logic: code checks, packs, scanning, maps, reports, hotspots, rewards, business deliveries |
| `test-packs.html` | Carton and item QR codes for testing, kept outside the app |
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

Open `test-packs.html` on one screen and scan a code from it with the app on a phone. Each code shows the result to expect. To try the pack counts, check the infant formula carton in a business delivery, then switch to an individual account and scan a tin from it.

## What is not built yet

- **A backend.** Scans, reports, deliveries and the subscription are stored on each phone only. Hotspots are sample data placed around real towns and areas, plus that phone's own reports. Pack counts combine sample history with that phone's own scans.
- **The brand registry.** The packs and serials live in `app.js` as test data. The real version reads brand serial systems through their APIs and issues signed serials for brands that have none.
- **Payments, airtime rewards, USSD and inspection bookings.** Checking a CAC number against the CAC register is also not built. The app only checks the format.
- **The company dashboard**, which is a separate app.

The map uses OpenStreetMap's public tiles, which are fine for a prototype. A launch needs a paid or self-hosted tile source.
