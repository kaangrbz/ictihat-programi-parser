/**
 * Legal Logic Processor Module
 * Hukuki mantık kontrollerini yapar (HAGB, bozma, onama, red vb.)
 */
export const LegalLogicProcessor = {
  analyze(text) {
    const lines = text.split('\n');
    const flags = {};
    const details = {};
    
    // HAGB kontrolü
    const hgabPatterns = [
      /hükmün\s+açıklanmasının\s+geri\s+bırakılması/gi,
      /\bhagb\b/gi,
      /h\.\s*a\.\s*g\.\s*b\./gi
    ];
    const hgabResult = this.findPattern(lines, hgabPatterns, 'hagb_karari');
    flags.hagb_karari = hgabResult.found;
    details.hagb_karari = hgabResult;
    
    // Bozma kontrolü
    const bozmaPatterns = [
      /bozma/gi,
      /bozulması/gi,
      /bozuldu/gi,
      /bozulmasına/gi,
      /bozma\s+kararı/gi
    ];
    const bozmaResult = this.findPattern(lines, bozmaPatterns, 'bozma_karari');
    flags.bozma_karari = bozmaResult.found;
    details.bozma_karari = bozmaResult;
    
    // Onama kontrolü
    const onamaPatterns = [
      /onama/gi,
      /onandı/gi,
      /onandığı/gi,
      /onandığına/gi,
      /onama\s+kararı/gi
    ];
    const onamaResult = this.findPattern(lines, onamaPatterns, 'onama_karari');
    flags.onama_karari = onamaResult.found;
    details.onama_karari = onamaResult;
    
    // Red kontrolü
    const redPatterns = [
      /\bred\b/gi,
      /reddedildi/gi,
      /reddi/gi,
      /reddedilmesi/gi,
      /red\s+kararı/gi
    ];
    const redResult = this.findPattern(lines, redPatterns, 'red_karari');
    flags.red_karari = redResult.found;
    details.red_karari = redResult;
    
    // Kabul kontrolü
    const kabulPatterns = [
      /\bkabul\b/gi,
      /kabul\s+edildi/gi,
      /kabulüne/gi,
      /kabul\s+kararı/gi
    ];
    const kabulResult = this.findPattern(lines, kabulPatterns, 'kabul_karari');
    flags.kabul_karari = kabulResult.found;
    details.kabul_karari = kabulResult;
    
    // Beraat kontrolü
    const beraatPatterns = [
      /beraat/gi,
      /beraatine/gi,
      /beraat\s+kararı/gi
    ];
    const beraatResult = this.findPattern(lines, beraatPatterns, 'beraat_karari');
    flags.beraat_karari = beraatResult.found;
    details.beraat_karari = beraatResult;
    
    // Zamanaşımı kontrolü
    const zamanaşımıPatterns = [
      /zamanaşımı/gi,
      /zamanaşımına\s+uğradı/gi,
      /zamanaşımı\s+itirazı/gi
    ];
    const zamanaşımıResult = this.findPattern(lines, zamanaşımıPatterns, 'zamanaşımı');
    flags.zamanaşımı = zamanaşımıResult.found;
    details.zamanaşımı = zamanaşımıResult;
    
    // Yetkisizlik kontrolü
    const yetkisizlikPatterns = [
      /yetkisizlik/gi,
      /yetkisiz/gi,
      /yetkisizlik\s+kararı/gi
    ];
    const yetkisizlikResult = this.findPattern(lines, yetkisizlikPatterns, 'yetkisizlik');
    flags.yetkisizlik = yetkisizlikResult.found;
    details.yetkisizlik = yetkisizlikResult;
    
    // Görevsizlik kontrolü
    const görevsizlikPatterns = [
      /görevsizlik/gi,
      /görevsiz/gi,
      /görevsizlik\s+kararı/gi
    ];
    const görevsizlikResult = this.findPattern(lines, görevsizlikPatterns, 'görevsizlik');
    flags.görevsizlik = görevsizlikResult.found;
    details.görevsizlik = görevsizlikResult;
    
    // Derdestlik kontrolü
    const derdestlikPatterns = [
      /derdestlik/gi,
      /derdest/gi,
      /derdestlik\s+kararı/gi
    ];
    const derdestlikResult = this.findPattern(lines, derdestlikPatterns, 'derdestlik');
    flags.derdestlik = derdestlikResult.found;
    details.derdestlik = derdestlikResult;
    
    return { flags, details };
  },
  
  findPattern(lines, patterns, type) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          return {
            found: true,
            context: line.trim().substring(0, 150) + (line.trim().length > 150 ? "..." : ""),
            lineNo: i + 1,
            satirIcerigi: line.trim(),
            type: type
          };
        }
      }
    }
    return {
      found: false,
      context: null,
      lineNo: null,
      satirIcerigi: null,
      type: type
    };
  }
};
