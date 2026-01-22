/**
 * Law Processor Module
 * Satır bazlı mevzuat referanslarını çıkarır (mülga kanun desteği ile)
 */
export const LawProcessor = {
  parse(text) {
    const laws = [];
    // Satır bazlı işleme: metni satırlara böl
    const lines = text.split('\n');
    
    // Tam kanun referansı: "5237 S. TCK Madde 124" veya "5237 S. TCK [ Madde 124 ]" gibi
    // Mülga kanun desteği: "765 S. TÜRK CEZA KANUNU (MÜLGA)" gibi parantezli ifadeleri yakala
    // Köşeli parantez desteği: "[ Madde 124 ]" formatını da yakala
    const fullPattern = /(\d{4})\s*S(?:ayılı)?\.?\s*([^(]+?)(?:\s*\(([^)]+)\))?(?:\s+Madde\s+(\d+)|m\.\s+(\d+)|\[\s*Madde\s+(\d+)\s*\])?/gi;
    
    // Kısa referanslar: "TCK m.124" veya "TCK Madde 124"
    const shortRx = /\b(TMK|TBK|TCK|İİK|HMK|CMK|TTK|İşK|DMK)\s*(?:m\.|Madde)\s*(\d+)/gi;

    // Her satırı ayrı ayrı işle
    lines.forEach((line, lineIndex) => {
      const lineNum = lineIndex + 1;
      
      // Tam kanun referanslarını yakala (mülga desteği ile)
      let m;
      while ((m = fullPattern.exec(line)) !== null) {
        const lawNo = m[1];
        const lawName = m[2].trim();
        const mulgaInfo = m[3] || null; // Parantez içi bilgi (MÜLGA, Yürürlükten Kaldırılmış vb.)
        // Madde numarası: normal format (m[4]), kısa format (m[5]), veya köşeli parantez formatı (m[6])
        const maddeNo = m[4] || m[5] || m[6] || null;
        
        this.addLaw(laws, lawNo, lawName, maddeNo, line, lineNum, mulgaInfo);
      }
      
      // Kısa referansları yakala
      while ((m = shortRx.exec(line)) !== null) {
        this.addLaw(laws, null, m[1], m[2], line, lineNum, null);
      }
    });
    
    return laws;
  },
  
  addLaw(list, no, name, madde, lineContent, lineNum, mulgaInfo) {
    // Kanun adını temizle (başında/sonunda boşluk, nokta vb.)
    const cleanName = name ? name.trim().replace(/\.$/, '') : null;
    
    // Mevcut kanunu bul veya yeni oluştur
    let law = list.find(l => {
      if (no && l.lawNo === no) return true;
      if (cleanName && l.lawName && l.lawName.toLowerCase() === cleanName.toLowerCase()) return true;
      return false;
    });
    
    if (!law) {
      law = { 
        lawNo: no, 
        lawName: cleanName, 
        isMulga: mulgaInfo !== null,
        mulgaInfo: mulgaInfo,
        maddeler: [] 
      };
      list.push(law);
    }
    
    // Mülga bilgisi güncelle (eğer daha önce yoksa)
    if (mulgaInfo && !law.mulgaInfo) {
      law.isMulga = true;
      law.mulgaInfo = mulgaInfo;
    }
    
    // Madde varsa ekle
    if (madde) {
      let mObj = law.maddeler.find(item => item.no === madde);
      if (!mObj) {
        law.maddeler.push({ 
          no: madde, 
          baglam: lineContent.trim().substring(0, 120) + (lineContent.trim().length > 120 ? "..." : ""),
          satirNo: lineNum,
          satirIcerigi: lineContent.trim()
        });
      }
    }
  }
};
