/**
 * decision-finalizer Unit Tests
 */
import { finalizeDecision } from '../js/decision-finalizer.js';

describe('finalizeDecision', () => {
  test('bozma ve kabul birlikteyse bozma önceliklidir', () => {
    const raw = {
      rawFlags: {
        bozma_karari: true,
        kabul_karari: true
      },
      flags: {
        bozma_karari: true,
        kabul_karari: true
      },
      details: {
        bozma_karari: { found: true, confidence: 80 },
        kabul_karari: { found: true, confidence: 90 }
      },
      confidenceScore: 85,
      confidenceLevel: 'Yuksek'
    };

    const result = finalizeDecision(raw);

    expect(result.nihaiKarar.sonuc).toBe('bozma');
    expect(result.finalDecision).toBe('bozma_karari');
    expect(result.rawFlags.kabul_karari).toBe(true);
    expect(result.flags.kabul_karari).toBe(false);
    expect(result.details.kabul_karari.suppressedByPriority).toBe(true);
  });

  test('hiç karar flag yoksa belirsiz döner', () => {
    const raw = {
      rawFlags: { hagb_karari: true },
      flags: { hagb_karari: true },
      details: { hagb_karari: { found: true, confidence: 70 } },
      confidenceScore: 70,
      confidenceLevel: 'Orta'
    };

    const result = finalizeDecision(raw);

    expect(result.nihaiKarar).toEqual({ sonuc: 'belirsiz', confidence: 0.2 });
    expect(result.finalDecision).toBeNull();
  });

  test('kısmen bozma onamadan önce gelir', () => {
    const raw = {
      rawFlags: {
        kismen_bozma_karari: true,
        onama_karari: true
      },
      flags: {
        kismen_bozma_karari: true,
        onama_karari: true
      },
      details: {
        kismen_bozma_karari: { found: true, confidence: 75 },
        onama_karari: { found: true, confidence: 80 }
      },
      confidenceScore: 77,
      confidenceLevel: 'Orta'
    };

    const result = finalizeDecision(raw);

    expect(result.nihaiKarar.sonuc).toBe('kısmenBozma');
    expect(result.finalDecision).toBe('kismen_bozma_karari');
  });
});
