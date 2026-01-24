/**
 * UI Renderer Module
 * Analiz sonuçlarını UI'da gösterir
 */
import { LegalAnalyzer } from './legal-analyzer.js';

export function runAnalysis() {
  const input = document.getElementById("input").value;
  const data = LegalAnalyzer.analyze(input);
  if (!data) return;

  document.getElementById("output").textContent = JSON.stringify(data, null, 2);

  renderArea("stats_area", data.istatistikler);
  
  // Duygu analizi pasif
  const sentArea = document.getElementById("sentiment_area");
  sentArea.innerHTML = "";

  renderArea("meta_area", data.kimlik);

  // Suç Adları
  const sucAdlariArea = document.getElementById("suc_adlari_area");
  sucAdlariArea.innerHTML = "";
  if (data.kimlik.suçAdları && data.kimlik.suçAdları.length > 0) {
    data.kimlik.suçAdları.forEach(suç => {
      const span = document.createElement("span");
      span.className = "badge keyword-badge";
      span.innerHTML = suç;
      sucAdlariArea.appendChild(span);
    });
  } else {
    sucAdlariArea.innerHTML = "<span class='status-msg'>Suç adı bulunamadı.</span>";
  }

  const lawArea = document.getElementById("laws_area");
  lawArea.innerHTML = "";
  if(data.mevzuat.length === 0) lawArea.innerHTML = "<span class='status-msg'>Mevzuat atfı bulunamadı.</span>";
  
  data.mevzuat.forEach(l => {
    l.maddeler.forEach(m => {
      const span = document.createElement("span");
      span.className = "badge law-badge";
      let titleText = m.baglam || "";
      if (l.isMulga) {
        titleText += (titleText ? "\n" : "") + `Mülga: ${l.mulgaInfo || 'Mülga Kanun'}`;
      }
      if (m.satirNo) {
        titleText += (titleText ? "\n" : "") + `Satır: ${m.satirNo}`;
      }
      span.title = titleText;
      
      let lawName = l.lawName || 'Kanun';
      if (l.lawNo) {
        lawName = `${l.lawNo} S. ${lawName}`;
      }
      if (l.isMulga) {
        lawName += ` (MÜLGA)`;
      }
      
      span.innerHTML = `<strong>${lawName}</strong> m.${m.no}`;
      lawArea.appendChild(span);
    });
  });

  const keyArea = document.getElementById("keywords_area");
  keyArea.innerHTML = "";
  if(data.kavramlar.length === 0) keyArea.innerHTML = "<span class='status-msg'>Anahtar kavram bulunamadı.</span>";

  data.kavramlar.forEach(k => {
    keyArea.innerHTML += `<span class="badge keyword-badge">${k}</span>`;
  });

  // Hukuki Mantık Kontrolleri
  const logicArea = document.getElementById("legal_logic_area");
  logicArea.innerHTML = "";
  
  // Flag açıklamaları (Türkçe)
  const flagLabels = {
    'hagb_karari': 'Hükmün Açıklanmasının Geri Bırakılması (HAGB)',
    'bozma_karari': 'Bozma Kararı',
    'onama_karari': 'Onama Kararı',
    'red_karari': 'Red Kararı',
    'kabul_karari': 'Kabul Kararı',
    'beraat_karari': 'Beraat Kararı',
    'zamanaşımı': 'Zamanaşımı',
    'yetkisizlik': 'Yetkisizlik',
    'görevsizlik': 'Görevsizlik',
    'derdestlik': 'Derdestlik'
  };
  
  if (data.hukukiMantik && data.hukukiMantik.flags) {
    const flags = data.hukukiMantik.flags;
    const details = data.hukukiMantik.details;
    
    // Aktif flag'leri göster
    Object.entries(flags).forEach(([key, value]) => {
      if (value === true) {
        const detail = details[key];
        const span = document.createElement("span");
        span.className = "badge sentiment-badge";
        
        const label = flagLabels[key] || key;
        let titleText = `${label}: Bulundu`;
        if (detail && detail.context) {
          titleText += `\n\nBağlam:\n${detail.context}`;
        }
        if (detail && detail.lineNo) {
          titleText += `\n\nSatır No: ${detail.lineNo}`;
        }
        if (detail && detail.satirIcerigi) {
          titleText += `\n\nSatır İçeriği:\n${detail.satirIcerigi.substring(0, 200)}${detail.satirIcerigi.length > 200 ? '...' : ''}`;
        }
        
        span.title = titleText;
        span.innerHTML = `<span class="badge-label">${label}:</span><span class="badge-value">✓</span>`;
        logicArea.appendChild(span);
      }
    });
    
    // Hiç aktif flag yoksa bilgi mesajı
    const activeFlags = Object.values(flags).filter(v => v === true);
    if (activeFlags.length === 0) {
      logicArea.innerHTML = "<span class='status-msg'>Hukuki mantık kontrolü sonucu bulunamadı.</span>";
    }
  } else {
    logicArea.innerHTML = "<span class='status-msg'>Hukuki mantık analizi yapılamadı.</span>";
  }

  // Taraflar ve Talepler
  const partyArea = document.getElementById("taraflar_area");
  partyArea.innerHTML = "";
  
  if (data.taraflar) {
    // Davacılar
    if (data.taraflar.davacilar && data.taraflar.davacilar.length > 0) {
      data.taraflar.davacilar.forEach(davaci => {
        const span = document.createElement("span");
        span.className = "badge keyword-badge";
        let titleText = `Davacı: ${davaci.isim}`;
        if (davaci.baglam) {
          titleText += `\n\nBağlam:\n${davaci.baglam}`;
        }
        if (davaci.satirNo) {
          titleText += `\n\nSatır No: ${davaci.satirNo}`;
        }
        span.title = titleText;
        span.innerHTML = `<span class="badge-label">Davacı:</span><span class="badge-value">${davaci.isim}</span>`;
        partyArea.appendChild(span);
      });
    }
    
    // Davalılar
    if (data.taraflar.davalilar && data.taraflar.davalilar.length > 0) {
      data.taraflar.davalilar.forEach(davali => {
        const span = document.createElement("span");
        span.className = "badge keyword-badge";
        let titleText = `Davalı: ${davali.isim}`;
        if (davali.baglam) {
          titleText += `\n\nBağlam:\n${davali.baglam}`;
        }
        if (davali.satirNo) {
          titleText += `\n\nSatır No: ${davali.satirNo}`;
        }
        span.title = titleText;
        span.innerHTML = `<span class="badge-label">Davalı:</span><span class="badge-value">${davali.isim}</span>`;
        partyArea.appendChild(span);
      });
    }
    
    // Vekiller
    if (data.taraflar.vekiller && data.taraflar.vekiller.length > 0) {
      data.taraflar.vekiller.forEach(vekil => {
        const span = document.createElement("span");
        span.className = "badge keyword-badge";
        let titleText = `${vekil.tip || 'Vekil'}: ${vekil.isim}`;
        if (vekil.baglam) {
          titleText += `\n\nBağlam:\n${vekil.baglam}`;
        }
        if (vekil.satirNo) {
          titleText += `\n\nSatır No: ${vekil.satirNo}`;
        }
        span.title = titleText;
        span.innerHTML = `<span class="badge-label">${vekil.tip || 'Vekil'}:</span><span class="badge-value">${vekil.isim}</span>`;
        partyArea.appendChild(span);
      });
    }
    
    // Talepler
    if (data.taraflar.talepler && data.taraflar.talepler.length > 0) {
      data.taraflar.talepler.forEach(talep => {
        const span = document.createElement("span");
        span.className = "badge sentiment-badge";
        let titleText = `${talep.tip || 'Talep'}`;
        if (talep.icerik) {
          titleText += `\n\nİçerik:\n${talep.icerik.substring(0, 200)}${talep.icerik.length > 200 ? '...' : ''}`;
        }
        if (talep.baglam) {
          titleText += `\n\nBağlam:\n${talep.baglam}`;
        }
        if (talep.satirNo) {
          titleText += `\n\nSatır No: ${talep.satirNo}`;
        }
        span.title = titleText;
        const shortIcerik = talep.icerik ? talep.icerik.substring(0, 50) + (talep.icerik.length > 50 ? '...' : '') : '';
        span.innerHTML = `<span class="badge-label">${talep.tip || 'Talep'}:</span><span class="badge-value">${shortIcerik}</span>`;
        partyArea.appendChild(span);
      });
    }
    
    // Hiçbir şey bulunamadıysa
    if ((!data.taraflar.davacilar || data.taraflar.davacilar.length === 0) &&
        (!data.taraflar.davalilar || data.taraflar.davalilar.length === 0) &&
        (!data.taraflar.vekiller || data.taraflar.vekiller.length === 0) &&
        (!data.taraflar.talepler || data.taraflar.talepler.length === 0)) {
      partyArea.innerHTML = "<span class='status-msg'>Taraflar ve talepler bulunamadı.</span>";
    }
  } else {
    partyArea.innerHTML = "<span class='status-msg'>Taraflar analizi yapılamadı.</span>";
  }
}

export function renderArea(id, obj) {
  const el = document.getElementById(id);
  el.innerHTML = "";
  Object.entries(obj).forEach(([k, v]) => {
    // null değerleri ve suçAdları array'ini atla (ayrı gösteriliyor)
    if (v === null || k === 'suçAdları' || (Array.isArray(v) && v.length === 0)) return;
    
    const span = document.createElement("span");
    span.className = "badge";
    
    // Array değerleri için özel gösterim
    let displayValue = v;
    if (Array.isArray(v)) {
      displayValue = v.join(', ');
    }
    
    span.innerHTML = `<span class="badge-label">${k}:</span><span class="badge-value">${displayValue}</span>`;
    el.appendChild(span);
  });
}

export function clearAll() {
  document.getElementById("input").value = "";
  document.getElementById("output").textContent = "// Bekliyor...";
  ["stats_area", "sentiment_area", "meta_area", "suc_adlari_area", "laws_area", "keywords_area", "legal_logic_area", "taraflar_area"].forEach(id => document.getElementById(id).innerHTML = "");
}

export function copyJSON() {
  const pre = document.getElementById("output");
  navigator.clipboard.writeText(pre.textContent);
  alert("JSON kopyalandı!");
}
