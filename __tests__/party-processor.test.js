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
    });

    test('davalı ismini çıkarır', () => {
      const text = 'Davalı Mehmet Demir aleyhine dava açıldı.';
      const result = PartyProcessor.extract(text);
      expect(result.davalilar).not.toBeNull();
      expect(result.davalilar.length).toBeGreaterThan(0);
      expect(result.davalilar[0].isim).toContain('Mehmet');
    });

    test('davacı vekilini çıkarır', () => {
      const text = 'Davacı vekili Av. Ali Kaya dilekçe verdi.';
      const result = PartyProcessor.extract(text);
      expect(result.vekiller).not.toBeNull();
      expect(result.vekiller.length).toBeGreaterThan(0);
      expect(result.vekiller[0].isim).toContain('Ali');
      expect(result.vekiller[0].tip).toBe('Davacı Vekili');
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

    test('bulunamayan taraflar için null döner', () => {
      const text = 'Bu metinde hiçbir taraf yok.';
      const result = PartyProcessor.extract(text);
      expect(result.davacilar).toBeNull();
      expect(result.davalilar).toBeNull();
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
  });
});
