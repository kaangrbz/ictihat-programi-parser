/**
 * Legal Logic Processor Module
 * Hukuki mantık kontrollerini yapar (HAGB, bozma, onama, red vb.)
 */
export const LegalLogicProcessor = {
  analyze(text) {
    const lines = text.split('\n');
    const checks = {
      hagb_karari: {
        patterns: [
          /hükmün\s+açıklanmasının\s+geri\s+bırakılması/gi,
          /\bhagb\b/gi,
          /h\.\s*a\.\s*g\.\s*b\./gi
        ],
        requiredContext: ['hüküm', 'karar', 'sanık']
      },
      bozma_karari: {
        patterns: [/bozma/gi, /bozulması/gi, /bozuldu/gi, /bozulmasına/gi, /bozma\s+kararı/gi],
        requiredContext: ['karar', 'hüküm', 'dava']
      },
      onama_karari: {
        patterns: [/onama/gi, /onandı/gi, /onandığı/gi, /onandığına/gi, /onama\s+kararı/gi],
        requiredContext: ['karar', 'hüküm', 'dava']
      },
      red_karari: {
        patterns: [/\bred\b/gi, /reddedildi/gi, /reddi/gi, /reddedilmesi/gi, /red\s+kararı/gi],
        requiredContext: ['istem', 'başvuru', 'itiraz', 'karar', 'dava']
      },
      kabul_karari: {
        patterns: [/\bkabul\b/gi, /kabul\s+edildi/gi, /kabulüne/gi, /kabul\s+kararı/gi],
        requiredContext: ['istem', 'başvuru', 'itiraz', 'karar', 'dava']
      },
      beraat_karari: {
        patterns: [/beraat/gi, /beraatine/gi, /beraat\s+kararı/gi],
        requiredContext: ['sanık', 'hüküm', 'karar']
      },
      zamanaşımı: {
        patterns: [/zamanaşımı/gi, /zamanaşımına\s+uğradı/gi, /zamanaşımı\s+itirazı/gi],
        requiredContext: ['suç', 'dava', 'itiraz', 'karar']
      },
      yetkisizlik: {
        patterns: [/yetkisizlik/gi, /yetkisiz/gi, /yetkisizlik\s+kararı/gi],
        requiredContext: ['mahkeme', 'karar', 'dava']
      },
      görevsizlik: {
        patterns: [/görevsizlik/gi, /görevsiz/gi, /görevsizlik\s+kararı/gi],
        requiredContext: ['mahkeme', 'karar', 'dava']
      },
      derdestlik: {
        patterns: [/derdestlik/gi, /derdest/gi, /derdestlik\s+kararı/gi],
        requiredContext: ['dava', 'itiraz', 'karar']
      }
    };

    const flags = {};
    const details = {};

    Object.entries(checks).forEach(([key, config]) => {
      const result = this.findPattern(lines, config.patterns, key, config.requiredContext);
      flags[key] = result.found;
      details[key] = result;
    });

    const resolved = this.resolveDecisionConflicts(flags, details);
    const quality = this.calculateGlobalConfidence(details);

    return {
      flags: resolved.flags,
      details: resolved.details,
      rawFlags: flags,
      finalDecision: resolved.finalDecision,
      confidenceScore: quality.confidenceScore,
      confidenceLevel: quality.confidenceLevel
    };
  },
  
  findPattern(lines, patterns, type, requiredContext = []) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      const nextLine = lines[i + 1] ? lines[i + 1].toLowerCase() : '';
      const prevLine = lines[i - 1] ? lines[i - 1].toLowerCase() : '';

      for (const pattern of patterns) {
        if (pattern.test(line)) {
          const contextualMatch = this.hasContext(lowerLine, prevLine, nextLine, requiredContext);
          const confidence = this.calculateLineConfidence(lowerLine, contextualMatch);

          return {
            found: true,
            context: line.trim().substring(0, 150) + (line.trim().length > 150 ? "..." : ""),
            lineNo: i + 1,
            satirIcerigi: line.trim(),
            type: type,
            confidence: confidence,
            contextMatched: contextualMatch,
            matchReason: contextualMatch ? 'pattern+context' : 'pattern-only'
          };
        }
      }
    }
    return {
      found: false,
      context: null,
      lineNo: null,
      satirIcerigi: null,
      type: type,
      confidence: 0,
      contextMatched: false,
      matchReason: 'not-found'
    };
  },

  hasContext(line, prevLine, nextLine, requiredContext) {
    if (!requiredContext || requiredContext.length === 0) {
      return true;
    }

    const contextBlock = `${prevLine} ${line} ${nextLine}`;
    return requiredContext.some(keyword => contextBlock.includes(keyword));
  },

  calculateLineConfidence(line, contextualMatch) {
    let score = 55;

    if (contextualMatch) {
      score += 20;
    } else {
      score -= 10;
    }

    if (line.includes('karar') || line.includes('hüküm') || line.includes('sonuç')) {
      score += 10;
    }

    if (line.includes('iddia') || line.includes('olabilir') || line.includes('tartışılması')) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  },

  resolveDecisionConflicts(flags, details) {
    const resolvedFlags = { ...flags };
    const resolvedDetails = { ...details };
    const decisionKeys = ['bozma_karari', 'onama_karari', 'red_karari', 'kabul_karari', 'beraat_karari'];
    const activeDecisions = decisionKeys.filter(key => resolvedFlags[key] === true);

    if (activeDecisions.length <= 1) {
      return {
        flags: resolvedFlags,
        details: resolvedDetails,
        finalDecision: activeDecisions[0] || null
      };
    }

    const prioritized = [...activeDecisions].sort((firstKey, secondKey) => {
      const firstConfidence = resolvedDetails[firstKey]?.confidence || 0;
      const secondConfidence = resolvedDetails[secondKey]?.confidence || 0;
      return secondConfidence - firstConfidence;
    });

    const finalDecision = prioritized[0];
    activeDecisions.forEach(key => {
      if (key !== finalDecision) {
        resolvedFlags[key] = false;
        resolvedDetails[key] = {
          ...resolvedDetails[key],
          suppressedByPriority: true
        };
      }
    });

    return {
      flags: resolvedFlags,
      details: resolvedDetails,
      finalDecision: finalDecision
    };
  },

  calculateGlobalConfidence(details) {
    const allDetails = Object.values(details);
    const foundItems = allDetails.filter(item => item.found);

    if (foundItems.length === 0) {
      return { confidenceScore: 0, confidenceLevel: 'Dusuk' };
    }

    const total = foundItems.reduce((sum, item) => sum + (item.confidence || 0), 0);
    const score = Math.round(total / foundItems.length);

    if (score >= 75) {
      return { confidenceScore: score, confidenceLevel: 'Yuksek' };
    }

    if (score >= 50) {
      return { confidenceScore: score, confidenceLevel: 'Orta' };
    }

    return { confidenceScore: score, confidenceLevel: 'Dusuk' };
  }
};
