/**
 * Party Processor Module
 * Davacı, davalı, sanık, müşteki, vekil, müdahil ve talepleri çıkarır
 */

const PARTY_PATTERNS = {
  davaci: /davacı\s*:\s*(.+)/i,
  davali: /davalı\s*:\s*(.+)/i,
  sanik: /sanık\s*:\s*(.+)/i,
  musteki: /müşteki\s*:\s*(.+)/i,
  vekil: /vekil\s*:\s*(.+)/i,
  mudahil: /müdahil\s*:\s*(.+)/i
};

const FALLBACK_ROLE_MARKERS = [
  { key: 'davaci', markers: ['DAVACI', 'DAVACILAR'], target: 'davacilar' },
  { key: 'davali', markers: ['DAVALI', 'DAVALILAR'], target: 'davalilar' },
  { key: 'sanik', markers: ['SANIK', 'SANIKLAR', 'SANIKLARIN'], target: 'saniklar' },
  { key: 'musteki', markers: ['MÜŞTEKİ', 'MÜŞTEKİLER', 'MUSTEKI'], target: 'mustekiler' },
  { key: 'vekil', markers: ['VEKİL', 'VEKİLİ', 'VEKIL'], target: 'vekiller' },
  { key: 'mudahil', markers: ['MÜDAHİL', 'MÜDAHİLLER', 'MUDAHIL'], target: 'mudahiller' }
];

const TITLE_CASE_NAME = /([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)+)/;
const ALL_CAPS_NAME = /([A-ZÇĞİÖŞÜ]{2,}(?:\s+[A-ZÇĞİÖŞÜ]{2,})+)/;

