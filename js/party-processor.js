/**
 * Party Processor Module
 * Davacı, davalı, vekiller ve talepleri çıkarır
 */
export const PartyProcessor = {
  extract(text) {
    const lines = text.split('\n');
    const result = {
      davacilar: [],
      davalilar: [],
      vekiller: [],
      talepler: []
    };

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();
      const nextLine = lines[index + 1] ? lines[index + 1].trim() : '';

      // Davacı çıkarma
      this.extractParties(trimmedLine, nextLine, lineNum, 'davacı', result.davacilar);
      
      // Davalı çıkarma
      this.extractParties(trimmedLine, nextLine, lineNum, 'davalı', result.davalilar);
      
      // Vekil çıkarma
      this.extractVekiller(trimmedLine, nextLine, lineNum, result.vekiller);
      
      // Talep çıkarma
      this.extractTalepler(trimmedLine, nextLine, lineNum, result.talepler);
    });

    // Boş array'leri null yap
    if (result.davacilar.length === 0) result.davacilar = null;
    if (result.davalilar.length === 0) result.davalilar = null;
    if (result.vekiller.length === 0) result.vekiller = null;
    if (result.talepler.length === 0) result.talepler = null;

    return result;
  },

  extractParties(line, nextLine, lineNum, type, targetArray) {
    const patterns = [
      new RegExp(`(?:^|\\b)${type}(?:lar|ler)?\\s*[:\\-]?\\s+([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\\.\\-\\s]{2,60}?)(?=\\s+(?:vekili|vekil|müdafi|taraf)|,|\\.|;|$)`, 'gi'),
      new RegExp(`(?:^|\\b)${type}(?:lar|ler)?\\s+([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\\.\\-\\s]{2,60}?)(?=\\s+adına|\\s+tarafından|\\s+taraf|,|\\.|;|$)`, 'gi')
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const candidateName = this.normalizeName(match[1]);
        if (!this.isValidPartyName(candidateName)) {
          continue;
        }

        const confidence = this.calculatePartyConfidence(line, nextLine, type, candidateName);

        const exists = targetArray.find(p =>
          p.isim && p.isim.toLowerCase() === candidateName.toLowerCase()
        );

        if (!exists) {
          targetArray.push({
            isim: candidateName,
            confidence: confidence,
            satirNo: lineNum,
            baglam: line.substring(0, 150) + (line.length > 150 ? "..." : ""),
            satirIcerigi: line
          });
        }
      }
    });
  },

  extractVekiller(line, nextLine, lineNum, targetArray) {
    // Pattern: "davacı vekili X", "davalı vekili Y", "sanık vekili Z", "müdafi A"
    // "Av." kısaltmasını da destekle
    const patterns = [
      /(?:davacı|davalı|sanık|şüpheli|müddei|müddeiumumi)\s+vekili\s*[:\-]?\s*(?:Av\.?\s+)?([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü.\-\s]{2,60}?)(?:,|\.|;|$|'|'ın|'a|'e|'den|'dan|'i|'ı|'u|'ü)/gi,
      /müdafi\s*[:\-]?\s*(?:Av\.?\s+)?([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü.\-\s]{2,60}?)(?:,|\.|;|$|'|'ın|'a|'e|'den|'dan|'i|'ı|'u|'ü)/gi,
      /vekili\s*[:\-]?\s*(?:Av\.?\s+)?([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü.\-\s]{2,60}?)(?:,|\.|;|$|'|'ın|'a|'e|'den|'dan|'i|'ı|'u|'ü)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const candidateName = this.normalizeName(match[1] ? match[1] : match[0]);
        if (!this.isValidPartyName(candidateName)) continue;
        
        // Vekil tipini belirle
        let tip = 'Vekil';
        if (line.toLowerCase().includes('davacı vekili')) tip = 'Davacı Vekili';
        else if (line.toLowerCase().includes('davalı vekili')) tip = 'Davalı Vekili';
        else if (line.toLowerCase().includes('sanık vekili') || line.toLowerCase().includes('müdafi')) tip = 'Müdafi';
        else if (nextLine.toLowerCase().includes('sanık')) tip = 'Müdafi';
        
        const exists = targetArray.find(v => 
          v.isim && v.isim.toLowerCase() === candidateName.toLowerCase() && v.tip === tip
        );
        
        if (!exists) {
          targetArray.push({
            isim: candidateName,
            tip: tip,
            confidence: this.calculateVekilConfidence(line, tip),
            satirNo: lineNum,
            baglam: line.substring(0, 150) + (line.length > 150 ? "..." : ""),
            satirIcerigi: line
          });
        }
      }
    });
  },

  extractTalepler(line, nextLine, lineNum, targetArray) {
    // Pattern: "talep edilen", "istek edilen", "iddia edilen", "dilekçe" içeren cümleler
    const talepPatterns = [
      /(?:talep|istek|iddia|dilekçe|başvuru)\s+(?:edilen|ettiği|etti|edilmesi|edilmesine|edilmesini|olduğu)\s+[^.]{6,240}\.?/gi,
      /(?:talep|istek|iddia|dilekçe|başvuru)\s+(?:etti|edildi|oldu)\.?/gi,
      /(?:mahkemece|yerel\s+mahkemece|cumhuriyet\s+savcısı|başsavcılık)\s+[^.]{10,240}(?:talep|istem|iddia)[^.]{4,180}\.?/gi
    ];

    talepPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const talep = match[0].trim();
        if (talep.length < 10 || talep.length > 300) continue;
        if (this.isLowSignalTalep(talep)) continue;
        
        // Talep tipini belirle
        let tip = 'Talep';
        if (line.toLowerCase().includes('iddia')) tip = 'İddia';
        else if (line.toLowerCase().includes('dilekçe')) tip = 'Dilekçe';
        else if (line.toLowerCase().includes('başvuru')) tip = 'Başvuru';
        else if (nextLine.toLowerCase().includes('itiraz')) tip = 'İtiraz';
        
        const exists = targetArray.find(t => 
          t.icerik && t.icerik.toLowerCase() === talep.toLowerCase()
        );
        
        if (!exists) {
          targetArray.push({
            icerik: talep,
            tip: tip,
            confidence: this.calculateTalepConfidence(line, talep),
            satirNo: lineNum,
            baglam: line.substring(0, 150) + (line.length > 150 ? "..." : ""),
            satirIcerigi: line
          });
        }
      }
    });
  },

  normalizeName(name) {
    return name
      .replace(/\s+/g, ' ')
      .replace(/\b(Av\.?|Sayın)\b/gi, '')
      .trim();
  },

  isValidPartyName(name) {
    if (!name) {
      return false;
    }

    if (name.length < 3 || name.length > 70) {
      return false;
    }

    if (/^[.,\s]+$/.test(name)) {
      return false;
    }

    const lowered = name.toLowerCase();
    const blockedWords = [
      'mahkeme',
      'karar',
      'gerekçe',
      'yargıtay',
      'kanun',
      'maddesi',
      'dairesi',
      'başsavcılık',
      'dosya',
      'itiraz'
    ];

    if (blockedWords.some(word => lowered.includes(word))) {
      return false;
    }

    if (/\d/.test(name)) {
      return false;
    }

    return true;
  },

  isLowSignalTalep(talep) {
    const lowered = talep.toLowerCase();
    const blocked = [
      'karar verilmiştir',
      'hüküm kurulmuştur',
      'dosya incelenmiştir'
    ];

    return blocked.some(item => lowered.includes(item));
  },

  calculatePartyConfidence(line, nextLine, type, candidateName) {
    let score = 50;
    const lowered = line.toLowerCase();
    const nextLowered = nextLine.toLowerCase();

    if (lowered.includes(type)) {
      score += 20;
    }

    if (/[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+/.test(candidateName)) {
      score += 15;
    }

    if (lowered.includes('vekili')) {
      score -= 15;
    }

    if (nextLowered.includes('vekili') || nextLowered.includes('tarafından')) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  },

  calculateVekilConfidence(line, tip) {
    let score = 60;
    const lowered = line.toLowerCase();

    if (lowered.includes('av.')) {
      score += 20;
    }

    if (tip === 'Davacı Vekili' || tip === 'Davalı Vekili' || tip === 'Müdafi') {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  },

  calculateTalepConfidence(line, talep) {
    let score = 45;
    const lowered = line.toLowerCase();
    const talepLowered = talep.toLowerCase();

    if (lowered.includes('talep') || lowered.includes('istem')) {
      score += 20;
    }

    if (talepLowered.includes('edilmesi') || talepLowered.includes('kabul')) {
      score += 15;
    }

    if (talep.length > 180) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }
};
