/**
 * Legal Logic Processor Module
 * Hukuki mantık kontrollerini yapar (HAGB, bozma, onama, red vb.)
 */
export const LegalLogicProcessor = {
  analyze(text) {
    const lines = typeof text === 'string' ? text.split('\n') : [];
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
      kismen_bozma_karari: {
        patterns: [/kısmen\s+boz/gi, /kısmen\s+bozulmasına/gi, /kısmen\s+bozuldu/gi, /kısmen\s+bozma/gi],
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

    const quality = this.calculateGlobalConfidence(details);

    return {
      flags: { ...flags },
      details,
      rawFlags: { ...flags },
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
        pattern.lastIndex = 0; // Reset index for global patterns
        const match = pattern.exec(line);
        if (match) {
          const contextualMatch = this.hasContext(lowerLine, prevLine, nextLine, requiredContext);
          const confidence = this.calculateLineConfidence(lowerLine, contextualMatch);
          
          const { smartContext, smartSatir } = this.extractSmartBounds(line, match.index, match[0].length);

          return {
            found: true,
            context: smartContext,
            lineNo: i + 1,
            satirIcerigi: smartSatir,
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

  extractSmartBounds(line, matchIndex, matchLength) {
    const matchEnd = matchIndex + matchLength;
    
    // Find closest punctuation before the match
    const beforeText = line.substring(0, matchIndex);
    let startCut = beforeText.lastIndexOf(';');
    if (startCut === -1) {
      startCut = beforeText.lastIndexOf('.');
    }
    
    // If ';' or '.' is too far, just take a reasonable chunk. 
    // We avoid using ',' for start bounds because it splits sentences and subjects too much.
    if (startCut === -1 || matchIndex - startCut > 300) {
      startCut = Math.max(0, matchIndex - 200); 
    } else {
      startCut += 1; // don't include the punctuation mark itself
    }

    // Find closest punctuation after the match to end the block
    const afterText = line.substring(matchEnd);
    let endCut = afterText.indexOf(';');
    if (endCut === -1) endCut = afterText.indexOf('.');
    
    let commaCut = afterText.indexOf(',');
    // commas are perfect for ending judgement clauses
    if (endCut === -1 || (commaCut !== -1 && commaCut < endCut)) {
      endCut = commaCut;
    }
    
    if (endCut === -1 || endCut > 200) {
      endCut = Math.min(afterText.length, 200);
    }
    endCut += matchEnd; // Absolute index based on line length
    
    let smartSatir = line.substring(startCut, endCut).trim();
    if (startCut > 0) smartSatir = "..." + smartSatir;
    if (endCut < line.length) smartSatir = smartSatir + "...";
    
    // Simple strict window around the match for the context preview
    const contextStart = Math.max(0, matchIndex - 75);
    const contextEnd = Math.min(line.length, matchEnd + 75);
    let smartContext = line.substring(contextStart, contextEnd).trim();
    if (contextStart > 0) smartContext = "..." + smartContext;
    if (contextEnd < line.length) smartContext = smartContext + "...";

    return { smartContext, smartSatir };
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
