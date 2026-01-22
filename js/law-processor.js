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
    // Pattern: kanun no + kanun adı + (opsiyonel parantez) + (opsiyonel madde)
    // Önce köşeli parantez formatını kontrol et, sonra normal formatı
    const bracketPattern = /(\d{4})\s*S(?:ayılı)?\.?\s*([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\s]+?)(?:\s*\(([^)]+)\))?\s*\[\s*Madde\s+(\d+)\s*\]/gi;
    const normalPattern = /(\d{4})\s*S(?:ayılı)?\.?\s*([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\s]+?)(?:\s*\(([^)]+)\))?\s*(?:Madde\s+(\d+)|m\.\s+(\d+))/gi;
    const noMaddePattern = /(\d{4})\s*S(?:ayılı)?\.?\s*([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\s]+?)(?:\s*\(([^)]+)\))?\s*$/gi;
    
    // Mülga kanunlar için özel pattern (parantez zorunlu, kanun adı parantezden önce)
    // Köşeli parantez formatı için kullanıcının önerdiği pattern
    const mulgaBracketPattern = /^(\d+)\s*S\.\s*(.+?)(?:\s*\((MÜLGA)\))?\s*\[\s*Madde\s*(\d+)\s*\]/i;
    const mulgaNormalPattern = /^(\d+)\s*S\.\s*(.+?)(?:\s*\((MÜLGA)\))?\s*(?:Madde\s+(\d+)|m\.\s+(\d+))/i;
    
    // Kısa referanslar: "TCK m.124" veya "TCK Madde 124"
    const shortRx = /\b(TMK|TBK|TCK|İİK|HMK|CMK|TTK|İşK|DMK)\s*(?:m\.|Madde)\s*(\d+)/gi;

    // Her satırı ayrı ayrı işle
    lines.forEach((line, lineIndex) => {
      const lineNum = lineIndex + 1;
      
      // Önce mülga kanunları kontrol et (parantez içinde bilgi var)
      let m;
      const isMulgaLine = line.includes('(MÜLGA)') || (line.includes('(') && /\(\s*[A-Z]/.test(line));
      
      if (isMulgaLine) {
        // Önce köşeli parantez formatını kontrol et
        m = mulgaBracketPattern.exec(line);
        if (m) {
          const lawNo = m[1];
          let lawName = m[2] ? m[2].trim() : '';
          const mulgaInfo = m[3] || null;
          const maddeNo = m[4] || null;
          
          if (lawName && lawName.length > 1) {
            this.addLaw(laws, lawNo, lawName, maddeNo, line, lineNum, mulgaInfo);
          }
        } else {
          // Sonra normal formatı kontrol et
          m = mulgaNormalPattern.exec(line);
          if (m) {
            const lawNo = m[1];
            let lawName = m[2] ? m[2].trim() : '';
            const mulgaInfo = m[3] || null;
            const maddeNo = m[4] || m[5] || null;
            
            if (lawName && lawName.length > 1) {
              this.addLaw(laws, lawNo, lawName, maddeNo, line, lineNum, mulgaInfo);
            }
          }
        }
      } else {
        // Normal kanun referanslarını yakala - önce köşeli parantez formatı
        bracketPattern.lastIndex = 0;
        while ((m = bracketPattern.exec(line)) !== null) {
          const lawNo = m[1];
          let lawName = m[2] ? m[2].trim() : '';
          const mulgaInfo = m[3] || null;
          const maddeNo = m[4] || null;
          
          if (lawName && lawName.length > 1) {
            this.addLaw(laws, lawNo, lawName, maddeNo, line, lineNum, mulgaInfo);
          }
        }
        
        // Sonra normal format (Madde veya m.)
        normalPattern.lastIndex = 0;
        while ((m = normalPattern.exec(line)) !== null) {
          const lawNo = m[1];
          let lawName = m[2] ? m[2].trim() : '';
          const mulgaInfo = m[3] || null;
          const maddeNo = m[4] || m[5] || null;
          
          if (lawName && lawName.length > 1) {
            this.addLaw(laws, lawNo, lawName, maddeNo, line, lineNum, mulgaInfo);
          }
        }
        
        // Son olarak madde numarası olmayan formatları kontrol et
        noMaddePattern.lastIndex = 0;
        while ((m = noMaddePattern.exec(line)) !== null) {
          const lawNo = m[1];
          let lawName = m[2] ? m[2].trim() : '';
          const mulgaInfo = m[3] || null;
          
          if (lawName && lawName.length > 1) {
            this.addLaw(laws, lawNo, lawName, null, line, lineNum, mulgaInfo);
          }
        }
      }
      
      // Kısa referansları yakala
      shortRx.lastIndex = 0;
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
