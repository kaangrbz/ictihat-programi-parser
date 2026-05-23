export const SCHEMA_VERSION = '1.1.0';

export const FLAG_LABELS = {
  hagb_karari: 'Hükmün Açıklanmasının Geri Bırakılması (HAGB)',
  bozma_karari: 'Bozma Kararı',
  kismen_bozma_karari: 'Kısmen Bozma Kararı',
  onama_karari: 'Onama Kararı',
  red_karari: 'Red Kararı',
  kabul_karari: 'Kabul Kararı',
  beraat_karari: 'Beraat Kararı',
  zamanaşımı: 'Zamanaşımı',
  yetkisizlik: 'Yetkisizlik',
  görevsizlik: 'Görevsizlik',
  derdestlik: 'Derdestlik'
};

export const NIHAI_SONUC_LABELS = {
  bozma: 'Bozma',
  kısmenBozma: 'Kısmen bozma',
  onama: 'Onama',
  red: 'Red',
  kabul: 'Kabul',
  beraat: 'Beraat',
  belirsiz: 'Belirsiz'
};

export const SAMPLE_TEXTS = [
  {
    id: 'kyb',
    label: 'KYB — Ceza Genel Kurulu (index örneği)',
    source: 'index.html'
  },
  {
    id: 'test-basic',
    label: 'Test — Kanun + bozma',
    text: `Ceza Genel Kurulu 2009/6-163 E.
HIRSIZLIK
5237 S. TÜRK CEZA KANUNU [ Madde 124 ]
5271 S. CEZA MUHAKEMESİ KANUNU [ Madde 309 ]
Davacı tazminat talep etti. Karar bozuldu.`
  },
  {
    id: 'test-onama',
    label: 'Test — Onama',
    text: 'Yargıtay 3. Hukuk Dairesi 2020/1234 E., 2021/567 K.\nDava kabul edildi. Karar onandı.'
  },
  {
    id: 'test-parties',
    label: 'Test — Taraflar',
    text: `Davacı: Ahmet Yılmaz
Davalı: Mehmet Demir
Sanık: Ali Kaya
Müşteki: Ayşe Çelik
Davacı Vekili: Av. Zeynep Ak`
  }
];

export const PARAM_GROUPS = [
  {
    title: 'Kök alanlar',
    fields: [
      { key: 'schemaVersion', type: 'string', desc: 'Şema sürümü' },
      { key: 'analizTarihi', type: 'string', desc: 'Analiz zamanı (tr-TR)' },
      { key: 'duyguAnalizi', type: 'null', desc: 'Şu an kullanılmıyor (null)' }
    ]
  },
  {
    title: 'kimlik',
    fields: [
      { key: 'mahkeme', type: 'string' },
      { key: 'daire', type: 'string' },
      { key: 'esas', type: 'string' },
      { key: 'karar', type: 'string' },
      { key: 'tarih', type: 'string' },
      { key: 'konu', type: 'string' },
      { key: 'suçAdları', type: 'string[]' }
    ]
  },
  {
    title: 'mevzuat[]',
    fields: [
      { key: 'lawNo', type: 'string' },
      { key: 'lawName', type: 'string' },
      { key: 'isMulga', type: 'boolean' },
      { key: 'maddeler[].no', type: 'string' },
      { key: 'maddeler[].satirNo', type: 'number' },
      { key: 'maddeler[].baglam', type: 'string' }
    ]
  },
  {
    title: 'hukukiMantik',
    fields: [
      { key: 'flags', type: 'Record<flag, boolean>' },
      { key: 'rawFlags', type: 'Record<flag, boolean>' },
      { key: 'finalDecision', type: 'string | null' },
      { key: 'nihaiKarar.sonuc', type: 'bozma|onama|...' },
      { key: 'nihaiKarar.confidence', type: '0-1' },
      { key: 'details[].confidence', type: '0-100' }
    ]
  },
  {
    title: 'taraflar',
    fields: [
      { key: 'davacilar[]', type: 'PartyPerson' },
      { key: 'saniklar[]', type: 'PartyPerson' },
      { key: 'vekiller[]', type: 'Vekil' },
      { key: 'talepler[]', type: 'Talep' }
    ]
  },
  {
    title: 'kaliteSinyali',
    fields: [
      { key: 'puan', type: 'number' },
      { key: 'seviye', type: 'Dusuk|Orta|Yuksek' },
      { key: 'kirilim', type: 'object' }
    ]
  }
];
