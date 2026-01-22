/**
 * MetaProcessor Unit Tests
 */
import { MetaProcessor } from '../js/meta-processor.js';

describe('MetaProcessor', () => {
  describe('extract', () => {
    test('mahkeme adını doğru parse eder', () => {
      const text = 'Ceza Genel Kurulu 2009/6-163 E., 2009/202 K.';
      const result = MetaProcessor.extract(text);
      expect(result.mahkeme).toContain('Ceza Genel Kurulu');
    });

    test('Hukuk Dairesi formatını parse eder', () => {
      const text = '12. Hukuk Dairesi\nEsas No: 2023/12345';
      const result = MetaProcessor.extract(text);
      expect(result.daire).toBe('12. Hukuk Dairesi');
    });

    test('çoklu esas numarasını parse eder', () => {
      const text = 'Ceza Genel Kurulu 2009/6-163 E., 2009/7 E.';
      const result = MetaProcessor.extract(text);
      expect(result.esas).toBe('2009/6-163');
      expect(result.esasList).toContain('2009/6-163');
      expect(result.esasList).toContain('2009/7');
    });

    test('çoklu karar numarasını parse eder', () => {
      const text = '2009/6-163 E., 2009/202 K., 2010/50 K.';
      const result = MetaProcessor.extract(text);
      expect(result.karar).toBe('2009/202');
      expect(result.kararList).toContain('2009/202');
      expect(result.kararList).toContain('2010/50');
    });

    test('tireli dosya numarasını parse eder', () => {
      const text = 'Esas No: 2009/6-163 E.';
      const result = MetaProcessor.extract(text);
      expect(result.esas).toBe('2009/6-163');
      expect(result.esasBase).toBe('2009/6');
      expect(result.esasEk).toBe('163');
    });

    test('tarih parse eder', () => {
      const text = 'Tarih: 15.01.2024';
      const result = MetaProcessor.extract(text);
      expect(result.tarih).toBe('15.01.2024');
    });

    test('suç adlarını parse eder', () => {
      const text = `HIRSIZLIK
KAMU GÜVENCESİ ALTINDAKİ OTOMOBİLİ ÇALMAK
5237 S. TÜRK CEZA KANUNU [ Madde 124 ]
İçtihat Metni başlıyor...`;
      const result = MetaProcessor.extract(text);
      expect(result.suçAdları).toContain('HIRSIZLIK');
      expect(result.suçAdları).toContain('KAMU GÜVENCESİ ALTINDAKİ OTOMOBİLİ ÇALMAK');
    });

    test('suç adları kanun referansı içermez', () => {
      const text = `HIRSIZLIK
5237 S. TÜRK CEZA KANUNU
İçtihat Metni`;
      const result = MetaProcessor.extract(text);
      expect(result.suçAdları).toContain('HIRSIZLIK');
      expect(result.suçAdları).not.toContain('5237 S. TÜRK CEZA KANUNU');
    });

    test('boş metin için varsayılan değerler döner', () => {
      const result = MetaProcessor.extract('');
      expect(result.mahkeme).toBe('Belirlenemedi');
      expect(result.esas).toBe('Bulunamadı');
      expect(result.karar).toBe('Bulunamadı');
      expect(result.tarih).toBe('Yok');
    });
  });

  describe('extractSuçAdları', () => {
    test('İçtihat Metni öncesindeki suç adlarını bulur', () => {
      const text = `HIRSIZLIK
KAMU GÜVENCESİ ALTINDAKİ OTOMOBİLİ ÇALMAK
İçtihat Metni başlıyor`;
      const result = MetaProcessor.extractSuçAdları(text);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('HIRSIZLIK');
    });

    test('kısa suç adlarını filtreler (minimum 3 karakter)', () => {
      const text = `AB
HIRSIZLIK
İçtihat Metni`;
      const result = MetaProcessor.extractSuçAdları(text);
      expect(result).not.toContain('AB');
      expect(result).toContain('HIRSIZLIK');
    });
  });
});
