import { parseCsv, toCsv } from './csv.util';

describe('csv.util', () => {
  describe('toCsv', () => {
    it('entrecomilla campos con coma, comilla o salto de línea', () => {
      const csv = toCsv([
        ['name', 'notes'],
        ['Ana, María', 'dijo "hola"'],
        ['Luis', 'línea 1\nlínea 2'],
      ]);
      expect(csv).toBe(
        'name,notes\r\n"Ana, María","dijo ""hola"""\r\n' +
          'Luis,"línea 1\nlínea 2"',
      );
    });
  });

  describe('parseCsv', () => {
    it('parsea campos entrecomillados con comas y comillas escapadas', () => {
      const rows = parseCsv('a,b\r\n"x,y","he said ""hi"""');
      expect(rows).toEqual([
        ['a', 'b'],
        ['x,y', 'he said "hi"'],
      ]);
    });

    it('tolera saltos LF y quita el BOM inicial', () => {
      const rows = parseCsv('﻿firstName\nAna\nLuis');
      expect(rows).toEqual([['firstName'], ['Ana'], ['Luis']]);
    });

    it('es reversible con toCsv (round-trip)', () => {
      const data = [
        ['firstName', 'company'],
        ['Ana "la jefa"', 'Acme, Inc'],
      ];
      expect(parseCsv(toCsv(data))).toEqual(data);
    });
  });
});
