/** Minimal, dependency-free CSV serializer (handles quoting/escaping). */
function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows, columns) {
  const header = columns.map((c) => c.label).join(',');
  const lines = rows.map((row) => columns.map((c) => toCsvValue(row[c.key])).join(','));
  return [header, ...lines].join('\n');
}

module.exports = { rowsToCsv };
