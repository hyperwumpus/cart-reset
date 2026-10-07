const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../cart-reset.js'), 'utf8');
const start = source.indexOf('  async function removeCostcoItem(item) {');
const end = source.indexOf('  async function processSelected(action) {', start);
function fixture(quantity, options = {}) {
  let remaining = quantity, clicks = 0;
  const context = {
    stopped: false,
    key: x => x.name,
    delay: async () => {},
    $: () => ({textContent: ''}),
    currentCostcoCart: () => {
      if (options.closed) throw Error('drawer closed');
      return {querySelectorAll: () => remaining ? [{getAttribute: () => 'Increment quantity of Trial product'}] : []};
    },
    scanCostco: () => {
      if (!remaining) return [];
      const row = {name: 'Trial product', quantity: remaining, button: {
        disabled: !!options.disabled,
        click: () => {
          clicks++;
          if (!options.stall) remaining--;
          if (options.stop) context.stopped = true;
        }
      }};
      return options.duplicate ? [row, row] : [row];
    }
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end) + '\nthis.remove = removeCostcoItem;', context);
  return {context, run: () => context.remove({name: 'Trial product', quantity}), state: () => ({remaining, clicks})};
}
test('removes one-unit row once', async () => {const f=fixture(1);await f.run();assert.deepEqual(f.state(),{remaining:0,clicks:1});});
test('removes all three units with a confirmed decrease per click', async () => {const f=fixture(3);await f.run();assert.deepEqual(f.state(),{remaining:0,clicks:3});});
test('ambiguous matches cause no clicks', async () => {const f=fixture(1,{duplicate:true});await assert.rejects(f.run(),/changed/);assert.equal(f.state().clicks,0);});
test('disabled control causes no clicks', async () => {const f=fixture(1,{disabled:true});await assert.rejects(f.run(),/updating/);assert.equal(f.state().clicks,0);});
test('timeout never retries the same click', async () => {const f=fixture(3,{stall:true});await assert.rejects(f.run(),/could not be confirmed/);assert.deepEqual(f.state(),{remaining:3,clicks:1});});
test('stop leaves the remaining quantity and prevents another click', async () => {const f=fixture(3,{stop:true});await assert.rejects(f.run(),/lower quantity/);assert.deepEqual(f.state(),{remaining:2,clicks:1});});
test('closed drawer causes no clicks', async () => {const f=fixture(1,{closed:true});await assert.rejects(f.run(),/drawer closed/);assert.equal(f.state().clicks,0);});
