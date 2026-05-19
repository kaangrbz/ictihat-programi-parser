/**
 * text-normalizer Unit Tests
 */
import { normalizeLegalText } from '../js/text-normalizer.js';

describe('normalizeLegalText', () => {
  test('br ve p etiketlerini satır sonuna çevirir', () => {
    const input = 'Satır1<br>Satır2</p>Satır3';
    const result = normalizeLegalText(input);

    expect(result).toContain('Satır1\nSatır2');
    expect(result).toContain('Satır3');
    expect(result).not.toMatch(/<[^>]+>/);
  });

  test('HTML etiketlerini kaldırır', () => {
    const input = '<b><font>Metin</font></b>';
    const result = normalizeLegalText(input);

    expect(result).toBe('Metin');
  });

  test('çoklu boş satırları iki satıra indirger', () => {
    const input = 'A\n\n\n\nB';
    const result = normalizeLegalText(input);

    expect(result).toBe('A\n\nB');
  });

  test('tab ve çoklu boşlukları tek boşluğa indirger', () => {
    const input = 'Kelime1\t\tKelime2   Kelime3';
    const result = normalizeLegalText(input);

    expect(result).toBe('Kelime1 Kelime2 Kelime3');
  });

  test('mevzuat satırını bozmaz', () => {
    const input = '5237 S. TÜRK CEZA KANUNU [ Madde 124 ]';
    const result = normalizeLegalText(input);

    expect(result).toBe(input);
  });

  test('nbsp ve amp entity decode eder', () => {
    const input = 'A&nbsp;B&amp;C';
    const result = normalizeLegalText(input);

    expect(result).toBe('A B&C');
  });

  test('boş girdi için boş string döner', () => {
    expect(normalizeLegalText('')).toBe('');
    expect(normalizeLegalText('   ')).toBe('');
  });
});
