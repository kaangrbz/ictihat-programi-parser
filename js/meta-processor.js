/**
 * Meta Processor Module
 * Karar bilgilerini (daire, esas, karar, tarih vb.) çıkarır
 */
export const MetaProcessor = {
  extract(text) {
    // Mahkeme adı parsing: "Ceza Genel Kurulu", "Hukuk Genel Kurulu", "12. Hukuk Dairesi" vb.
    const mahkemeMatch = text.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü\s]+?)\s+(?:Genel\s+Kurulu?|Dairesi|Mahkemesi|İstinaf\s+Dairesi|Bölge\s+(?:Adliye|İdare)\s+Mahkemesi)/i);
    const mahkeme = mahkemeMatch ? mahkemeMatch[1].trim() + " " + mahkemeMatch[0].split(/\s+/).slice(-2).join(" ") : null;
    
    // Daire parsing (mevcut)
    const daire = text.match(/(\d+\.\s*(Hukuk|Ceza)\s*Dairesi)/i)?.[1] || null;
    
    // Çoklu esas numarası: "2009/6-163 E., 2009/202 E." formatlarını yakala
    const esasMatches = [...text.matchAll(/(\d{4}\/(?:\d+(?:-\d+)?))\s*(?:E\.|Esas\s*No:?)/gi)];
    const esasList = esasMatches.map(m => m[1]);
    const esasFull = esasList.length > 0 ? esasList[0] : "Bulunamadı";
    const esasBase = esasFull !== "Bulunamadı" ? esasFull.split('-')[0] : null;
    const esasEk = esasFull !== "Bulunamadı" && esasFull.includes('-') ? esasFull.split('-')[1] : null;
    
    // Çoklu karar numarası: "2009/6-163 K., 2009/202 K." formatlarını yakala
    const kararMatches = [...text.matchAll(/(\d{4}\/(?:\d+(?:-\d+)?))\s*(?:K\.|Karar\s*No:?)/gi)];
    const kararList = kararMatches.map(m => m[1]);
    const kararFull = kararList.length > 0 ? kararList[0] : "Bulunamadı";
    const kararBase = kararFull !== "Bulunamadı" ? kararFull.split('-')[0] : null;
    const kararEk = kararFull !== "Bulunamadı" && kararFull.includes('-') ? kararFull.split('-')[1] : null;
    
    // Suç adları parsing: "İçtihat Metni" öncesindeki büyük harfli satırları yakala
    const suçAdları = this.extractSuçAdları(text);
    
    return {
      mahkeme: mahkeme || "Belirlenemedi",
      daire: daire || null,
      esas: esasFull,
      esasList: esasList.length > 0 ? esasList : null,
      esasBase: esasBase,
      esasEk: esasEk,
      karar: kararFull,
      kararList: kararList.length > 0 ? kararList : null,
      kararBase: kararBase,
      kararEk: kararEk,
      tarih: text.match(/(\d{1,2}\.\d{1,2}\.\d{4})/)?.[1] || "Yok",
      konu: text.match(/(?:DAVA TÜRÜ|KONU)\s*:\s*([^\n]+)/i)?.[1]?.trim() || "Genel Hukuki Uyuşmazlık",
      suçAdları: suçAdları
    };
  },
  
  extractSuçAdları(text) {
    // "İçtihat Metni" veya benzer ayırıcıyı bul
    const headerEnd = text.search(/İçtihat\s+Metni|GEREKÇE|KARAR|TÜRK\s+MİLLETİ\s+ADINA/i);
    const headerText = headerEnd > 0 ? text.substring(0, headerEnd) : text;
    
    // Satırları analiz et
    const lines = headerText.split('\n');
    const suçAdları = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      // Büyük harfli, minimum 3 karakter, kanun referansı içermeyen satırları suç adı olarak işaretle
      if (trimmed.length >= 3 && 
          /^[A-ZÇĞİÖŞÜ\s]+$/.test(trimmed) &&
          !/\d{4}\s*S/.test(trimmed) && // Kanun referansı değil
          !/^\d+\.\s*(Hukuk|Ceza)\s*Dairesi/i.test(trimmed) && // Daire adı değil
          !/\d{4}\/\d+/.test(trimmed) && // Dosya numarası değil
          !/Genel\s+Kurulu?|Dairesi|Mahkemesi/i.test(trimmed)) { // Mahkeme adı değil
        suçAdları.push(trimmed);
      }
    });
    
    return suçAdları.length > 0 ? suçAdları : null;
  }
};
