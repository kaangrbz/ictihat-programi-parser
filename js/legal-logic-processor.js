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
    const hgabResult = this.findPattern(lines, hgabPatterns, 'contains_hgab');
    flags.contains_hgab = hgabResult.found;
    details.contains_hgab = hgabResult;
    
    // Bozma kontrolü
    const bozmaPatterns = [
      /bozma/gi,
      /bozulması/gi,
      /bozuldu/gi,
      /bozulmasına/gi,
      /bozma\s+kararı/gi
    ];
    const bozmaResult = this.findPattern(lines, bozmaPatterns, 'is_bozma');
    flags.is_bozma = bozmaResult.found;
    details.is_bozma = bozmaResult;
    
    // Onama kontrolü
    const onamaPatterns = [
      /onama/gi,
      /onandı/gi,
      /onandığı/gi,
      /onandığına/gi,
      /onama\s+kararı/gi
    ];
    const onamaResult = this.findPattern(lines, onamaPatterns, 'is_onama');
    flags.is_onama = onamaResult.found;
    details.is_onama = onamaResult;
    
    // Red kontrolü
    const redPatterns = [
      /\bred\b/gi,
      /reddedildi/gi,
      /reddi/gi,
      /reddedilmesi/gi,
      /red\s+kararı/gi
    ];
    const redResult = this.findPattern(lines, redPatterns, 'is_red');
    flags.is_red = redResult.found;
    details.is_red = redResult;
    
    // Kabul kontrolü
    const kabulPatterns = [
      /\bkabul\b/gi,
      /kabul\s+edildi/gi,
      /kabulüne/gi,
      /kabul\s+kararı/gi
    ];
    const kabulResult = this.findPattern(lines, kabulPatterns, 'is_kabul');
    flags.is_kabul = kabulResult.found;
    details.is_kabul = kabulResult;
    
    // Beraat kontrolü
    const beraatPatterns = [
      /beraat/gi,
      /beraatine/gi,
      /beraat\s+kararı/gi
    ];
    const beraatResult = this.findPattern(lines, beraatPatterns, 'is_beraat');
    flags.is_beraat = beraatResult.found;
    details.is_beraat = beraatResult;
    
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
