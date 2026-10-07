(() => {
  if (document.getElementById('cart-reset-host')) return;
  const isCostco = location.hostname === 'sameday.costco.com';
  const supportedPage = () => isCostco
    ? location.hostname === 'sameday.costco.com' && location.pathname.startsWith('/store/costco/')
    : location.hostname === 'www.walmart.com' && /^\/cart\/?$/.test(location.pathname);
  if (!supportedPage()) {
    alert('Cart Reset supports Walmart.com/cart and Costco Same-Day in Chrome. Amazon and the regular Costco.com cart are not supported yet.');
    return;
  }
  const cartDialog = isCostco ? document.querySelector('#cart_dialog[role="dialog"][aria-label="Cart"]') : null;
  if (isCostco && (!cartDialog || !cartDialog.getClientRects().length)) {
    alert('Open the cart drawer on Costco Same-Day, then click Cart Reset again.');
    return;
  }
  const host = document.createElement('div');
  host.id = 'cart-reset-host';
  (cartDialog || document.documentElement).append(host);
  const root = host.attachShadow({mode: 'open'});
  root.innerHTML = `<style>
    :host{all:initial} *{box-sizing:border-box} aside{position:fixed;z-index:2147483647;right:18px;top:18px;bottom:18px;width:420px;max-width:calc(100vw - 36px);background:#faf8ff;color:#302440;border:1px solid #d6c9e8;border-radius:22px;box-shadow:0 12px 60px #35205f40;font:14px/1.4 system-ui;display:flex;flex-direction:column;padding:16px;gap:8px;overflow:hidden}
    h1{font-size:22px;margin:0}.brand{display:flex;align-items:center;gap:9px}.mascot{width:42px;height:42px;overflow:hidden;flex-shrink:0}.mascot img{width:64px;height:43px;max-width:none;object-fit:contain;transform:scale(1.6);transform-origin:center;margin-left:-11px;image-rendering:pixelated}.signature{display:block;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#705a90;font-weight:700}.thumb{width:44px;height:44px;object-fit:contain;border-radius:8px;background:white;flex-shrink:0}input{accent-color:#56358b}button:hover:not(:disabled){background:#ede6fa}.primary:hover:not(:disabled){background:#56358b}button:focus-visible,select:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #8c55d6;outline-offset:2px}#later{border-bottom:3px solid #c8f36b} p{margin:0} button{font:inherit;cursor:pointer;border:1px solid #d6c9e8;border-radius:10px;background:#fff;padding:6px 10px;color:inherit} h2{font-size:17px;margin:8px 0} select{display:block;max-width:100%;margin-top:8px;padding:5px;font:inherit;border:1px solid #d6c9e8;border-radius:6px} button:disabled{opacity:.45;cursor:default}.primary{background:#35205f;color:#fff} .toolbar{display:flex;gap:8px;flex-wrap:wrap} #list{overflow:auto;flex:1 1 0;min-height:140px} label{display:flex;gap:12px;padding:14px 0;border-bottom:1px solid #e6deef} input{width:20px;height:20px;flex-shrink:0} a{color:#56358b} small{display:block;color:#695c7a} #status{font-size:13px} header{display:flex;justify-content:space-between;align-items:center}
    aside{background:#080e18 var(--cart-art) center/cover no-repeat;border-color:#7061ad}header,.toolbar,aside>small,#status{background:#faf8fff2;border-radius:10px;padding:7px}#list{background:#faf8fff2;border-radius:12px;padding:0 10px}.mascot{width:44px;height:44px}.mascot img{width:44px;height:44px;transform:none;margin:0}.social-art{position:relative;flex:0 0 86px;overflow:hidden;border-radius:10px;background:#050d15}.social-art img{position:absolute;width:100%;height:auto;bottom:0;left:0}button:disabled{opacity:1;background:#e3ddeb;color:#81778b}.primary:disabled{background:#77658d;color:#fff}#stop{background:#fff}
    </style><aside aria-label="Cart Reset"><header><div class="brand"><span class="mascot"><img id="wumpi" alt="Wumpi, the HyperWumpus mascot"></span><div><h1>Cart Reset</h1><span class="signature">A HyperWumpus creation</span></div></div><button id="close" aria-label="Close">×</button></header>
    <small>Keep the reminder. Lose the clutter. Save for later keeps items in Walmart; groups stay here until you close the panel.</small>
    <div class="toolbar"><button id="scan">Refresh items</button><button id="all">Select all</button><button id="none">Clear selection</button></div>
    <div id="list"></div><p id="status" role="status" aria-live="polite"></p>
    <button id="save">Download grouped product links</button><button id="later" class="primary">Save selected for later</button><button id="remove">Remove selected</button><button id="stop" hidden>Stop after current item</button><div class="social-art"><img id="socials" alt="Cart Reset by @HyperWumpus — Instagram, YouTube, Twitch, TikTok, LinkedIn and Facebook"></div></aside>`;
  const $ = id => root.getElementById(id);
  $('wumpi').src = chrome.runtime.getURL('icons/wumpi-cart.png');
  const artworkURL = chrome.runtime.getURL('assets/cart-reset-background.jpeg');
  root.querySelector('aside').style.setProperty('--cart-art', `url("${artworkURL}")`);
  $('socials').src = artworkURL;
  if (isCostco) {
    root.querySelector('aside').style.left = '18px';
    root.querySelector('aside').style.right = 'auto';
    root.querySelector('aside > small').textContent = 'Costco Same-Day: download a visual reminder list before removing items. Native Save for later is not available here. Groups stay until this panel closes.';
    $('later').hidden = true;
    $('save').textContent = 'Download grouped reminder list';
    $('stop').textContent = 'Stop after current quantity change';
  }
  let items = [], running = false, stopped = false;
  const visible = el => !!el.getClientRects().length;
  const groups = ['Groceries', 'Other finds'];
  const assignedGroups = new Map();
  const key = item => (item.url || item.image || '') + '\n' + item.name;
  const checked = () => [...root.querySelectorAll('input:checked')].map(b => items[Number(b.dataset.index)]);
  function scanCostco() {
    const dialog = document.querySelector('#cart_dialog[role="dialog"][aria-label="Cart"]');
    if (!dialog || !visible(dialog)) return [];
    const result = [];
    for (const increment of dialog.querySelectorAll('button[aria-label^="Increment quantity of "]')) {
      const name = increment.getAttribute('aria-label').slice('Increment quantity of '.length);
      let row = increment.parentElement;
      while (row && row !== dialog && !(row.querySelector('h3') && row.querySelector('img'))) row = row.parentElement;
      if (!row || row === dialog || row.querySelectorAll('h3').length !== 1 || !visible(row)) continue;
      const controls = [...row.querySelectorAll('button[aria-label]')];
      if (controls.filter(b => b.getAttribute('aria-label').startsWith('Increment quantity of ')).length !== 1) continue;
      const imageElement = [...row.querySelectorAll('img')].find(i => i.alt === name);
      const heading = row.querySelector('h3').textContent.trim();
      if (!imageElement || !(heading === name || heading.startsWith(name + ' ('))) continue;
      const quantityText = increment.parentElement.querySelector('[aria-live="polite"]')?.textContent.trim();
      const quantityMatch = /^Quantity:\s*(\d+)\s+(ct|pkg)$/.exec(quantityText || '');
      if (!quantityMatch) continue;
      const quantity = Number(quantityMatch[1]);
      if (quantity < 1 || quantity > 100) continue;
      const button = controls.find(b => b.getAttribute('aria-label') === (quantity === 1 ? 'Remove ' : 'Decrement quantity of ') + name);
      if (!button) continue;
      const image = imageElement.src;
      if (!image.startsWith('https://www.instacart.com/image-server/')) continue;
      const item = {name, image, row, button, quantity, url: null, saveButton: null};
      // Same-Day rows expose buttons rather than product permalinks; preserve names and thumbnails.
      item.group = assignedGroups.get(key(item)) || (/detergent|soap|tissue|paper towel|cutlery|cleaner|shampoo|diaper/i.test(name) ? 'Other finds' : 'Groceries');
      result.push(item);
    }
    return result;
  }
  function scan() {
    if (isCostco) return scanCostco();
    const result = [];
    // Walmart's cart uses named Remove controls inside LI rows, not cart-item test IDs.
    // Saved-for-later rows use "Remove:" and do not have quantity steppers.
    for (const button of document.querySelectorAll('button[aria-label^="Remove "]')) {
      const row = button.closest('li');
      if (!row || !visible(row)) continue;
      const controls = [...row.querySelectorAll('button[aria-label^="Remove "]')];
      if (controls.length !== 1) continue;
      const name = row.querySelector('[data-testid="productName"]')?.textContent.trim();
      if (!name || button.getAttribute('aria-label') !== 'Remove ' + name) continue;
      const link = [...row.querySelectorAll('a[href]')].find(a => {
        const url = new URL(a.href); return url.hostname === 'www.walmart.com' && url.pathname.startsWith('/ip/');
      });
      const quantity = row.querySelector('[data-testid="quantity-stepper"]');
      const saveButton = [...row.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Save for later: ' + name);
      if (!link || !quantity || !saveButton) continue;
      const url = new URL(link.href); url.search = ''; url.hash = '';
      const imageSource = row.querySelector('img[data-testid="productTileImage"]')?.src;
      const image = imageSource && /^https:\/\/i5\.walmartimages\.com\//.test(imageSource) ? imageSource : null;
      const item = {name, url: url.href, image, row, button, saveButton};
      item.group = assignedGroups.get(key(item)) || (/SNAP EBT eligible/i.test(row.textContent) ? 'Groceries' : 'Other finds');
      result.push(item);
    }
    return result;
  }
  function updateSelection() {
    const count = checked().length;
    $('remove').textContent = `Remove selected (${count})`;
    $('later').textContent = `Save selected for later (${count})`;
    $('remove').disabled = !count;
    $('later').disabled = isCostco || !count;
  }
  function render() {
    const selection = new Set(checked().map(key));
    items = scan(); $('list').replaceChildren();
    for (const group of groups) {
      const groupItems = items.filter(item => item.group === group);
      if (!groupItems.length) continue;
      const heading = document.createElement('h2'); heading.textContent = `${group} (${groupItems.length})`;
      const select = document.createElement('button'); select.textContent = `Select ${group.toLowerCase()}`;
      select.onclick = () => { root.querySelectorAll('input').forEach(b => { if (items[Number(b.dataset.index)].group === group) b.checked = true; }); updateSelection(); };
      $('list').append(heading, select);
      groupItems.forEach(item => {
        const label = document.createElement('label');
        const box = document.createElement('input'); box.type = 'checkbox'; box.dataset.index = items.indexOf(item); box.checked = selection.has(key(item));
        box.setAttribute('aria-label', `Select ${item.name}`); box.onchange = updateSelection;
        const content = document.createElement('div');
        const link = document.createElement(item.url ? 'a' : 'span');
        if (item.url) { link.href = item.url; link.target = '_blank'; link.rel = 'noopener'; }
        link.textContent = item.name + (isCostco ? ` · Qty ${item.quantity}` : '');
        const category = document.createElement('select'); category.setAttribute('aria-label', `Group for ${item.name}`);
        for (const value of groups) { const option = document.createElement('option'); option.value = option.textContent = value; category.append(option); }
        category.value = item.group;
        category.onchange = () => { assignedGroups.set(key(item), category.value); render(); };
        content.append(link, category);
        label.append(box);
        if (item.image) { const thumb = document.createElement('img'); thumb.src = item.image; thumb.alt = ''; thumb.className = 'thumb'; thumb.loading = 'lazy'; thumb.onerror = () => thumb.remove(); label.append(thumb); }
        label.append(content); $('list').append(label);
      });
    }
    $('status').textContent = items.length ? `${items.length} products found. Groups are suggestions; adjust the dropdowns.` : (isCostco ? 'No recognized rows. Keep the Costco Same-Day cart drawer open and refresh items.' : 'No cart rows found. Expand Walmart’s item sections and refresh items.');
    $('save').disabled = !items.length;
    $('all').disabled = $('none').disabled = !items.length;
    updateSelection();
  }
  function saveLinks() {
    const esc = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const body = groups.map(group => `<h2>${group}</h2><ul>${items.filter(i=>i.group===group).map(i=>`<li>${i.image ? `<img src="${esc(i.image)}" alt="" width="64" height="64" style="object-fit:contain;vertical-align:middle;margin-right:12px">` : ''}${i.url ? `<a href="${esc(i.url)}">${esc(i.name)}</a>` : esc(i.name)}${i.quantity ? ` (Qty ${i.quantity})` : ''}</li>`).join('')}</ul>`).join('');
    const blob = new Blob([`<!doctype html><html lang="en"><meta charset="utf-8"><title>My cart finds · HyperWumpus</title><style>body{font:18px/1.7 system-ui;max-width:800px;margin:40px auto;padding:20px}a{color:#56358b}</style><h1>My cart finds</h1><p>Cart Reset · A HyperWumpus creation</p><p>Saved ${new Date().toLocaleString()}. Visual reference only; this list cannot automatically restore a cart. Thumbnails load from the retailer’s image service when opened.</p>${body}</html>`], {type: 'text/html'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `cart-finds-${new Date().toISOString().slice(0,10)}.html`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    $('status').textContent = 'Reminder-list download requested. Check Chrome’s Downloads before removing anything.';
  }
  $('close').onclick = () => { if (!running) host.remove(); };
  $('scan').onclick = render;
  $('all').onclick = () => { root.querySelectorAll('input').forEach(b => b.checked = true); updateSelection(); };
  $('none').onclick = () => { root.querySelectorAll('input').forEach(b => b.checked = false); updateSelection(); };
  $('save').onclick = saveLinks;
  $('stop').onclick = () => { stopped = true; $('status').textContent = 'Stopping after the current item…'; };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  function currentCostcoCart() {
    if (!supportedPage()) throw new Error('The cart page changed.');
    const dialog = document.querySelector('#cart_dialog[role="dialog"][aria-label="Cart"]');
    if (!dialog || !visible(dialog)) throw new Error('The Costco cart drawer closed. Reopen it before continuing.');
    if ([...document.querySelectorAll('[role="dialog"]')].some(d => d !== dialog && visible(d))) throw new Error('Costco opened another dialog. Review it before continuing.');
    return dialog;
  }
  async function removeCostcoItem(item) {
    // Quantity > 1 exposes a decrement, not a trash action. Verify each decrease before the next click.
    let expected = item.quantity;
    while (expected > 0) {
      currentCostcoCart();
      const matches = scanCostco().filter(x => key(x) === key(item));
      if (matches.length !== 1 || matches[0].quantity !== expected) throw new Error('An item or quantity changed. Review the cart before continuing.');
      if (matches[0].button.disabled) throw new Error('Costco is still updating. Try again when it finishes.');
      matches[0].button.click();
      let stable = 0, confirmed = false;
      for (let n = 0; n < 60; n++) {
        await delay(250);
        const dialog = currentCostcoCart();
        const now = scanCostco().filter(x => key(x) === key(item));
        const rawPresent = [...dialog.querySelectorAll('button[aria-label]')].some(b => b.getAttribute('aria-label') === 'Increment quantity of ' + item.name);
        const correct = expected === 1 ? !rawPresent : now.length === 1 && now[0].quantity === expected - 1;
        stable = correct ? stable + 1 : 0;
        if (stable >= 4) { confirmed = true; break; }
      }
      if (!confirmed) throw new Error('The quantity change could not be confirmed. Check the cart before continuing.');
      expected--;
      // Stop may leave a partially reduced quantity; no further clicks occur after it is requested.
      if (stopped && expected > 0) throw new Error('Stopped after a quantity change; this product remains with a lower quantity.');
      await delay(700);
    }
  }
  async function processSelected(action) {
    const selected = checked();
    if (isCostco && action === 'later') return;
    if (!selected.length) { $('status').textContent = 'Select items to remove first.'; return; }
    if (!confirm(action === 'later' ? `Move these ${selected.length} product rows to Walmart’s Saved for later?` : `Remove these ${selected.length} product rows, including all their quantities? Download the reminder list first if you want to remember them.`)) return;
    running = true; stopped = false;
    root.querySelectorAll('button, input, select').forEach(b => b.disabled = true);
    $('stop').hidden = false; $('stop').disabled = false;
    let completed = 0, reason = '';
    try {
      for (const item of selected) {
        if (stopped) break;
        if (isCostco) { await removeCostcoItem(item); completed++; $('status').textContent = `${completed} of ${selected.length} products removed.`; continue; }
        if (!supportedPage()) throw new Error('The cart page changed.');
        const matches = scan().filter(x => x.url === item.url && x.name === item.name);
        if (matches.length !== 1) throw new Error('An item changed or could not be identified uniquely.');
        const before = matches[0];
        const target = action === 'later' ? before.saveButton : before.button;
        if (target.disabled) throw new Error('Walmart is still updating. Try again when it finishes.');
        target.click();
        // Require the matching cart row to disappear; never repeatedly click on a timeout.
        let gone = false, stable = 0;
        for (let n = 0; n < 60; n++) {
          await new Promise(resolve => setTimeout(resolve, 250));
          const remains = [...document.querySelectorAll('button[aria-label]')].some(b => b.getAttribute('aria-label') === 'Remove ' + item.name && b.closest('li')?.querySelector('[data-testid="quantity-stepper"]'));
          stable = remains ? 0 : stable + 1;
          if (stable >= 4 && !document.querySelector('[role="dialog"]')) { gone = true; break; }
        }
        if (!gone) throw new Error('The cart change could not be confirmed. Check the cart before continuing.');
        completed++; $('status').textContent = `${completed} of ${selected.length} cart changes confirmed.`;
        await new Promise(resolve => setTimeout(resolve, 700));
      }
    } catch (error) { reason = error.message; }
    finally {
      running = false; root.querySelectorAll('button, input, select').forEach(b => b.disabled = false);
      $('stop').hidden = true; render();
      $('status').textContent = `${completed} of ${selected.length} cart changes confirmed. ${reason || (stopped ? 'Stopped.' : 'Finished.')} Review the store cart to verify.`;
    }
  }
  $('remove').onclick = () => processSelected('remove');
  $('later').onclick = () => processSelected('later');
  render();
})();