export const PartyProcessor = {
  extract(text) {
    const lines = text.split('\n');
    const result = {
      davacilar: [],
      davalilar: [],
      saniklar: [],
      mustekiler: [],
      vekiller: [],
      mudahiller: [],
      talepler: []
    };

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();
      const nextLine = lines[index + 1] ? lines[index + 1].trim() : '';

      this.extractParties(trimmedLine, nextLine, lineNum, 'davacı', result.davacilar);
      this.extractParties(trimmedLine, nextLine, lineNum, 'davalı', result.davalilar);
      this.extractParties(trimmedLine, nextLine, lineNum, 'sanık', result.saniklar);
      this.extractParties(trimmedLine, nextLine, lineNum, 'müşteki', result.mustekiler);
      this.extractParties(trimmedLine, nextLine, lineNum, 'müdahil', result.mudahiller);
      this.extractVekiller(trimmedLine, nextLine, lineNum, result.vekiller);
      this.extractTalepler(trimmedLine, nextLine, lineNum, result.talepler);
    });

    this.extractColonPatterns(lines, result);
    this.fallbackPartyScan(text, result);

    return this.nullifyEmpty(result);
  },

  extractColonPatterns(lines, result) {
    const roleMap = {
      davaci: result.davacilar,
      davali: result.davalilar,
      sanik: result.saniklar,
      musteki: result.mustekiler,
      vekil: result.vekiller,
      mudahil: result.mudahiller
    };

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();

      Object.entries(PARTY_PATTERNS).forEach(([roleKey, pattern]) => {
        pattern.lastIndex = 0;
        const match = pattern.exec(trimmedLine);

        if (!match || !match[1]) {
          return;
        }

        const candidateName = this.normalizeName(match[1].split(/[,;]/)[0]);

        if (!this.isValidPartyName(candidateName)) {
          return;
        }

        const targetArray = roleMap[roleKey];
        const confidence = roleKey === 'vekil'
          ? this.calculateVekilConfidence(trimmedLine, 'Vekil')
          : this.calculatePartyConfidence(trimmedLine, '', roleKey, candidateName);

        this.pushPartyIfNew(targetArray, {
          isim: candidateName,
          confidence: Math.max(confidence, 50),
          satirNo: lineNum,
          baglam: trimmedLine.substring(0, 150) + (trimmedLine.length > 150 ? '...' : ''),
          satirIcerigi: trimmedLine,
          kaynak: 'colon-pattern'
        });
      });
    });
  },

  fallbackPartyScan(text, result) {
    const lines = text.split('\n').slice(0, 300);
    const roleTargets = {
      davacilar: result.davacilar,
      davalilar: result.davalilar,
      saniklar: result.saniklar,
      mustekiler: result.mustekiler,
      vekiller: result.vekiller,
      mudahiller: result.mudahiller
    };

    FALLBACK_ROLE_MARKERS.forEach(({ markers, target }) => {
      const targetArray = roleTargets[target];

      if (targetArray.length > 0) {
        return;
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const upperLine = line.toUpperCase();
        const hasMarker = markers.some((marker) => upperLine.includes(marker));

        if (!hasMarker) {
          continue;
        }

        const name = this.extractNameFromLine(line, lines[i + 1]);

        if (!name || !this.isValidPartyName(name)) {
          continue;
        }

        this.pushPartyIfNew(targetArray, {
          isim: name,
          confidence: 45,
          satirNo: i + 1,
          baglam: line.substring(0, 150) + (line.length > 150 ? '...' : ''),
          satirIcerigi: line,
          kaynak: 'fallback-scan'
        });
      }
    });
  },

  extractNameFromLine(line, nextLine) {
    const fromLine = this.matchNameCandidate(line);

    if (fromLine) {
      return fromLine;
    }

    if (nextLine) {
      return this.matchNameCandidate(nextLine.trim());
    }

    return null;
  },

  matchNameCandidate(line) {
    const titleMatch = line.match(TITLE_CASE_NAME);

    if (titleMatch) {
      return this.normalizeName(titleMatch[1]);
    }

    const capsMatch = line.match(ALL_CAPS_NAME);

    if (capsMatch) {
      const normalized = this.normalizeName(capsMatch[1]);
      const wordCount = normalized.split(/\s+/).length;

      if (wordCount >= 2) {
        return normalized;
      }
    }

    return null;
  },

  pushPartyIfNew(targetArray, entry) {
    const exists = targetArray.find((party) =>
      party.isim && entry.isim && party.isim.toLowerCase() === entry.isim.toLowerCase()
    );

    if (!exists) {
      targetArray.push(entry);
    }
  },

  nullifyEmpty(result) {
    const output = { ...result };

    Object.keys(output).forEach((key) => {
      if (Array.isArray(output[key]) && output[key].length === 0) {
        output[key] = null;
      }
    });

    return output;
  },

  extractParties(line, nextLine, lineNum, type, targetArray) {
    const patterns = [
      new RegExp(`(?:^|\\b)${type}(?:lar|ler)?\\s*[:\\-]?\\s+([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\\.\\-\\s]{2,60}?)(?=\\s+(?:vekili|vekil|müdafi|taraf)|,|\\.|;|$)`, 'gi'),
      new RegExp(`(?:^|\\b)${type}(?:lar|ler)?\\s+([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\\.\\-\\s]{2,60}?)(?=\\s+adına|\\s+tarafından|\\s+taraf|,|\\.|;|$)`, 'gi')
    ];

    patterns.forEach((pattern) => {
      let match;

      while ((match = pattern.exec(line)) !== null) {
        const candidateName = this.normalizeName(match[1]);

        if (!this.isValidPartyName(candidateName)) {
          continue;
        }

        const confidence = this.calculatePartyConfidence(line, nextLine, type, candidateName);

        this.pushPartyIfNew(targetArray, {
          isim: candidateName,
          confidence: confidence,
          satirNo: lineNum,
          baglam: line.substring(0, 150) + (line.length > 150 ? '...' : ''),
          satirIcerigi: line,
          kaynak: 'regex'
        });
      }
    });
  },

  extractVekiller(line, nextLine, lineNum, targetArray) {
    const patterns = [
      /(?:davacı|davalı|sanık|şüpheli|müddei|müddeiumumi)\s+vekili\s*[:\-]?\s*(?:Av\.?\s+)?([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü.\-\s]{2,60}?)(?:,|\.|;|$|'|'ın|'a|'e|'den|'dan|'i|'ı|'u|'ü)/gi,
      /müdafi\s*[:\-]?\s*(?:Av\.?\s+)?([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü.\-\s]{2,60}?)(?:,|\.|;|$|'|'ın|'a|'e|'den|'dan|'i|'ı|'u|'ü)/gi,
      /vekili\s*[:\-]?\s*(?:Av\.?\s+)?([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü.\-\s]{2,60}?)(?:,|\.|;|$|'|'ın|'a|'e|'den|'dan|'i|'ı|'u|'ü)/gi
    ];

    patterns.forEach((pattern) => {
      let match;

      while ((match = pattern.exec(line)) !== null) {
        const candidateName = this.normalizeName(match[1] ? match[1] : match[0]);

        if (!this.isValidPartyName(candidateName)) {
          continue;
        }

        let tip = 'Vekil';

        if (line.toLowerCase().includes('davacı vekili')) {
          tip = 'Davacı Vekili';
        } else if (line.toLowerCase().includes('davalı vekili')) {
          tip = 'Davalı Vekili';
        } else if (line.toLowerCase().includes('sanık vekili') || line.toLowerCase().includes('müdafi')) {
          tip = 'Müdafi';
        } else if (nextLine.toLowerCase().includes('sanık')) {
          tip = 'Müdafi';
        }

        const exists = targetArray.find((item) =>
          item.isim && item.isim.toLowerCase() === candidateName.toLowerCase() && item.tip === tip
        );

        if (!exists) {
          targetArray.push({
            isim: candidateName,
            tip: tip,
            confidence: this.calculateVekilConfidence(line, tip),
            satirNo: lineNum,
            baglam: line.substring(0, 150) + (line.length > 150 ? '...' : ''),
            satirIcerigi: line,
            kaynak: 'regex'
          });
        }
      }
    });
  },

  extractTalepler(line, nextLine, lineNum, targetArray) {
    const talepPatterns = [
      /(?:talep|istek|iddia|dilekçe|başvuru)\s+(?:edilen|ettiği|etti|edilmesi|edilmesine|edilmesini|olduğu)\s+[^.]{6,240}\.?/gi,
      /(?:talep|istek|iddia|dilekçe|başvuru)\s+(?:etti|edildi|oldu)\.?/gi,
      /(?:mahkemece|yerel\s+mahkemece|cumhuriyet\s+savcısı|başsavcılık)\s+[^.]{10,240}(?:talep|istem|iddia)[^.]{4,180}\.?/gi
    ];

    talepPatterns.forEach((pattern) => {
      let match;

      while ((match = pattern.exec(line)) !== null) {
        const talep = match[0].trim();

        if (talep.length < 10 || talep.length > 300) {
          continue;
        }

        if (this.isLowSignalTalep(talep)) {
          continue;
        }

        let tip = 'Talep';

        if (line.toLowerCase().includes('iddia')) {
          tip = 'İddia';
        } else if (line.toLowerCase().includes('dilekçe')) {
          tip = 'Dilekçe';
        } else if (line.toLowerCase().includes('başvuru')) {
          tip = 'Başvuru';
        } else if (nextLine.toLowerCase().includes('itiraz')) {
          tip = 'İtiraz';
        }

        const exists = targetArray.find((item) =>
          item.icerik && item.icerik.toLowerCase() === talep.toLowerCase()
        );

        if (!exists) {
          targetArray.push({
            icerik: talep,
            tip: tip,
            confidence: this.calculateTalepConfidence(line, talep),
            satirNo: lineNum,
            baglam: line.substring(0, 150) + (line.length > 150 ? '...' : ''),
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

    if (blockedWords.some((word) => lowered.includes(word))) {
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

    return blocked.some((item) => lowered.includes(item));
  },

  calculatePartyConfidence(line, nextLine, type, candidateName) {
    let score = 50;
    const lowered = line.toLowerCase();
    const nextLowered = nextLine.toLowerCase();
    const typeLowered = typeof type === 'string' ? type.toLowerCase() : '';

    if (typeLowered && lowered.includes(typeLowered)) {
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
