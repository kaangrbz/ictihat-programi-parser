/**
 * LegalLogicProcessor Unit Tests
 */
import { LegalLogicProcessor } from '../js/legal-logic-processor.js';

describe('LegalLogicProcessor', () => {
  describe('analyze', () => {
    test('HAGB flagini bulur', () => {
      const text = 'Hükmün açıklanmasının geri bırakılması kararı verildi';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.contains_hgab).toBe(true);
      expect(result.details.contains_hgab.found).toBe(true);
    });

    test('bozma flagini bulur', () => {
      const text = 'Kararın bozulmasına karar verildi';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.is_bozma).toBe(true);
    });

    test('onama flagini bulur', () => {
      const text = 'Karar onandı';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.is_onama).toBe(true);
    });

    test('red flagini bulur', () => {
      const text = 'İstek reddedildi';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.is_red).toBe(true);
    });

    test('kabul flagini bulur', () => {
      const text = 'Dava kabul edildi';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.is_kabul).toBe(true);
    });

    test('beraat flagini bulur', () => {
      const text = 'Sanık hakkında beraat kararı verildi';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.is_beraat).toBe(true);
    });

    test('zamanaşımı flagini bulur', () => {
      const text = 'Zamanaşımı itirazı kabul edildi';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.zamanaşımı).toBe(true);
    });

    test('yetkisizlik flagini bulur', () => {
      const text = 'Mahkeme yetkisizlik kararı verdi';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.yetkisizlik).toBe(true);
    });

    test('görevsizlik flagini bulur', () => {
      const text = 'Görevsizlik kararı verildi';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.görevsizlik).toBe(true);
    });

    test('derdestlik flagini bulur', () => {
      const text = 'Derdestlik itirazı kabul edildi';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.derdestlik).toBe(true);
    });

    test('birden fazla flag bulur', () => {
      const text = `Karar bozuldu ve yeniden incelendi.
      Dava kabul edildi.`;
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.is_bozma).toBe(true);
      expect(result.flags.is_kabul).toBe(true);
    });

    test('flag bulunamazsa false döner', () => {
      const text = 'Bu metinde hiçbir hukuki mantık kontrolü yok';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.flags.contains_hgab).toBe(false);
      expect(result.flags.is_bozma).toBe(false);
    });

    test('satır numarasını saklar', () => {
      const text = `Satır 1
Satır 2
Karar bozuldu
Satır 4`;
      const result = LegalLogicProcessor.analyze(text);
      expect(result.details.is_bozma.lineNo).toBe(3);
    });

    test('bağlam bilgisini saklar', () => {
      const text = 'Kararın bozulmasına karar verildi';
      const result = LegalLogicProcessor.analyze(text);
      expect(result.details.is_bozma.context).toContain('bozulmasına');
    });
  });

  describe('findPattern', () => {
    test('pattern bulur', () => {
      const lines = ['Test satırı', 'Karar bozuldu', 'Başka satır'];
      const patterns = [/bozuldu/gi];
      const result = LegalLogicProcessor.findPattern(lines, patterns, 'test');
      expect(result.found).toBe(true);
      expect(result.lineNo).toBe(2);
    });

    test('pattern bulamazsa false döner', () => {
      const lines = ['Test satırı', 'Başka satır'];
      const patterns = [/bulunamaz/gi];
      const result = LegalLogicProcessor.findPattern(lines, patterns, 'test');
      expect(result.found).toBe(false);
      expect(result.lineNo).toBe(null);
    });
  });
});
