/**
 * Law Structure Parser Module
 * Kanun metnindeki hiyerarşik yapıları tanır (Başlık, Bölüm, Kısım, Madde, Fıkra, Bent, Alt bent)
 */
export const LawStructureParser = {
  /**
   * Satırın kanun başlığı olup olmadığını kontrol eder
   * @param {string} line - Kontrol edilecek satır
   * @returns {Object|null} Başlık bilgisi veya null
   */
  detectKanunBaslik(line) {
    const trimmed = line.trim();
    
    // "TÜRK CEZA KANUNU", "TÜRK MEDENİ KANUNU" gibi tam başlıklar
    const fullTitlePattern = /^([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s]+KANUNU)/;
    const fullMatch = trimmed.match(fullTitlePattern);
    if (fullMatch) {
      return {
        type: 'kanunBaslik',
        baslik: fullMatch[1].trim(),
        kanunNo: this.extractKanunNo(trimmed),
        kabulTarihi: this.extractTarih(trimmed, 'kabul'),
        yururlukTarihi: this.extractTarih(trimmed, 'yürürlük')
      };
    }

    // "5237 sayılı Kanun" formatı
    const numberedPattern = /^(\d{4})\s+sayılı\s+(.+?)(?:\s+Kanunu)?$/i;
    const numberedMatch = trimmed.match(numberedPattern);
    if (numberedMatch) {
      return {
        type: 'kanunBaslik',
        baslik: numberedMatch[2].trim(),
        kanunNo: numberedMatch[1],
        kabulTarihi: null,
        yururlukTarihi: null
      };
    }

    return null;
  },

  /**
   * Satırın kitap başlığı olup olmadığını kontrol eder
   * @param {string} line - Kontrol edilecek satır
   * @returns {Object|null} Kitap bilgisi veya null
   */
  detectKitap(line) {
    const trimmed = line.trim();
    
    // "BİRİNCİ KİTAP", "İKİNCİ KİTAP" gibi
    const turkishPattern = /^(BİRİNCİ|İKİNCİ|ÜÇÜNCÜ|DÖRDÜNCÜ|BEŞİNCİ|ALTINCI|YEDİNCİ|SEKİZİNCİ|DOKUZUNCU|ONUNCU|ONBİRİNCİ|ONİKİNCİ|ONÜÇÜNCÜ|ONDÖRDÜNCÜ|ONBEŞİNCİ|ONALTINCI|ONYEDİNCİ|ONSEKİZİNCİ|ONDOKUZUNCU|YİRMİNCİ)\s+KİTAP(?:\s*[:-]\s*(.+))?$/i;
    const turkishMatch = trimmed.match(turkishPattern);
    if (turkishMatch) {
      return {
        type: 'kitap',
        baslik: turkishMatch[1].toUpperCase() + ' KİTAP',
        baslikMetni: turkishMatch[2] ? turkishMatch[2].trim() : null
      };
    }

    // "KİTAP I", "KİTAP II" gibi Roma rakamları
    const romanPattern = /^KİTAP\s+([IVX]+)(?:\s*[:-]\s*(.+))?$/i;
    const romanMatch = trimmed.match(romanPattern);
    if (romanMatch) {
      return {
        type: 'kitap',
        baslik: 'KİTAP ' + romanMatch[1].toUpperCase(),
        baslikMetni: romanMatch[2] ? romanMatch[2].trim() : null
      };
    }

    return null;
  },

  /**
   * Satırın bölüm başlığı olup olmadığını kontrol eder
   * @param {string} line - Kontrol edilecek satır
   * @returns {Object|null} Bölüm bilgisi veya null
   */
  detectBolum(line) {
    const trimmed = line.trim();
    
    // "BİRİNCİ BÖLÜM", "İKİNCİ BÖLÜM" gibi
    const turkishPattern = /^(BİRİNCİ|İKİNCİ|ÜÇÜNCÜ|DÖRDÜNCÜ|BEŞİNCİ|ALTINCI|YEDİNCİ|SEKİZİNCİ|DOKUZUNCU|ONUNCU|ONBİRİNCİ|ONİKİNCİ|ONÜÇÜNCÜ|ONDÖRDÜNCÜ|ONBEŞİNCİ|ONALTINCI|ONYEDİNCİ|ONSEKİZİNCİ|ONDOKUZUNCU|YİRMİNCİ)\s+BÖLÜM(?:\s*[:-]\s*(.+))?$/i;
    const turkishMatch = trimmed.match(turkishPattern);
    if (turkishMatch) {
      return {
        type: 'bolum',
        baslik: turkishMatch[1].toUpperCase() + ' BÖLÜM',
        baslikMetni: turkishMatch[2] ? turkishMatch[2].trim() : null
      };
    }

    // "BÖLÜM I", "BÖLÜM II" gibi Roma rakamları
    const romanPattern = /^BÖLÜM\s+([IVX]+)(?:\s*[:-]\s*(.+))?$/i;
    const romanMatch = trimmed.match(romanPattern);
    if (romanMatch) {
      return {
        type: 'bolum',
        baslik: 'BÖLÜM ' + romanMatch[1].toUpperCase(),
        baslikMetni: romanMatch[2] ? romanMatch[2].trim() : null
      };
    }

    // "BÖLÜM: Genel Hükümler" gibi
    const simplePattern = /^BÖLÜM\s*[:-]\s*(.+)$/i;
    const simpleMatch = trimmed.match(simplePattern);
    if (simpleMatch) {
      return {
        type: 'bolum',
        baslik: 'BÖLÜM',
        baslikMetni: simpleMatch[1].trim()
      };
    }

    return null;
  },

  /**
   * Satırın kısım başlığı olup olmadığını kontrol eder
   * @param {string} line - Kontrol edilecek satır
   * @returns {Object|null} Kısım bilgisi veya null
   */
  detectKisim(line) {
    const trimmed = line.trim();
    
    // "Birinci Kısım", "İkinci Kısım" gibi
    const turkishPattern = /^(Birinci|İkinci|Üçüncü|Dördüncü|Beşinci|Altıncı|Yedinci|Sekizinci|Dokuzuncu|Onuncu)\s+Kısım(?:\s*[:-]\s*(.+))?$/i;
    const turkishMatch = trimmed.match(turkishPattern);
    if (turkishMatch) {
      return {
        type: 'kisim',
        baslik: turkishMatch[1] + ' Kısım',
        baslikMetni: turkishMatch[2] ? turkishMatch[2].trim() : null
      };
    }

    // "KISIM A", "KISIM B" gibi
    const letterPattern = /^KISIM\s+([A-Z])(?:\s*[:-]\s*(.+))?$/i;
    const letterMatch = trimmed.match(letterPattern);
    if (letterMatch) {
      return {
        type: 'kisim',
        baslik: 'KISIM ' + letterMatch[1].toUpperCase(),
        baslikMetni: letterMatch[2] ? letterMatch[2].trim() : null
      };
    }

    // "KISIM: Kanunun Uygulama Alanı" gibi
    const simplePattern = /^KISIM\s*[:-]\s*(.+)$/i;
    const simpleMatch = trimmed.match(simplePattern);
    if (simpleMatch) {
      return {
        type: 'kisim',
        baslik: 'KISIM',
        baslikMetni: simpleMatch[1].trim()
      };
    }

    return null;
  },

  /**
   * Satırın madde başlığı olup olmadığını kontrol eder
   * @param {string} line - Kontrol edilecek satır
   * @returns {Object|null} Madde bilgisi veya null
   */
  detectMadde(line) {
    const trimmed = line.trim();
    
    // "MADDE 1", "MADDE 1 -", "MADDE 1:" gibi (büyük harf)
    const uppercasePattern = /^MADDE\s+(\d+)(?:\s*[-:]\s*(.+))?$/i;
    const uppercaseMatch = trimmed.match(uppercasePattern);
    if (uppercaseMatch) {
      return {
        type: 'madde',
        no: uppercaseMatch[1],
        baslik: uppercaseMatch[2] ? uppercaseMatch[2].trim() : null
      };
    }

    // "Madde 1", "Madde 1 -", "Madde 1:", "Madde 1-" gibi (başlık formatı)
    const titleCasePattern = /^Madde\s+(\d+)(?:\s*[-:]\s*(.+))?$/;
    const titleCaseMatch = trimmed.match(titleCasePattern);
    if (titleCaseMatch) {
      return {
        type: 'madde',
        no: titleCaseMatch[1],
        baslik: titleCaseMatch[2] ? titleCaseMatch[2].trim() : null
      };
    }

    // "1. Madde" gibi (nadir)
    const numberedPattern = /^(\d+)\.\s*Madde(?:\s*[-:]\s*(.+))?$/i;
    const numberedMatch = trimmed.match(numberedPattern);
    if (numberedMatch) {
      return {
        type: 'madde',
        no: numberedMatch[1],
        baslik: numberedMatch[2] ? numberedMatch[2].trim() : null
      };
    }

    return null;
  },

  /**
   * Satırın fıkra olup olmadığını kontrol eder
   * @param {string} line - Kontrol edilecek satır
   * @returns {Object|null} Fıkra bilgisi veya null
   */
  detectFikra(line) {
    const trimmed = line.trim();
    
    // "(1)", "(2)" gibi parantez içi numara
    const parenPattern = /^\((\d+)\)\s*(.+)$/;
    const parenMatch = trimmed.match(parenPattern);
    if (parenMatch) {
      return {
        type: 'fikra',
        no: parseInt(parenMatch[1]),
        metin: parenMatch[2].trim()
      };
    }

    // "1.", "2." gibi nokta ile biten numara (satır başında)
    const dotPattern = /^(\d+)\.\s+(.+)$/;
    const dotMatch = trimmed.match(dotPattern);
    if (dotMatch && parseInt(dotMatch[1]) <= 50) { // 50'den büyükse muhtemelen bent numarası
      return {
        type: 'fikra',
        no: parseInt(dotMatch[1]),
        metin: dotMatch[2].trim()
      };
    }

    return null;
  },

  /**
   * Satırın bent olup olmadığını kontrol eder
   * @param {string} line - Kontrol edilecek satır
   * @returns {Object|null} Bent bilgisi veya null
   */
  detectBent(line) {
    const trimmed = line.trim();
    
    // "a)", "b)", "c)" gibi harf + parantez
    const letterParenPattern = /^([a-zçğıöşü])\s*\)\s*(.+)$/i;
    const letterParenMatch = trimmed.match(letterParenPattern);
    if (letterParenMatch) {
      return {
        type: 'bent',
        no: letterParenMatch[1].toLowerCase(),
        metin: letterParenMatch[2].trim()
      };
    }

    // "a.", "b." gibi harf + nokta
    const letterDotPattern = /^([a-zçğıöşü])\.\s+(.+)$/i;
    const letterDotMatch = trimmed.match(letterDotPattern);
    if (letterDotMatch) {
      return {
        type: 'bent',
        no: letterDotMatch[1].toLowerCase(),
        metin: letterDotMatch[2].trim()
      };
    }

    return null;
  },

  /**
   * Satırın alt bent olup olmadığını kontrol eder
   * @param {string} line - Kontrol edilecek satır
   * @returns {Object|null} Alt bent bilgisi veya null
   */
  detectAltBent(line) {
    const trimmed = line.trim();
    
    // "aa)", "bb)" gibi çift harf + parantez
    const doubleLetterPattern = /^([a-zçğıöşü]{2})\s*\)\s*(.+)$/i;
    const doubleLetterMatch = trimmed.match(doubleLetterPattern);
    if (doubleLetterMatch) {
      return {
        type: 'altBent',
        no: doubleLetterMatch[1].toLowerCase(),
        metin: doubleLetterMatch[2].trim()
      };
    }

    // "(1)", "(2)" gibi parantez içi numara (fıkra değilse, alt bent olabilir)
    // Bu durumda bağlama göre karar verilir, burada sadece pattern kontrolü yapıyoruz
    const numParenPattern = /^\((\d+)\)\s*(.+)$/;
    const numParenMatch = trimmed.match(numParenPattern);
    if (numParenMatch && parseInt(numParenMatch[1]) > 10) { // 10'dan büyükse muhtemelen alt bent
      return {
        type: 'altBent',
        no: numParenMatch[1],
        metin: numParenMatch[2].trim()
      };
    }

    return null;
  },

  /**
   * Kanun numarasını çıkarır
   * @param {string} text - Metin
   * @returns {string|null} Kanun numarası
   */
  extractKanunNo(text) {
    // "5237 sayılı" formatı
    const pattern1 = /(\d{4})\s+sayılı/i;
    const match1 = text.match(pattern1);
    if (match1) return match1[1];
    
    // "Kanun Numarası : 5237" formatı
    const pattern2 = /Kanun\s+Numarası\s*[:]\s*(\d+)/i;
    const match2 = text.match(pattern2);
    if (match2) return match2[1];
    
    return null;
  },

  /**
   * Tarih bilgisini çıkarır
   * @param {string} text - Metin
   * @param {string} type - 'kabul' veya 'yürürlük'
   * @returns {string|null} Tarih
   */
  extractTarih(text, type) {
    const patterns = {
      kabul: /kabul\s+tarihi[:\s]+(\d{1,2}[./]\d{1,2}[./]\d{4})/i,
      yürürlük: /yürürlük[:\s]+(\d{1,2}[./]\d{1,2}[./]\d{4})/i
    };
    
    const pattern = patterns[type];
    if (!pattern) return null;
    
    const match = text.match(pattern);
    return match ? match[1] : null;
  }
};
