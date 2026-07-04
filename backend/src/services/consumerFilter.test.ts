/**
 * Consumer Publish Safety Filter — unit tests
 *
 * Run: npx ts-node --esm src/services/consumerFilter.test.ts
 *   or: npx ts-node src/services/consumerFilter.test.ts   (CJS)
 *
 * Uses Node.js built-in test runner (Node 18+). No additional test framework needed.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyConsumerFilter, RawReviewAnalysis } from './consumerFilter';

/**
 * Shape that mirrors the real-world plumbing report that triggered this safety
 * requirement: a license-flag claim (unverified, from BuildZoom) and a school-bus
 * safety allegation (naming the owner, safety_flag=true).
 */
const plumbingReport: RawReviewAnalysis = {
  business: { name: 'Acme Plumbing', url: 'https://acmeplumbing.example.com', vertical: 'plumbing' },
  meta: {
    reviews_analyzed: 22,
    sources: ['Google', 'Yelp', 'BBB', 'BuildZoom'],
    date_range: '2023-01 to 2024-06',
    avg_rating: 3.8,
    suspected_fake_count: 2,
    confidence: 'moderate',
    confidence_reason: 'Sufficient review volume but limited date range.',
  },
  overall_sentiment: { positive: 12, neutral: 4, negative: 5, mixed: 1 },
  aspects: [
    { aspect: 'punctuality', positive: 8, neutral: 3, negative: 6, frequency: 17, example: 'Showed up an hour late', note: '' },
  ],
  loves: [
    { theme: 'Friendly technicians', frequency: 10, example: 'The guys were really nice' },
  ],
  pain_points: [
    // CASE 1: Unverified license flag from third-party source — must be removed
    {
      theme: 'License status unclear',
      frequency: 1,
      severity: 'high',
      safety_flag: false,
      verified: false, // BuildZoom flag, NOT verified against CSLB or authoritative source
      names_individual: false,
      example: 'BuildZoom lists license as inactive',
    },
    // CASE 2: School-bus safety allegation naming the owner — must be removed
    {
      theme: 'Owner safety allegation',
      frequency: 1,
      severity: 'high',
      safety_flag: true,
      verified: false,
      names_individual: true,
      example: 'Anonymous review alleges owner committed dangerous act involving school bus',
    },
    // CASE 3: Verified, aggregate, no individual named — must survive
    {
      theme: 'Long wait times',
      frequency: 8,
      severity: 'medium',
      safety_flag: false,
      verified: true, // corroborated across 8 independent reviews
      names_individual: false,
      example: 'Had to wait 3+ hours past the appointment window',
    },
    // CASE 4: safety_flag only (no verified, no names) — must be removed
    {
      theme: 'Alleged dangerous repair',
      frequency: 2,
      severity: 'high',
      safety_flag: true,
      verified: false,
      names_individual: false,
      example: 'A reviewer claims a repair caused a gas leak',
    },
    // CASE 5: Unverified but benign negative — must be removed (unverified rule)
    {
      theme: 'Overcharging concern',
      frequency: 2,
      severity: 'low',
      safety_flag: false,
      verified: false,
      names_individual: false,
      example: 'A couple reviewers felt the final bill was much higher than quoted',
    },
  ],
  signals: {
    rating_text_mismatches: 3,
    suspected_fake: ['Fake-sounding 5-star review from account with no history'],
    emerging: ['Mobile payment requests'],
    resolved: [],
    trend: 'stable',
  },
  recommendations: [
    {
      theme: 'Long wait times',
      action: 'Send SMS reminders 30 minutes before arrival',
      type: 'quick_win',
      expected_impact: 'Reduce wait-time complaints',
      impact_is_hypothesis: true,
      how_to_measure: 'Track mention of wait times in reviews over 90 days',
    },
  ],
  limitations: 'Reviews skew extreme; sample represents vocal minority.',
};

test('removes unverified license flag (Case 1)', () => {
  const result = applyConsumerFilter(plumbingReport);
  const themes = result.pain_points.map((p) => p.theme);
  assert.ok(!themes.includes('License status unclear'), 'Unverified license flag must not appear in consumer report');
});

test('removes owner safety allegation naming an individual (Case 2)', () => {
  const result = applyConsumerFilter(plumbingReport);
  const themes = result.pain_points.map((p) => p.theme);
  assert.ok(!themes.includes('Owner safety allegation'), 'Safety allegation naming individual must not appear in consumer report');
});

test('keeps verified aggregate pain point (Case 3)', () => {
  const result = applyConsumerFilter(plumbingReport);
  const themes = result.pain_points.map((p) => p.theme);
  assert.ok(themes.includes('Long wait times'), 'Verified aggregate pain point must survive filtering');
});

test('removes safety_flag=true unverified item (Case 4)', () => {
  const result = applyConsumerFilter(plumbingReport);
  const themes = result.pain_points.map((p) => p.theme);
  assert.ok(!themes.includes('Alleged dangerous repair'), 'safety_flag=true item must not appear in consumer report');
});

test('removes unverified benign negative (Case 5)', () => {
  const result = applyConsumerFilter(plumbingReport);
  const themes = result.pain_points.map((p) => p.theme);
  assert.ok(!themes.includes('Overcharging concern'), 'Unverified pain point must not appear even without safety_flag');
});

test('suppresses suspected_fake array from consumer signals', () => {
  const result = applyConsumerFilter(plumbingReport);
  assert.ok(!('suspected_fake' in result.signals), 'suspected_fake array must be suppressed in consumer output');
});

test('strips internal filter fields (verified, names_individual) from consumer pain_points', () => {
  const result = applyConsumerFilter(plumbingReport);
  for (const pp of result.pain_points) {
    assert.ok(!('verified' in pp), 'verified field must not be present on consumer pain_point');
    assert.ok(!('names_individual' in pp), 'names_individual field must not be present on consumer pain_point');
  }
});

test('records filter metadata', () => {
  const result = applyConsumerFilter(plumbingReport);
  assert.strictEqual(result._consumer_filtered, true);
  assert.ok(typeof result._filtered_at === 'string');
  assert.strictEqual(result._items_removed, 4, 'Expected 4 items removed (cases 1, 2, 4, 5)');
});

test('passes loves, aspects, recommendations through unchanged', () => {
  const result = applyConsumerFilter(plumbingReport);
  assert.strictEqual(result.loves.length, plumbingReport.loves.length);
  assert.strictEqual(result.aspects.length, plumbingReport.aspects.length);
  assert.strictEqual(result.recommendations.length, plumbingReport.recommendations.length);
});

test('empty pain_points returns empty consumer pain_points', () => {
  const empty: RawReviewAnalysis = { ...plumbingReport, pain_points: [] };
  const result = applyConsumerFilter(empty);
  assert.strictEqual(result.pain_points.length, 0);
  assert.strictEqual(result._items_removed, 0);
});

console.log('All Consumer Publish Safety Filter tests passed.');
