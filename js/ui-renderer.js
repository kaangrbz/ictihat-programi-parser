/**
 * UI Renderer Module
 * Analiz sonuçlarını UI'da gösterir (API'den veri alır)
 */

export async function runAnalysis() {
  const input = document.getElementById("input").value.trim();
  if (!input) return;

  const btn = document.getElementById("btn_analyze");
  const statusEl = document.getElementById("loader_status");
  const originalText = btn?.textContent;
  if (btn) btn.disabled = true;
  if (statusEl) statusEl.textContent = "Analiz ediliyor...";

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.detail || `HTTP ${res.status}`);
    }
    if (!data) return;
    renderResult(data);
  } catch (err) {
    document.getElementById("output").textContent = `// Hata: ${err.message}`;
    if (statusEl) statusEl.textContent = "Analiz başarısız.";
  } finally {
    if (btn) {
      btn.disabled = false;
      if (originalText) btn.textContent = originalText;
    }
    if (statusEl && statusEl.textContent === "Analiz ediliyor...") statusEl.textContent = "Sözlük Hazır ✓";
  }
}

function renderResult(data) {
  document.getElementById("output").textContent = JSON.stringify(data, null, 2);

  renderArea("stats_area", data.istatistikler);

  const sentArea = document.getElementById("sentiment_area");
  sentArea.innerHTML = "";

  renderArea("meta_area", data.kimlik);

  const metaArea = document.getElementById("meta_area");
  if (metaArea && data.schemaVersion) {
    const schemaBadge = document.createElement("span");
    schemaBadge.className = "badge";
    schemaBadge.innerHTML = `<span class="badge-label">schemaVersion:</span><span class="badge-value">${data.schemaVersion}</span>`;
    metaArea.prepend(schemaBadge);
  }
  renderQualitySignal(data.kaliteSinyali);

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
    'kismen_bozma_karari': 'Kısmen Bozma Kararı',
    'onama_karari': 'Onama Kararı',
    'red_karari': 'Red Kararı',
    'kabul_karari': 'Kabul Kararı',
    'beraat_karari': 'Beraat Kararı',
    'zamanaşımı': 'Zamanaşımı',
    'yetkisizlik': 'Yetkisizlik',
    'görevsizlik': 'Görevsizlik',
    'derdestlik': 'Derdestlik'
  };

  const nihaiLabels = {
    bozma: 'Bozma',
    kısmenBozma: 'Kısmen bozma',
    onama: 'Onama',
    red: 'Red',
    kabul: 'Kabul',
    beraat: 'Beraat',
    belirsiz: 'Belirsiz'
  };
  
  if (data.hukukiMantik && data.hukukiMantik.flags) {
    const flags = data.hukukiMantik.flags;
    const details = data.hukukiMantik.details;

    if (data.hukukiMantik.nihaiKarar && data.hukukiMantik.nihaiKarar.sonuc) {
      const nihai = data.hukukiMantik.nihaiKarar;
      const nihaiSpan = document.createElement("span");
      nihaiSpan.className = "badge sentiment-badge";
      const label = nihaiLabels[nihai.sonuc] || nihai.sonuc;
      const conf = typeof nihai.confidence === 'number'
        ? ` (${Math.round(nihai.confidence * 100)}%)`
        : '';
      nihaiSpan.innerHTML = `<span class="badge-label">Nihai karar:</span><span class="badge-value">${label}${conf}</span>`;
      logicArea.appendChild(nihaiSpan);
    }
    
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
        if (detail && typeof detail.confidence === 'number') {
          titleText += `\n\nConfidence: ${detail.confidence}/100`;
        }
        if (detail && detail.matchReason) {
          titleText += `\nMatch: ${detail.matchReason}`;
        }
        
        span.title = titleText;
        const confidenceText = detail && typeof detail.confidence === 'number'
          ? ` (${detail.confidence})`
          : '';
        span.innerHTML = `<span class="badge-label">${label}${confidenceText}:</span><span class="badge-value">✓</span>`;
        logicArea.appendChild(span);
      }
    });
    
    // Hiç aktif flag yoksa bilgi mesajı
    const activeFlags = Object.values(flags).filter(v => v === true);
    if (activeFlags.length === 0) {
      logicArea.innerHTML = "<span class='status-msg'>Hukuki mantık kontrolü sonucu bulunamadı.</span>";
    } else if ((data.hukukiMantik.confidenceScore || 0) < 55) {
      logicArea.innerHTML += "<span class='status-msg'>Uyarı: Hukuki mantık confidence seviyesi düşük.</span>";
    }
  } else {
    logicArea.innerHTML = "<span class='status-msg'>Hukuki mantık analizi yapılamadı.</span>";
  }

  // Taraflar ve Talepler
  const partyArea = document.getElementById("taraflar_area");
  partyArea.innerHTML = "";
  
  function appendPartyBadge(roleLabel, person) {
    const span = document.createElement("span");
    span.className = "badge keyword-badge";
    let titleText = `${roleLabel}: ${person.isim}`;
    if (person.baglam) {
      titleText += `\n\nBağlam:\n${person.baglam}`;
    }
    if (person.satirNo) {
      titleText += `\n\nSatır No: ${person.satirNo}`;
    }
    if (person.kaynak) {
      titleText += `\n\nKaynak: ${person.kaynak}`;
    }
    if (typeof person.confidence === 'number') {
      titleText += `\n\nConfidence: ${person.confidence}/100`;
    }
    span.title = titleText;
    const confidenceText = typeof person.confidence === 'number' ? ` (${person.confidence})` : '';
    const tip = person.tip ? person.tip : roleLabel;
    span.innerHTML = `<span class="badge-label">${tip}${confidenceText}:</span><span class="badge-value">${person.isim}</span>`;
    partyArea.appendChild(span);
  }

  if (data.taraflar) {
    const personGroups = [
      { key: 'davacilar', label: 'Davacı' },
      { key: 'davalilar', label: 'Davalı' },
      { key: 'saniklar', label: 'Sanık' },
      { key: 'mustekiler', label: 'Müşteki' },
      { key: 'mudahiller', label: 'Müdahil' }
    ];

    personGroups.forEach(({ key, label }) => {
      if (data.taraflar[key] && data.taraflar[key].length > 0) {
        data.taraflar[key].forEach((person) => appendPartyBadge(label, person));
      }
    });
    
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
        if (typeof vekil.confidence === 'number') {
          titleText += `\n\nConfidence: ${vekil.confidence}/100`;
        }
        span.title = titleText;
        const confidenceText = typeof vekil.confidence === 'number' ? ` (${vekil.confidence})` : '';
        span.innerHTML = `<span class="badge-label">${vekil.tip || 'Vekil'}${confidenceText}:</span><span class="badge-value">${vekil.isim}</span>`;
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
        if (typeof talep.confidence === 'number') {
          titleText += `\n\nConfidence: ${talep.confidence}/100`;
        }
        span.title = titleText;
        const shortIcerik = talep.icerik ? talep.icerik.substring(0, 50) + (talep.icerik.length > 50 ? '...' : '') : '';
        const confidenceText = typeof talep.confidence === 'number' ? ` (${talep.confidence})` : '';
        span.innerHTML = `<span class="badge-label">${talep.tip || 'Talep'}${confidenceText}:</span><span class="badge-value">${shortIcerik}</span>`;
        partyArea.appendChild(span);
      });
    }
    
    // Hiçbir şey bulunamadıysa
    const hasAnyParty = personGroups.some(({ key }) =>
      data.taraflar[key] && data.taraflar[key].length > 0
    ) ||
      (data.taraflar.vekiller && data.taraflar.vekiller.length > 0) ||
      (data.taraflar.talepler && data.taraflar.talepler.length > 0);

    if (!hasAnyParty) {
      partyArea.innerHTML = "<span class='status-msg'>Taraflar ve talepler bulunamadı.</span>";
    } else {
      const allItems = [
        ...personGroups.flatMap(({ key }) => data.taraflar[key] || []),
        ...(data.taraflar.vekiller || []),
        ...(data.taraflar.talepler || [])
      ];
      const hasLowConfidence = allItems.some(item => (item.confidence || 0) < 55);
      if (hasLowConfidence) {
        partyArea.innerHTML += "<span class='status-msg'>Uyarı: Bazı taraf/talep bulguları düşük confidence ile işaretlendi.</span>";
      }
    }
  } else {
    partyArea.innerHTML = "<span class='status-msg'>Taraflar analizi yapılamadı.</span>";
  }
}

function renderQualitySignal(kaliteSinyali) {
  const area = document.getElementById("sentiment_area");
  if (!area) {
    return;
  }

  area.innerHTML = "";
  if (!kaliteSinyali) {
    area.innerHTML = "<span class='status-msg'>Kalite sinyali hesaplanamadı.</span>";
    return;
  }

  const scoreBadge = document.createElement("span");
  scoreBadge.className = "badge sentiment-badge";
  scoreBadge.innerHTML = `<span class="badge-label">Kalite Skoru:</span><span class="badge-value">${kaliteSinyali.puan}</span>`;
  area.appendChild(scoreBadge);

  const levelBadge = document.createElement("span");
  levelBadge.className = "badge sentiment-badge";
  levelBadge.innerHTML = `<span class="badge-label">Seviye:</span><span class="badge-value">${kaliteSinyali.seviye}</span>`;
  area.appendChild(levelBadge);
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
