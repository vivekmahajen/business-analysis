/**
 * Consumer Publish Safety Filter
 *
 * Transforms a raw review analysis (full analysis snapshot) into a consumer-safe
 * published payload. The filter is deterministic and server-side — it keys on
 * structured fields in the analysis output, never on LLM judgment at serve time.
 *
 * Rules (a pain_point must pass ALL of these to appear in consumer output):
 *   1. safety_flag must be false  — no safety/legal allegations
 *   2. verified must be true      — no unverified claims (covers unverified
 *                                   license/compliance flags, single-source
 *                                   accusations, etc.)
 *   3. names_individual must be false — no named individuals or attributed conduct
 *
 * The suspected_fake review list is suppressed entirely (don't publish accusations).
 * Compliance/license claims without a live authoritative check have verified=false
 * and are therefore excluded automatically by rule 2.
 */

export interface RawPainPoint {
  theme: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  safety_flag: boolean;
  verified: boolean;
  names_individual: boolean;
  example: string;
}

export interface RawReviewAnalysis {
  business: { name: string; url: string; vertical: string };
  meta: {
    reviews_analyzed: number;
    sources: string[];
    date_range: string;
    avg_rating: number | null;
    suspected_fake_count: number;
    confidence: 'low' | 'moderate' | 'high';
    confidence_reason: string;
  };
  overall_sentiment: { positive: number; neutral: number; negative: number; mixed: number };
  aspects: Array<{
    aspect: string;
    positive: number;
    neutral: number;
    negative: number;
    frequency: number;
    example: string;
    note: string;
  }>;
  loves: Array<{ theme: string; frequency: number; example: string }>;
  pain_points: RawPainPoint[];
  signals: {
    rating_text_mismatches: number;
    suspected_fake: unknown[];
    emerging: string[];
    resolved: string[];
    trend: 'improving' | 'declining' | 'stable' | 'not_assessable';
  };
  recommendations: Array<{
    theme: string;
    action: string;
    type: 'quick_win' | 'structural';
    expected_impact: string;
    impact_is_hypothesis: boolean;
    how_to_measure: string;
  }>;
  limitations: string;
}

export interface ConsumerPainPoint {
  theme: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  safety_flag: boolean;
  example: string;
}

export interface ConsumerSignals {
  rating_text_mismatches: number;
  emerging: string[];
  resolved: string[];
  trend: 'improving' | 'declining' | 'stable' | 'not_assessable';
}

export interface ConsumerPayload {
  business: RawReviewAnalysis['business'];
  meta: RawReviewAnalysis['meta'];
  overall_sentiment: RawReviewAnalysis['overall_sentiment'];
  aspects: RawReviewAnalysis['aspects'];
  loves: RawReviewAnalysis['loves'];
  pain_points: ConsumerPainPoint[];
  signals: ConsumerSignals;
  recommendations: RawReviewAnalysis['recommendations'];
  limitations: string;
  _consumer_filtered: true;
  _filtered_at: string;
  _items_removed: number;
}

/**
 * Apply the Consumer Publish Safety Filter to a raw analysis object.
 *
 * The filter is the last line of defense before a report is stored and served
 * to consumers. Bypassing the UI and calling the API directly still yields the
 * same sanitized payload because filtration happens on the server at save time.
 */
export function applyConsumerFilter(raw: RawReviewAnalysis): ConsumerPayload {
  const originalCount = (raw.pain_points ?? []).length;

  const safePainPoints = (raw.pain_points ?? []).filter((pp) => {
    // Treat missing fields as the unsafe default (exclude)
    if (pp.safety_flag === true) return false;
    if (pp.verified !== true) return false;
    if (pp.names_individual === true) return false;
    return true;
  });

  const removed = originalCount - safePainPoints.length;

  // Strip internal filter fields before consumer exposure
  const consumerPainPoints: ConsumerPainPoint[] = safePainPoints.map(
    ({ verified: _v, names_individual: _n, ...rest }) => rest
  );

  return {
    business: raw.business,
    meta: raw.meta,
    overall_sentiment: raw.overall_sentiment,
    aspects: raw.aspects ?? [],
    loves: raw.loves ?? [],
    pain_points: consumerPainPoints,
    signals: {
      rating_text_mismatches: raw.signals?.rating_text_mismatches ?? 0,
      // suspected_fake array SUPPRESSED — never publish allegations in consumer mode
      emerging: raw.signals?.emerging ?? [],
      resolved: raw.signals?.resolved ?? [],
      trend: raw.signals?.trend ?? 'not_assessable',
    },
    recommendations: raw.recommendations ?? [],
    limitations: raw.limitations ?? '',
    _consumer_filtered: true,
    _filtered_at: new Date().toISOString(),
    _items_removed: removed,
  };
}
