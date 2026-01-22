/**
 * Law Text Parser Module
 * Kanun metnini yapılandırılmış JSON formatına dönüştürür
 */
import { LawStructureParser } from './law-structure-parser.js';

export const LawTextParser = {
  /**
   * Kanun metnini parse eder ve JSON yapısına dönüştürür
   * @param {string} text - Kanun metni
   * @param {string} sourceFileName - Kaynak dosya adı (opsiyonel)
   * @returns {Object} Yapılandırılmış kanun verisi
   */
  parse(text, sourceFileName = null) {
    if (!text || !text.trim()) {
      throw new Error('Boş metin işlenemez');
    }

    // Metni normalize et: çoklu boşlukları tek boşluğa çevir, satırları temizle
    const normalizedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .join('\n');
    
    const lines = normalizedText.split('\n');
    
    const result = {
      kanun: {
        baslik: null,
        kanunNo: null,
        kabulTarihi: null,
        yururlukTarihi: null,
        kitaplar: [],
        bolumler: []
      },
      islemTarihi: new Date().toISOString(),
      kaynakDosya: sourceFileName || null
    };

    // Mevcut bağlam (hangi kitap/bölüm/kısım/madde içindeyiz)
    let currentKitap = null;
    let currentBolum = null;
    let currentKisim = null;
    let currentMadde = null;
    let currentFikra = null;
    let currentBent = null;

    // Kanun başlığını ve numarasını bul (ilk 20 satırda)
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i];
      
      // Kanun başlığı
      const baslikInfo = LawStructureParser.detectKanunBaslik(line);
      if (baslikInfo) {
        result.kanun.baslik = baslikInfo.baslik;
        result.kanun.kanunNo = baslikInfo.kanunNo;
        result.kanun.kabulTarihi = baslikInfo.kabulTarihi;
        result.kanun.yururlukTarihi = baslikInfo.yururlukTarihi;
      }
      
      // "Kanun Numarası : 5237" formatı
      if (!result.kanun.kanunNo) {
        const kanunNoMatch = line.match(/Kanun\s+Numarası\s*[:]\s*(\d+)/i);
        if (kanunNoMatch) {
          result.kanun.kanunNo = kanunNoMatch[1];
        }
      }
      
      // "Kabul Tarihi : 26/9/2004" formatı
      if (!result.kanun.kabulTarihi) {
        const kabulMatch = line.match(/Kabul\s+Tarihi\s*[:]\s*([\d/]+)/i);
        if (kabulMatch) {
          result.kanun.kabulTarihi = kabulMatch[1];
        }
      }
    }

    // Satırları işle
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Boş satırları atla (ama madde içindeki metin birleştirmesini etkilemez)
      if (!line || line.trim().length === 0) {
        continue;
      }
      
      // Kitap kontrolü (en üst seviye)
      const kitapInfo = LawStructureParser.detectKitap(line);
      if (kitapInfo) {
        currentKitap = {
          baslik: kitapInfo.baslik,
          baslikMetni: kitapInfo.baslikMetni,
          bolumler: []
        };
        result.kanun.kitaplar.push(currentKitap);
        currentBolum = null;
        currentKisim = null;
        currentMadde = null;
        currentFikra = null;
        currentBent = null;
        continue;
      }
      
      // Bölüm kontrolü
      const bolumInfo = LawStructureParser.detectBolum(line);
      if (bolumInfo) {
        // Eğer kitap varsa, bölümü kitaba ekle
        if (currentKitap) {
          currentBolum = {
            baslik: bolumInfo.baslik,
            baslikMetni: bolumInfo.baslikMetni,
            kisimlar: []
          };
          currentKitap.bolumler.push(currentBolum);
        } else {
          // Kitap yoksa doğrudan kanuna ekle
          currentBolum = {
            baslik: bolumInfo.baslik,
            baslikMetni: bolumInfo.baslikMetni,
            kisimlar: []
          };
          result.kanun.bolumler.push(currentBolum);
        }
        currentKisim = null;
        currentMadde = null;
        currentFikra = null;
        currentBent = null;
        continue;
      }

      // Kısım kontrolü
      const kisimInfo = LawStructureParser.detectKisim(line);
      if (kisimInfo) {
        // Eğer bölüm yoksa, varsayılan bölüm oluştur
        if (!currentBolum) {
          currentBolum = {
            baslik: 'GENEL BÖLÜM',
            baslikMetni: null,
            kisimlar: []
          };
          if (currentKitap) {
            currentKitap.bolumler.push(currentBolum);
          } else {
            result.kanun.bolumler.push(currentBolum);
          }
        }
        
        currentKisim = {
          baslik: kisimInfo.baslik,
          baslikMetni: kisimInfo.baslikMetni,
          maddeler: []
        };
        currentBolum.kisimlar.push(currentKisim);
        currentMadde = null;
        currentFikra = null;
        currentBent = null;
        continue;
      }

      // Madde kontrolü
      const maddeInfo = LawStructureParser.detectMadde(line);
      if (maddeInfo) {
        // Eğer kısım yoksa, varsayılan kısım oluştur
        if (!currentKisim) {
          if (!currentBolum) {
            currentBolum = {
              baslik: 'GENEL BÖLÜM',
              baslikMetni: null,
              kisimlar: []
            };
            if (currentKitap) {
              currentKitap.bolumler.push(currentBolum);
            } else {
              result.kanun.bolumler.push(currentBolum);
            }
          }
          
          currentKisim = {
            baslik: 'GENEL KISIM',
            baslikMetni: null,
            maddeler: []
          };
          currentBolum.kisimlar.push(currentKisim);
        }

        currentMadde = {
          no: maddeInfo.no,
          baslik: maddeInfo.baslik,
          metin: null,
          fıkralar: []
        };
        currentKisim.maddeler.push(currentMadde);
        currentFikra = null;
        currentBent = null;
        
        // Madde başlığı varsa metin olarak ekle
        if (maddeInfo.baslik) {
          currentMadde.metin = maddeInfo.baslik;
        }
        continue;
      }

      // Fıkra kontrolü (sadece madde içindeyse)
      if (currentMadde) {
        const fikraInfo = LawStructureParser.detectFikra(line);
        if (fikraInfo) {
          currentFikra = {
            no: fikraInfo.no,
            metin: fikraInfo.metin,
            bentler: []
          };
          currentMadde.fıkralar.push(currentFikra);
          currentBent = null;
          continue;
        }

        // Bent kontrolü (fıkra veya madde içindeyse)
        const bentInfo = LawStructureParser.detectBent(line);
        if (bentInfo) {
          currentBent = {
            no: bentInfo.no,
            metin: bentInfo.metin,
            altBentler: []
          };
          
          if (currentFikra) {
            currentFikra.bentler.push(currentBent);
          } else {
            // Fıkra yoksa doğrudan maddeye ekle
            if (currentMadde.fıkralar.length === 0) {
              currentFikra = {
                no: 1,
                metin: null,
                bentler: []
              };
              currentMadde.fıkralar.push(currentFikra);
            }
            currentFikra.bentler.push(currentBent);
          }
          continue;
        }

        // Alt bent kontrolü (bent içindeyse)
        if (currentBent) {
          const altBentInfo = LawStructureParser.detectAltBent(line);
          if (altBentInfo) {
            currentBent.altBentler.push({
              no: altBentInfo.no,
              metin: altBentInfo.metin
            });
            continue;
          }
        }

        // Normal metin satırı - mevcut yapıya ekle
        if (currentBent) {
          // Alt bent metnine ekle
          if (currentBent.altBentler.length > 0) {
            const lastAltBent = currentBent.altBentler[currentBent.altBentler.length - 1];
            lastAltBent.metin = (lastAltBent.metin || '') + (lastAltBent.metin ? ' ' : '') + line;
          } else {
            currentBent.metin = (currentBent.metin || '') + (currentBent.metin ? ' ' : '') + line;
          }
        } else if (currentFikra) {
          // Fıkra metnine ekle
          currentFikra.metin = (currentFikra.metin || '') + (currentFikra.metin ? ' ' : '') + line;
        } else if (currentMadde) {
          // Madde metnine ekle - eğer fıkra yoksa doğrudan maddeye ekle
          if (currentMadde.fıkralar.length === 0) {
            // İlk fıkrayı otomatik oluştur
            currentFikra = {
              no: 1,
              metin: line,
              bentler: []
            };
            currentMadde.fıkralar.push(currentFikra);
          } else {
            // Mevcut fıkraya ekle
            currentFikra.metin = (currentFikra.metin || '') + (currentFikra.metin ? ' ' : '') + line;
          }
        }
      }
    }

    // Temizlik: Boş maddeleri, fıkraları vb. temizle
    this.cleanupStructure(result.kanun);

    return result;
  },

  /**
   * Yapıyı temizler (boş elemanları kaldırır, metinleri düzenler)
   * @param {Object} kanun - Kanun yapısı
   */
  cleanupStructure(kanun) {
    // Kitapları temizle
    if (kanun.kitaplar) {
      kanun.kitaplar.forEach(kitap => {
        if (kitap.bolumler) {
          this.cleanupBolumler(kitap.bolumler);
        }
      });
    }
    
    // Doğrudan bölümleri temizle
    if (kanun.bolumler) {
      this.cleanupBolumler(kanun.bolumler);
    }
  },
  
  /**
   * Bölümleri temizler (yardımcı fonksiyon)
   * @param {Array} bolumler - Bölüm listesi
   */
  cleanupBolumler(bolumler) {
    bolumler.forEach(bolum => {
      if (bolum.kisimlar) {
        bolum.kisimlar.forEach(kisim => {
          if (kisim.maddeler) {
            kisim.maddeler = kisim.maddeler.filter(madde => {
              // Boş maddeleri kaldır
              if (!madde.metin && (!madde.fıkralar || madde.fıkralar.length === 0)) {
                return false;
              }
              
              // Fıkraları temizle
              if (madde.fıkralar) {
                madde.fıkralar = madde.fıkralar.filter(fikra => {
                  if (!fikra.metin && (!fikra.bentler || fikra.bentler.length === 0)) {
                    return false;
                  }
                  
                  // Bentleri temizle
                  if (fikra.bentler) {
                    fikra.bentler = fikra.bentler.filter(bent => {
                      if (!bent.metin && (!bent.altBentler || bent.altBentler.length === 0)) {
                        return false;
                      }
                      
                      // Alt bentleri temizle
                      if (bent.altBentler) {
                        bent.altBentler = bent.altBentler.filter(altBent => altBent.metin && altBent.metin.trim().length > 0);
                      }
                      
                      // Metinleri temizle
                      if (bent.metin) {
                        bent.metin = bent.metin.trim();
                      }
                      
                      return true;
                    });
                  }
                  
                  // Metinleri temizle
                  if (fikra.metin) {
                    fikra.metin = fikra.metin.trim();
                  }
                  
                  return true;
                });
              }
              
              // Metinleri temizle
              if (madde.metin) {
                madde.metin = madde.metin.trim();
              }
              
              return true;
            });
          }
        });
      }
    });
  }
};
