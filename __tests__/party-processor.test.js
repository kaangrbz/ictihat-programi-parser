/**
 * PartyProcessor Unit Tests
 */
import { PartyProcessor } from '../js/party-processor.js';

describe('PartyProcessor', () => {
  describe('extract', () => {
    test('davacı ismini çıkarır', () => {
      const text = 'Davacı Ahmet Yılmaz dava açtı.';
      const result = PartyProcessor.extract(text);
      expect(result.davacilar).not.toBeNull();
      expect(result.davacilar.length).toBeGreaterThan(0);
      expect(result.davacilar[0].isim).toContain('Ahmet');
      expect(result.davacilar[0].confidence).toBeGreaterThan(0);
    });

    test('davalı ismini çıkarır', () => {
      const text = 'Davalı Mehmet Demir aleyhine dava açıldı.';
      const result = PartyProcessor.extract(text);
      expect(result.davalilar).not.toBeNull();
      expect(result.davalilar.length).toBeGreaterThan(0);
      expect(result.davalilar[0].isim).toContain('Mehmet');
      expect(result.davalilar[0].confidence).toBeGreaterThan(0);
    });

    test('davacı vekilini çıkarır', () => {
      const text = 'Davacı vekili Av. Ali Kaya dilekçe verdi.';
      const result = PartyProcessor.extract(text);
      expect(result.vekiller).not.toBeNull();
      expect(result.vekiller.length).toBeGreaterThan(0);
      expect(result.vekiller[0].isim).toContain('Ali');
      expect(result.vekiller[0].tip).toBe('Davacı Vekili');
      expect(result.vekiller[0].confidence).toBeGreaterThan(0);
    });

    test('davalı vekilini çıkarır', () => {
      const text = 'Davalı vekili Av. Fatma Şahin cevap verdi.';
      const result = PartyProcessor.extract(text);
      expect(result.vekiller).not.toBeNull();
      expect(result.vekiller.length).toBeGreaterThan(0);
      expect(result.vekiller[0].tip).toBe('Davalı Vekili');
    });

    test('müdafii çıkarır', () => {
      const text = 'Sanık vekili Av. Can Öz müdafi olarak görev yaptı.';
      const result = PartyProcessor.extract(text);
      expect(result.vekiller).not.toBeNull();
      expect(result.vekiller.length).toBeGreaterThan(0);
      const mudafi = result.vekiller.find(v => v.tip === 'Müdafi');
      expect(mudafi).toBeDefined();
    });

    test('talebi çıkarır', () => {
      const text = 'Davacı tazminat talep etti.';
      const result = PartyProcessor.extract(text);
      expect(result.talepler).not.toBeNull();
      expect(result.talepler.length).toBeGreaterThan(0);
      expect(result.talepler[0].icerik).toContain('talep');
      expect(result.talepler[0].confidence).toBeGreaterThan(0);
    });

    test('iddiayı çıkarır', () => {
      const text = 'Davacı zarar iddia etti.';
      const result = PartyProcessor.extract(text);
      expect(result.talepler).not.toBeNull();
      expect(result.talepler.length).toBeGreaterThan(0);
      const iddia = result.talepler.find(t => t.tip === 'İddia');
      expect(iddia).toBeDefined();
    });

    test('dilekçeyi çıkarır', () => {
      const text = 'Dilekçe edilmesi gerektiği belirtildi.';
      const result = PartyProcessor.extract(text);
      expect(result.talepler).not.toBeNull();
      expect(result.talepler.length).toBeGreaterThan(0);
      const dilekce = result.talepler.find(t => t.tip === 'Dilekçe');
      expect(dilekce).toBeDefined();
    });

    test('çoklu davacı çıkarır', () => {
      const text = `Davacı Ahmet Yılmaz dava açtı.
Davacılar Mehmet Demir ve Ali Kaya birlikte dava açtı.`;
      const result = PartyProcessor.extract(text);
      expect(result.davacilar).not.toBeNull();
      expect(result.davacilar.length).toBeGreaterThan(1);
    });

    test('satır numarası ve bağlam bilgisini saklar', () => {
      const text = 'Davacı Ahmet Yılmaz dava açtı.';
      const result = PartyProcessor.extract(text);
      expect(result.davacilar).not.toBeNull();
      expect(result.davacilar[0].satirNo).toBe(1);
      expect(result.davacilar[0].baglam).toBeDefined();
      expect(result.davacilar[0].satirIcerigi).toBeDefined();
    });

    test('sanık colon formatını çıkarır', () => {
      const text = 'Sanık: Mehmet Yılmaz hakkında dava açıldı.';
      const result = PartyProcessor.extract(text);
      expect(result.saniklar).not.toBeNull();
      expect(result.saniklar[0].isim).toContain('Mehmet');
    });

    test('müşteki colon formatını çıkarır', () => {
      const text = 'Müşteki: Ayşe Demir şikayette bulundu.';
      const result = PartyProcessor.extract(text);
      expect(result.mustekiler).not.toBeNull();
      expect(result.mustekiler[0].isim).toContain('Ayşe');
    });

    test('bulunamayan taraflar için null döner', () => {
      const text = 'Bu metinde hiçbir taraf yok.';
      const result = PartyProcessor.extract(text);
      expect(result.davacilar).toBeNull();
      expect(result.davalilar).toBeNull();
      expect(result.saniklar).toBeNull();
      expect(result.mustekiler).toBeNull();
      expect(result.mudahiller).toBeNull();
      expect(result.vekiller).toBeNull();
      expect(result.talepler).toBeNull();
    });

    test('karmaşık metinde tüm bilgileri çıkarır', () => {
      const text = `Davacı Ahmet Yılmaz dava açtı.
Davalı Mehmet Demir aleyhine dava açıldı.
Davacı vekili Av. Ali Kaya dilekçe verdi.
Davalı vekili Av. Fatma Şahin cevap verdi.
Davacı tazminat talep etti.
Davalı zarar iddia etti.`;
      const result = PartyProcessor.extract(text);
      expect(result.davacilar).not.toBeNull();
      expect(result.davalilar).not.toBeNull();
      expect(result.vekiller).not.toBeNull();
      expect(result.talepler).not.toBeNull();
      expect(result.davacilar.length).toBeGreaterThan(0);
      expect(result.davalilar.length).toBeGreaterThan(0);
      expect(result.vekiller.length).toBeGreaterThan(1);
      expect(result.talepler.length).toBeGreaterThan(1);
    });

    test('sinyali dusuk gürültü satirlarini taraf olarak islemez', () => {
      const text = 'Davacı Mahkeme kararı gereğince dosya incelenmiştir.';
      const result = PartyProcessor.extract(text);
      expect(result.davacilar).toBeNull();
    });

    test('uzun karar metninde en az bir taraf veya talep sinyali yakalar', () => {
      const text = `Yargıtay C.Başsavcılığı itiraz yasa yoluna başvurarak kararın kaldırılmasına
ve dosyanın Özel Daireye gönderilmesine karar verilmesini talep etmiştir.
Davacı vekili Av. Ali Demir dilekçe sundu.`;
      const result = PartyProcessor.extract(text);
      const total = (result.davacilar || []).length +
        (result.davalilar || []).length +
        (result.saniklar || []).length +
        (result.mustekiler || []).length +
        (result.mudahiller || []).length +
        (result.vekiller || []).length +
        (result.talepler || []).length;
      expect(total).toBeGreaterThan(0);
    });

    test('fallback scan ile DAVACI satırından isim çıkarır', () => {
      const header = 'DAVACI\n';
      const nameLine = 'AHMET YILMAZ\n';
      const padding = Array.from({ length: 5 }, () => 'boş satır').join('\n');
      const text = `${header}${nameLine}${padding}`;
      const result = PartyProcessor.extract(text);

      expect(result.davacilar).not.toBeNull();
      expect(result.davacilar[0].kaynak).toBe('fallback-scan');
    });
  });
});
