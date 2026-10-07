const assert = require('assert');
const { calculateMatchScore } = require('../services/matching/matchingEngine');
const { isValidLostTransition, isValidFoundTransition, isValidClaimTransition, isValidMatchTransition } = require('../utils/statusTransitions');
const { verifyRectorHostelScope } = require('../middlewares/roleMiddleware');
const { CATEGORIES, ROLES } = require('../constants');
const app = require('../app');

const runUnitTests = () => {
  let passed = 0;
  let failed = 0;

  const test = (description, fn) => {
    try {
      fn();
      console.log(`  ✅ PASSED: ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${description}`);
      console.error(`     Details: ${err.message}`);
      failed++;
    }
  };

  console.log('==================================================');
  console.log('🧪 FIKRNOT BACKEND CORRECTION PASS VERIFICATION');
  console.log('==================================================');

  // Group 1: Exact Locked Status Transitions
  console.log('\n--- 1. EXACT LOCKED STATUS TRANSITIONS ---');
  test('Lost: ACTIVE -> MATCH_FOUND is valid', () => {
    assert.strictEqual(isValidLostTransition('ACTIVE', 'MATCH_FOUND'), true);
  });

  test('Lost: ACTIVE -> CLAIM_IN_PROGRESS (shortcut) is rejected', () => {
    assert.strictEqual(isValidLostTransition('ACTIVE', 'CLAIM_IN_PROGRESS'), false);
  });

  test('Lost: ACTIVE -> CLOSED (shortcut) is rejected', () => {
    assert.strictEqual(isValidLostTransition('ACTIVE', 'CLOSED'), false);
  });

  test('Found: REPORTED -> AWAITING_HANDOVER is valid', () => {
    assert.strictEqual(isValidFoundTransition('REPORTED', 'AWAITING_HANDOVER'), true);
  });

  test('Found: REPORTED -> WITH_RECTOR (shortcut) is rejected', () => {
    assert.strictEqual(isValidFoundTransition('REPORTED', 'WITH_RECTOR'), false);
  });

  test('Claim: SUBMITTED -> UNDER_VERIFICATION is valid', () => {
    assert.strictEqual(isValidClaimTransition('SUBMITTED', 'UNDER_VERIFICATION'), true);
  });

  test('Claim: SUBMITTED -> APPROVED (shortcut) is rejected', () => {
    assert.strictEqual(isValidClaimTransition('SUBMITTED', 'APPROVED'), false);
  });

  // Group 2: Matching Engine Rules
  console.log('\n--- 2. MATCHING ENGINE RULES ---');
  test('Category Gate: Different categories produce score 0', () => {
    const score = calculateMatchScore(
      { category: 'Electronics', itemName: 'MacBook Pro 16' },
      { category: 'Bags', itemName: 'MacBook Pro 16' }
    );
    assert.strictEqual(score, 0);
  });

  test('Item Name Gate: Similarity < 0.45 produces score 0', () => {
    const score = calculateMatchScore(
      { category: 'Electronics', itemName: 'iPhone' },
      { category: 'Electronics', itemName: 'Umbrella' }
    );
    assert.strictEqual(score, 0);
  });

  test('High Match Score: Identical items with brand/color produce >= 70 score', () => {
    const score = calculateMatchScore(
      { category: 'Electronics', itemName: 'Dell XPS 15 Laptop', brand: 'Dell', color: 'Silver', location: { area: 'Central Library' } },
      { category: 'Electronics', itemName: 'Dell XPS Laptop Silver', brand: 'Dell', color: 'Silver', location: { area: 'Central Library' } }
    );
    assert(score >= 70, `Score was ${score}`);
  });

  // Group 3: Authorization & Scoping Rules
  console.log('\n--- 3. AUTHORIZATION SCOPING & ROLE RULES ---');
  test('Rector Hostel Scoping: Matching hostel IDs return true', () => {
    const rector = { role: 'rector', hostelId: '660c1f5e8f1b2c001a8d4e11' };
    assert.strictEqual(verifyRectorHostelScope({ user: rector }, null, '660c1f5e8f1b2c001a8d4e11'), true);
  });

  test('Rector Hostel Scoping: Mismatched hostel IDs return false', () => {
    const rector = { role: 'rector', hostelId: '660c1f5e8f1b2c001a8d4e11' };
    assert.strictEqual(verifyRectorHostelScope({ user: rector }, null, '990c1f5e8f1b2c001a8d4e99'), false);
  });

  // Group 4: Express Router Integrity
  console.log('\n--- 4. APP INTEGRITY ---');
  test('Express app exports valid application handler', () => {
    assert.strictEqual(typeof app, 'function');
  });

  console.log('\n==================================================');
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');
};

runUnitTests();
