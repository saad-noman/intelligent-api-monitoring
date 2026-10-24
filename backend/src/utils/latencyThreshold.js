// Decides which response time counts as "high" for one API, and what such a delay means
// for users. Pure logic: the baseline is loaded by services/latencyBaselineService.js.
//
// Order of precedence:
// 1. AI-researched guidance: the AI agent searches Google (allow-listed latency-guidance
//    sites) and picks a threshold that a retrieved source states (see
//    modules/ai-alert-generator/agent/thresholdAgent.js). The comparison itself stays here.
// 2. Learned baseline (below), when research is unavailable.
// 3. Configured SLO, when there is not enough history either.
//
// Basis of the fallbacks:
// - Each API is judged against its own history: the threshold is median + k x MAD of its
//   recent successful response times, k = 2.5 by default (Leys et al., 2013). This follows
//   the SRE practice of judging latency from its distribution, since targets are
//   service-specific (Google SRE book, "Service Level Objectives").
// - Delays under about 1 s keep the user's flow of thought; about 10 s is the limit for
//   holding attention (Nielsen Norman Group, "Response Times: The 3 Important Limits").
//   So the threshold is never below the 1 s flow limit.
// - Until an API has enough history, the configured SLO (HIGH_RESPONSE_TIME_MS) is used.

export const THRESHOLD_SOURCES = {
  researchedGuidance: 'researched_guidance',
  learnedBaseline: 'learned_baseline',
  flowLimit: 'user_flow_limit',
  configuredSlo: 'configured_slo',
};

// User-perceived impact of a delay, using the Nielsen Norman Group limits.
export const USER_IMPACT = {
  instant: 'within_flow_limit',
  noticeable: 'flow_interrupted',
  attentionLost: 'attention_lost',
};

function hasEnoughHistory(baseline, latency) {
  return Boolean(baseline) && baseline.samples >= latency.baselineMinSamples;
}

// Threshold from history or configuration, used when no researched threshold exists.
function resolveFallbackThreshold(baseline, policy) {
  const { latency } = policy;
  if (!hasEnoughHistory(baseline, latency)) {
    return { value: policy.highResponseTimeMs, source: THRESHOLD_SOURCES.configuredSlo, baseline: null, research: null };
  }

  const learned = Math.round(baseline.median_ms + latency.madMultiplier * baseline.scaled_mad_ms);
  if (learned < latency.flowLimitMs) {
    return { value: latency.flowLimitMs, source: THRESHOLD_SOURCES.flowLimit, baseline, research: null };
  }
  return { value: learned, source: THRESHOLD_SOURCES.learnedBaseline, baseline, research: null };
}

// Returns { value, source, baseline, research }: the threshold in ms, where it came from,
// and the evidence behind it (researched guidance, or baseline statistics).
// `researched`: { threshold_ms, basis, references, model } from the AI research, or null.
export function resolveLatencyThreshold(baseline, policy, researched = null) {
  if (researched) {
    return { value: researched.threshold_ms, source: THRESHOLD_SOURCES.researchedGuidance, baseline: null, research: researched };
  }
  return resolveFallbackThreshold(baseline, policy);
}

export function classifyUserImpact(responseTimeMs, latency) {
  if (responseTimeMs <= latency.flowLimitMs) return USER_IMPACT.instant;
  if (responseTimeMs <= latency.attentionLimitMs) return USER_IMPACT.noticeable;
  return USER_IMPACT.attentionLost;
}

// Human-readable rule text, e.g.
// "response_time_ms > 1834 (learned: median 1200 ms + 2.5 x MAD of 40 past responses)".
export function describeLatencyRule(threshold, latency) {
  const condition = `response_time_ms > ${threshold.value}`;
  if (threshold.source === THRESHOLD_SOURCES.researchedGuidance) {
    const sites = [...new Set(threshold.research.references.map((reference) => reference.site))].join(', ');
    return `${condition} (AI-researched guidance from ${sites}: ${threshold.research.basis})`;
  }
  if (threshold.source === THRESHOLD_SOURCES.configuredSlo) {
    return `${condition} (configured SLO; not enough history to learn this API's normal latency)`;
  }
  const { median_ms: medianMs, samples } = threshold.baseline;
  const learnedFrom = `median ${medianMs} ms + ${latency.madMultiplier} x MAD of ${samples} past responses`;
  if (threshold.source === THRESHOLD_SOURCES.flowLimit) {
    return `${condition} (1 s user flow limit; the learned value from ${learnedFrom} was lower)`;
  }
  return `${condition} (learned: ${learnedFrom})`;
}
