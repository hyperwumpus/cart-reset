# Cart Reset by HyperWumpus

**Keep the reminder. Lose the clutter.**

Cart Reset is a Chrome extension for the moment your shopping cart becomes a collection of “ooh, that looks good,” “it’s on sale,” and “maybe I’ll buy it later.” Those products are useful visual reminders—until sorting a hundred of them becomes another chore.

Created by **HyperWumpus**, inspired by the friction of ADHD and saving things for later. The goal is simple: keep your finds visible and make cart cleanup take fewer decisions and fewer clicks.

## What it does

- Shows recognized Walmart cart products with thumbnails and product links.
- Suggests **Groceries** and **Other finds** groups, with a dropdown to correct each item.
- Selects individual items, a group, or every detected item.
- Moves selected items to Walmart’s **Saved for later**, in batches.
- Removes selected product rows, including their quantities, after confirmation.
- Downloads a readable, grouped HTML list of product links.
- Shows progress and lets you stop after the current item.

## Store support

| Store or platform | Status |
| --- | --- |
| Walmart.com cart in desktop Chrome | Supported; early version |
| Costco.com | Planned; not implemented |
| Other stores | Not implemented |
| iPhone shopping apps | Not supported directly |
| Safari | Not packaged or tested |

Each store needs its own verified cart integration. This extension does not automatically work across shopping sites.

## Install in Chrome

1. Download this repository as a ZIP and extract it, or clone it.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select the repository folder containing `manifest.json`.
5. Open [your Walmart cart](https://www.walmart.com/cart) and sign in to Walmart yourself.
6. Click **Cart Reset by HyperWumpus** in the extensions menu. Pin it for easy access.

When updating, reload the extension on the Extensions page, close any old Cart Reset panel, and reopen it.

## Use it

Select the products you want to move, then choose **Save selected for later** or **Remove selected**. A confirmation appears before either action starts. Begin with one item to check your current cart layout.

**Save for later** uses Walmart’s own list. Items leave the active cart but stay in your Walmart account. Group labels apply to this extension’s panel only; they do not create categories in Walmart’s saved list.

Group corrections last until the panel closes. **Download grouped product links** keeps a separate reference copy you can open in your browser. That file contains links, not a restorable cart or guaranteed prices/quantities.

## Privacy and permissions

Cart Reset uses `activeTab` and `scripting`. It runs when you click its icon, and its code accepts only `www.walmart.com/cart`.

There is no backend, analytics, account registration, or persistent shopping-data storage. Product thumbnails reuse Walmart’s product image URLs. The extension does not collect login credentials or payment details, interact with checkout, or submit orders.

Downloaded lists stay wherever you save them. No personal cart screenshots or exported shopping lists are included in this repository.

## Current limits

- Only recognized, loaded, expanded cart rows are shown.
- Groceries are suggested using Walmart’s SNAP EBT labels; this is a rough grouping cue, not a complete product taxonomy.
- Ambiguous matches stop the batch rather than guessing.
- A stopped batch does not undo items already moved or removed.
- Website changes can break detection. Phone-app cart synchronization has not been verified.
- This is a personal project, not a medical product. It makes no claims about treating ADHD.

## Development

No build step or third-party dependencies are required. `background.js` opens the panel; `cart-reset.js` contains the Walmart integration and interface.

Basic code checks:

```sh
node --check background.js
node --check cart-reset.js
python3 -m json.tool manifest.json
```

For a live check, verify selection, group correction, cancellation, and one user-chosen cart action before trying a large batch. Never test against someone else’s cart or select items on their behalf.

## Roadmap

- A verified Costco integration.
- A persistent visual “maybe later” shelf and remembered groups.
- More categories and a quick review mode.
- Wumpi artwork and more HyperWumpus details.
- Safari packaging after the Chrome flow is reliable.

## Signature

Purple, lime, a playful W mark, and **A HyperWumpus creation**. The geometric mark in this repository is an original project mark, not a representation of an existing Wumpi asset.

Independent project. Not affiliated with Walmart or Costco.
