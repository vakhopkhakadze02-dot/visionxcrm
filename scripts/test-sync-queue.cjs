/**
 * Regression tests for the sync outbox state machine.
 *
 * Run with: npm run test:sync
 *
 * The queue decides whether a failed write is worth retrying and whether a
 * dependent delete may proceed — getting either wrong loses data silently, so
 * the logic is kept pure and covered here.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const outfile = path.join(__dirname, '.syncQueue.bundle.cjs');
execSync(
  `npx esbuild src/syncQueue.ts --bundle --format=cjs --platform=node --outfile="${outfile}"`,
  { stdio: 'pipe' }
);
const q = require(outfile);

let pass = 0, fail = 0;
const check = (name, cond) => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

const op = (over = {}) => ({
  id: 'a', entity: 'clients', operation: 'insert', rowId: 'r1', label: 'test',
  createdAt: 0, attempts: 0, nextAttemptAt: 0, status: 'pending', ...over
});

console.log('\nerror classification');
check('RLS denial is permanent', q.classifyError({ code: '42501' }) === 'permanent');
check('missing column is permanent', q.classifyError({ code: '42703' }) === 'permanent');
check('schema cache is permanent', q.classifyError({ code: 'PGRST204' }) === 'permanent');
check('unique violation is permanent', q.classifyError({ code: '23505' }) === 'permanent');
check('401 is permanent', q.classifyError({ status: 401 }) === 'permanent');
check('row-level security message is permanent', q.classifyError({ message: 'new row violates row-level security policy' }) === 'permanent');
check('failed to fetch is retryable', q.classifyError({ message: 'Failed to fetch' }) === 'retryable');
check('500 is retryable', q.classifyError({ status: 503 }) === 'retryable');
check('timeout is retryable', q.classifyError({ message: 'Request timeout' }) === 'retryable');
check('unknown defaults to retryable', q.classifyError({ message: 'weird' }) === 'retryable');

console.log('\nFIFO ordering');
const two = [op({ id: 'first' }), op({ id: 'second' })];
check('head runs first', q.nextRunnableOp(two, 1000).id === 'first');
const waiting = [op({ id: 'first', nextAttemptAt: 5000 }), op({ id: 'second', nextAttemptAt: 0 })];
check('a waiting head blocks the queue (no overtaking)', q.nextRunnableOp(waiting, 1000) === null);
check('wait time reported from the head', q.msUntilNextAttempt(waiting, 1000) === 4000);

console.log('\nretry backoff');
let ops = [op({ id: 'x' })];
ops = q.markRetrying(ops, 'x', 'net down', 1000);
check('attempt counted', ops[0].attempts === 1);
check('backoff scheduled into the future', ops[0].nextAttemptAt > 1000);
check('still pending', ops[0].status === 'pending');
for (let i = 0; i < q.MAX_ATTEMPTS; i++) ops = q.markRetrying(ops, 'x', 'net down', 1000);
check('gives up after MAX_ATTEMPTS', ops[0].status === 'failed');

console.log('\ngroup abandonment (no orphans)');
const group = [
  op({ id: 'bookings', entity: 'bookings', operation: 'delete', groupId: 'g1', label: 'delete bookings' }),
  op({ id: 'client', entity: 'clients', operation: 'delete', groupId: 'g1', label: 'delete client' }),
  op({ id: 'unrelated', groupId: undefined })
];
const afterFail = q.markFailed(group, 'bookings', 'RLS');
check('failed op marked', afterFail.find(o => o.id === 'bookings').status === 'failed');
check('dependent sibling abandoned, not executed', afterFail.find(o => o.id === 'client').status === 'failed');
check('unrelated op untouched', afterFail.find(o => o.id === 'unrelated').status === 'pending');

console.log('\nsuccess and requeue');
check('success removes the op', q.markSucceeded(group, 'bookings').length === 2);
const requeued = q.requeueFailed(afterFail, 9999);
check('retry resets failed ops to pending', q.pendingOps(requeued).length === 3);
check('retry clears attempts', requeued.every(o => o.attempts === 0));
check('discard drops only failed', q.discardFailed(afterFail).length === 1);

fs.unlinkSync(outfile);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
