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

      // Davacı çıkarma
      this.extractParties(trimmedLine, lineNum, 'davacı', result.davacilar);
      
      // Davalı çıkarma
      this.extractParties(trimmedLine, lineNum, 'davalı', result.davalilar);
      
      // Vekil çıkarma
      this.extractVekiller(trimmedLine, lineNum, result.vekiller);
      
      // Talep çıkarma
      this.extractTalepler(trimmedLine, lineNum, result.talepler);
    });

    // Boş array'leri null yap
    if (result.davacilar.length === 0) result.davacilar = null;
    if (result.davalilar.length === 0) result.davalilar = null;
    if (result.vekiller.length === 0) result.vekiller = null;
    if (result.talepler.length === 0) result.talepler = null;

    return result;
  },

  extractParties(line, lineNum, type, targetArray) {
    // Pattern: "davacı X", "davalılar Y Z" gibi
    // "vekili" kelimesinden önce durmalı
    const pattern = new RegExp(
      `(?:${type}|${type}lar)\\s+([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\\s]{2,40}?)(?:\\s+vekili|,|\\.|$|'|'ın|'ın|'a|'e|'den|'dan|'i|'ı|'u|'ü|\\s+ve|\\s+ile)`,
      'gi'
    );

    let match;
    while ((match = pattern.exec(line)) !== null) {
      const name = match[1].trim();
      // Çok kısa veya çok uzun isimleri filtrele
      if (name.length < 2 || name.length > 50) continue;
      // Sadece nokta veya virgül olanları filtrele
      if (/^[.,\s]+$/.test(name)) continue;
      // "vekili" kelimesini içeren isimleri filtrele
      if (name.toLowerCase().includes('vekili')) continue;
      
      // Zaten eklenmiş mi kontrol et
      const exists = targetArray.find(p => 
        p.isim && p.isim.toLowerCase() === name.toLowerCase()
      );
      
      if (!exists) {
        targetArray.push({
          isim: name,
          satirNo: lineNum,
          baglam: line.substring(0, 150) + (line.length > 150 ? "..." : ""),
          satirIcerigi: line
        });
      }
    }
  },

  extractVekiller(line, lineNum, targetArray) {
    // Pattern: "davacı vekili X", "davalı vekili Y", "sanık vekili Z", "müdafi A"
    // "Av." kısaltmasını da destekle
    const patterns = [
      /(?:davacı|davalı|sanık|şüpheli|müddei|müddeiumumi)\s+vekili\s+(?:Av\.?\s+)?([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\s]{2,40}?)(?:,|\.|$|'|'ın|'ın|'a|'e|'den|'dan|'i|'ı|'u|'ü)/gi,
      /müdafi\s+(?:Av\.?\s+)?([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\s]{2,40}?)(?:,|\.|$|'|'ın|'ın|'a|'e|'den|'dan|'i|'ı|'u|'ü)/gi,
      /vekili\s+(?:Av\.?\s+)?([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\s]{2,40}?)(?:,|\.|$|'|'ın|'ın|'a|'e|'den|'dan|'i|'ı|'u|'ü)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const name = match[1] ? match[1].trim() : match[0].trim();
        if (name.length < 2 || name.length > 50) continue;
        if (/^[.,\s]+$/.test(name)) continue;
        
        // Vekil tipini belirle
        let tip = 'Vekil';
        if (line.toLowerCase().includes('davacı vekili')) tip = 'Davacı Vekili';
        else if (line.toLowerCase().includes('davalı vekili')) tip = 'Davalı Vekili';
        else if (line.toLowerCase().includes('sanık vekili') || line.toLowerCase().includes('müdafi')) tip = 'Müdafi';
        
        const exists = targetArray.find(v => 
          v.isim && v.isim.toLowerCase() === name.toLowerCase() && v.tip === tip
        );
        
        if (!exists) {
          targetArray.push({
            isim: name,
            tip: tip,
            satirNo: lineNum,
            baglam: line.substring(0, 150) + (line.length > 150 ? "..." : ""),
            satirIcerigi: line
          });
        }
      }
    });
  },

  extractTalepler(line, lineNum, targetArray) {
    // Pattern: "talep edilen", "istek edilen", "iddia edilen", "dilekçe" içeren cümleler
    const talepPatterns = [
      /(?:talep|istek|iddia|dilekçe|başvuru)\s+(?:edilen|ettiği|etti|edilmesi|edilmesine|edilmesini)[^.]*\./gi,
      /(?:talep|istek|iddia|dilekçe|başvuru)\s+(?:edilmesi|edilmesine|edilmesini)[^.]*\./gi
    ];

    talepPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const talep = match[0].trim();
        if (talep.length < 10 || talep.length > 300) continue;
        
        // Talep tipini belirle
        let tip = 'Talep';
        if (line.toLowerCase().includes('iddia')) tip = 'İddia';
        else if (line.toLowerCase().includes('dilekçe')) tip = 'Dilekçe';
        else if (line.toLowerCase().includes('başvuru')) tip = 'Başvuru';
        
        const exists = targetArray.find(t => 
          t.icerik && t.icerik.toLowerCase() === talep.toLowerCase()
        );
        
        if (!exists) {
          targetArray.push({
            icerik: talep,
            tip: tip,
            satirNo: lineNum,
            baglam: line.substring(0, 150) + (line.length > 150 ? "..." : ""),
            satirIcerigi: line
          });
        }
      }
    });
  }
};
