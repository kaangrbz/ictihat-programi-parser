/**
 * Law Processor Module
 * Satır bazlı mevzuat referanslarını çıkarır (mülga kanun desteği ile)
 */
export const LawProcessor = {
  parse(text) {
    const laws = [];
    // Satır bazlı işleme: metni satırlara böl
    const lines = text.split('\n');
    
    // Köşeli parantez formatı için pattern (mülga dahil): "5237 S. TÜRK CEZA KANUNU [ Madde 124 ]" veya "765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 491 ]"
    const bracketPattern = /^\s*(?<kanun_no>\d+)\s+S\.\s+(?<kanun_adi>[A-ZÇĞİÖŞÜ\s]+?)(?:\s+\((?<mulga>MÜLGA)\))?\s+\[\s*Madde\s+(?<madde_no>\d+)\s*\]\s*$/i;
    
    // Normal format (mülga dahil): "5237 S. TÜRK CEZA KANUNU Madde 124" veya "765 S. TÜRK CEZA KANUNU (MÜLGA) Madde 491"
    const normalPattern = /^\s*(?<kanun_no>\d+)\s+S\.\s+(?<kanun_adi>[A-ZÇĞİÖŞÜ\s]+?)(?:\s+\((?<mulga>MÜLGA)\))?\s+(?:Madde\s+(?<madde_no>\d+)|m\.\s+(?<madde_no_alt>\d+))\s*$/i;
    
    // Madde numarası olmayan format: "5237 S. TÜRK CEZA KANUNU" veya "765 S. TÜRK CEZA KANUNU (MÜLGA)"
    const noMaddePattern = /^\s*(?<kanun_no>\d+)\s+S\.\s+(?<kanun_adi>[A-ZÇĞİÖŞÜ\s]+?)(?:\s+\((?<mulga>MÜLGA)\))?\s*$/i;
    
    // Kısa referanslar: "TCK m.124" veya "TCK Madde 124"
    const shortRx = /\b(TMK|TBK|TCK|İİK|HMK|CMK|TTK|İşK|DMK)\s*(?:m\.|Madde)\s*(\d+)/gi;

    // Her satırı ayrı ayrı işle
    lines.forEach((line, lineIndex) => {
      const lineNum = lineIndex + 1;
      let isProcessed = false;
      
      // Önce köşeli parantez formatını kontrol et (mülga dahil)
      bracketPattern.lastIndex = 0;
      let m = bracketPattern.exec(line);
      if (m && m.groups) {
        const lawNo = m.groups.kanun_no;
        const lawName = m.groups.kanun_adi ? m.groups.kanun_adi.trim() : '';
        const mulgaInfo = m.groups.mulga || null;
        const maddeNo = m.groups.madde_no || null;
        
        if (lawName && lawName.length > 1) {
          this.addLaw(laws, lawNo, lawName, maddeNo, line, lineNum, mulgaInfo);
          isProcessed = true;
        }
      }
      
      // Eğer işlenmediyse normal formatı kontrol et (mülga dahil)
      if (!isProcessed) {
        normalPattern.lastIndex = 0;
        m = normalPattern.exec(line);
        if (m && m.groups) {
          const lawNo = m.groups.kanun_no;
          const lawName = m.groups.kanun_adi ? m.groups.kanun_adi.trim() : '';
          const mulgaInfo = m.groups.mulga || null;
          const maddeNo = m.groups.madde_no || m.groups.madde_no_alt || null;
          
          if (lawName && lawName.length > 1) {
            this.addLaw(laws, lawNo, lawName, maddeNo, line, lineNum, mulgaInfo);
            isProcessed = true;
          }
        }
      }
      
      // Eğer işlenmediyse madde numarası olmayan formatı kontrol et
      if (!isProcessed) {
        noMaddePattern.lastIndex = 0;
        m = noMaddePattern.exec(line);
        if (m && m.groups) {
          const lawNo = m.groups.kanun_no;
          const lawName = m.groups.kanun_adi ? m.groups.kanun_adi.trim() : '';
          const mulgaInfo = m.groups.mulga || null;
          
          if (lawName && lawName.length > 1) {
            this.addLaw(laws, lawNo, lawName, null, line, lineNum, mulgaInfo);
            isProcessed = true;
          }
        }
      }
      
      // Kısa referansları yakala (işlenmediyse)
      if (!isProcessed) {
        shortRx.lastIndex = 0;
        while ((m = shortRx.exec(line)) !== null) {
          this.addLaw(laws, null, m[1], m[2], line, lineNum, null);
        }
      }
    });
    
    return laws;
  },
  
  addLaw(list, no, name, madde, lineContent, lineNum, mulgaInfo) {
    // Kanun adını temizle (başında/sonunda boşluk, nokta vb.)
    const cleanName = name ? name.trim().replace(/\.$/, '') : null;
    const isMulga = mulgaInfo !== null;
    
    // Mevcut kanunu bul veya yeni oluştur
    // ÖNEMLİ: Mülga ve normal kanunlar aynı kanun numarası/adına sahip olsa bile farklı kanunlardır
    let law = list.find(l => {
      // Kanun numarası varsa ve eşleşiyorsa, mülga durumu da aynı olmalı
      if (no && l.lawNo === no) {
        const lIsMulga = l.isMulga || l.mulgaInfo !== null;
        if (lIsMulga === isMulga) return true;
        // Mülga durumu farklıysa farklı kanun sayılır
        return false;
      }
      // Kanun adı varsa ve eşleşiyorsa, mülga durumu da aynı olmalı
      if (cleanName && l.lawName && l.lawName.toLowerCase() === cleanName.toLowerCase()) {
        const lIsMulga = l.isMulga || l.mulgaInfo !== null;
        if (lIsMulga === isMulga) return true;
        // Mülga durumu farklıysa farklı kanun sayılır
        return false;
      }
      return false;
    });
    
    if (!law) {
      law = { 
        lawNo: no, 
        lawName: cleanName, 
        isMulga: isMulga,
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
