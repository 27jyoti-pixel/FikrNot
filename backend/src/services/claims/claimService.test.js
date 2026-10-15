const assert = require('node:assert/strict');
const test = require('node:test');
const Claim = require('../../models/Claim');
const FoundReport = require('../../models/FoundReport');
const claimService = require('./claimService');

async function withOverrides(overrides, action) {
  const originals = overrides.map(([target, replacement]) => [
    target,
    Object.fromEntries(Object.keys(replacement).map((key) => [key, target[key]]))
  ]);
  for (const [target, replacement] of overrides) Object.assign(target, replacement);
  try {
    await action();
  } finally {
    for (const [target, original] of originals) Object.assign(target, original);
  }
}

test('Rector claim listing is limited to found reports in the assigned hostel', async () => {
  const hostelId = 'assigned-hostel';
  const foundReports = [{ _id: 'assigned-found-1' }, { _id: 'assigned-found-2' }];
  let reportFilter;
  let claimFilter;
  let claimQuery;
  const matchingClaims = [{ _id: 'claim-1' }];

  await withOverrides([
    [FoundReport, {
      find(filter) {
        reportFilter = filter;
        return { select: async () => foundReports };
      }
    }],
    [Claim, {
      countDocuments: async (filter) => {
        claimFilter = filter;
        return 1;
      },
      find(filter) {
        claimFilter = filter;
        const query = {
          populate() { return this; },
          sort() { return this; },
          skip() { return this; },
          limit: async () => matchingClaims
        };
        claimQuery = query;
        return query;
      }
    }]
  ], async () => {
    const result = await claimService.getRectorClaims(
      { role: 'rector', hostelId },
      { page: '1', limit: '10', status: 'SUBMITTED', claimantId: 'student-1' }
    );
    assert.deepEqual(reportFilter, { hostelId });
    assert.deepEqual(claimFilter, {
      foundReportId: { $in: ['assigned-found-1', 'assigned-found-2'] },
      status: 'SUBMITTED',
      claimantId: 'student-1'
    });
    assert.equal(result.claims, matchingClaims);
    assert.deepEqual(result.pagination, { page: 1, limit: 10, total: 1, totalPages: 1 });
    assert.ok(claimQuery);
  });
});

test('Rector claim listing requires an assigned hostel', async () => {
  await assert.rejects(
    claimService.getRectorClaims({ role: 'rector' }),
    (error) => error.statusCode === 403
  );
});
