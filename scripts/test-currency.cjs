/**
 * Regression tests for currency conversion.
 *
 * Run with: npm run test:currency
 *
 * NBG quotes GEL per `quantity` units, and quantity is 100 for JPY and 1000 for
 * AMD. Dropping that divisor would overstate an amount by two or three orders of
 * magnitude, so the maths is kept pure and covered here.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const outfile = path.join(__dirname, '.currency.bundle.cjs');
execSync(
  `npx esbuild src/currency.ts --bundle --format=cjs --platform=node --outfile="${outfile}"`,
  { stdio: 'pipe' }
);
const c = require(outfile);

let pass = 0, fail = 0;
const check = (name, cond) => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};
const near = (a, b, tol = 0.01) => a !== null && Math.abs(a - b) < tol;

// Real NBG rates, 2026-07-25.
const table = {
  date: '2026-07-25',
  rates: {
    USD: { rate: 2.6285, quantity: 1 },
    EUR: { rate: 2.9931, quantity: 1 },
    GBP: { rate: 3.5025, quantity: 1 }
  }
};

// A quantity > 1 currency, as NBG publishes JPY.
const withJpy = { date: '2026-07-25', rates: { ...table.rates, JPY: { rate: 1.7734, quantity: 100 } } };

console.log('\nbase conversion');
check('GEL to GEL is identity', c.toBase(100, 'GEL', table) === 100);
check('100 USD is 262.85 GEL', near(c.toBase(100, 'USD', table), 262.85));
check('100 EUR is 299.31 GEL', near(c.toBase(100, 'EUR', table), 299.31));
check('quantity divisor applied: 100 JPY is 1.7734 GEL', near(c.toBase(100, 'JPY', withJpy), 1.7734));
check('missing rate returns null, not a guess', c.toBase(100, 'USD', null) === null);

console.log('\nreverse conversion');
check('262.85 GEL is 100 USD', near(c.fromBase(262.85, 'USD', table), 100));
check('round trip preserves the amount', near(c.fromBase(c.toBase(250, 'EUR', table), 'EUR', table), 250));

console.log('\ncross-currency');
check('same currency is identity', c.convert(100, 'USD', 'USD', table) === 100);
check('100 USD to EUR via GEL', near(c.convert(100, 'USD', 'EUR', table), 262.85 / 2.9931, 0.001));
check('unavailable rate yields null', c.convert(100, 'USD', 'EUR', null) === null);

console.log('\nmixed-currency totals');
const mixed = [
  { amount: 100, currency: 'GEL' },
  { amount: 100, currency: 'USD' },
  { amount: 100, currency: 'EUR' }
];
const summed = c.sumConverted(mixed, 'GEL', table);
check('sums into one currency', near(summed.total, 100 + 262.85 + 299.31, 0.02));
check('nothing reported unconverted', summed.unconverted === 0);

const partial = c.sumConverted([{ amount: 50, currency: 'GEL' }, { amount: 50, currency: 'CHF' }], 'GEL', table);
check('unconvertible entries are counted', partial.unconverted === 1);
check('unconvertible entries are excluded from the total', near(partial.total, 50));

console.log('\nlegacy records (the original bug)');
// A record written before the currency column existed has none. It must resolve
// to GEL — the database default — never to whatever the business uses today,
// or switching the business to EUR reprints a 20 GEL service as EUR 20.
check('missing currency resolves to GEL', c.currencyOf(undefined) === 'GEL');
check('explicit currency is preserved', c.currencyOf('USD') === 'USD');
check(
  'a legacy 20 GEL amount is not revalued when the business switches to EUR',
  near(c.convert(20, c.currencyOf(undefined), 'EUR', table), 20 / 2.9931, 0.001)
);

console.log('\nstaleness');
check('missing table is stale', c.isStale(null, '2026-07-25') === true);
check('yesterday is stale', c.isStale({ date: '2026-07-24', rates: {} }, '2026-07-25') === true);
check('today is fresh', c.isStale(table, '2026-07-25') === false);

fs.unlinkSync(outfile);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
