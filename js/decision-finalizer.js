/**
 * Deterministic final decision resolver — exactly one nihaiKarar output.
 */

const DECISION_PRIORITY = [
  { key: 'bozma_karari', sonuc: 'bozma' },
  { key: 'kismen_bozma_karari', sonuc: 'kısmenBozma' },
  { key: 'onama_karari', sonuc: 'onama' },
  { key: 'red_karari', sonuc: 'red' },
  { key: 'kabul_karari', sonuc: 'kabul' },
  { key: 'beraat_karari', sonuc: 'beraat' }
];

const DECISION_FLAG_KEYS = DECISION_PRIORITY.map((item) => item.key);

function applySuppression(sourceFlags, details, winnerKey) {
  const resolvedFlags = { ...sourceFlags };
  const resolvedDetails = { ...details };

  DECISION_FLAG_KEYS.forEach((key) => {
    if (key !== winnerKey && resolvedFlags[key] === true) {
      resolvedFlags[key] = false;
      resolvedDetails[key] = {
        ...resolvedDetails[key],
        suppressedByPriority: true
      };
    }
  });

  return { flags: resolvedFlags, details: resolvedDetails };
}

export function finalizeDecision(hukukiMantikRaw) {
  const {
    rawFlags,
    flags,
    details,
    confidenceScore,
    confidenceLevel,
    ...rest
  } = hukukiMantikRaw;

  const sourceFlags = rawFlags ?? flags ?? {};

  for (const { key, sonuc } of DECISION_PRIORITY) {
    if (sourceFlags[key] === true) {
      const detailConfidence = details?.[key]?.confidence ?? 70;
      const confidence = Math.round((detailConfidence / 100) * 100) / 100;
      const suppressed = applySuppression(sourceFlags, details ?? {}, key);

      return {
        ...rest,
        rawFlags: sourceFlags,
        flags: suppressed.flags,
        details: suppressed.details,
        finalDecision: key,
        nihaiKarar: { sonuc, confidence },
        confidenceScore,
        confidenceLevel
      };
    }
  }

  return {
    ...rest,
    rawFlags: sourceFlags,
    flags: flags ?? sourceFlags,
    details: details ?? {},
    finalDecision: null,
    nihaiKarar: { sonuc: 'belirsiz', confidence: 0.2 },
    confidenceScore,
    confidenceLevel
  };
}
