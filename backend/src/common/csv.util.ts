/**
 * Utilidades CSV mínimas y sin dependencias, conformes a RFC 4180 en lo
 * esencial: campos entrecomillados, comas y saltos de línea dentro de comillas,
 * y comillas escapadas como "".
 */

/** Escapa un valor para CSV (entrecomilla si contiene coma, comilla o salto). */
function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serializa filas (incluida la cabecera) a texto CSV con CRLF. */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeField).join(',')).join('\r\n');
}

/**
 * Parsea texto CSV en una matriz de filas. Tolera CRLF/LF, campos
 * entrecomillados y comillas escapadas. Ignora una fila final vacía.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  // Quita BOM inicial si el archivo viene de Excel.
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
    } else if (char === '\r') {
      // Se ignora; el \n siguiente cierra la fila.
    } else {
      field += char;
    }
  }

  // Último campo/fila si el texto no termina en salto de línea.
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
