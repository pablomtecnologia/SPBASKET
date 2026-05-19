function parseDate(s) {
  if (!s || typeof s !== 'string' || !s.includes('/')) return null
  const [d, m, y] = s.trim().split('/').map(Number)
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null
  return new Date(y, m - 1, d)
}

function validatePlayerAge(birthDateStr, fromStr, toStr, isVeteran) {
  if (!birthDateStr || !fromStr) return { ok: true }
  const b = parseDate(birthDateStr)
  const f = parseDate(fromStr)
  const t = toStr ? parseDate(toStr) : null
  if (!b || !f) return { ok: true }

  if (isVeteran) {
    if (b > f) return { ok: false, error: 'Demasiado joven' }
  } else {
    if (b < f) return { ok: false, error: 'Demasiado mayor' }
    if (t && b > t) return { ok: true, warning: 'Aviso: Categoría superior' }
  }
  return { ok: true }
}

// Test case: Player born in 2013, Category 2010-2012
const res = validatePlayerAge("01/01/2013", "01/01/2010", "31/12/2012", false);
console.log('Resultado 2013 en 2010-2012:', res);

// Test case from DB: FELIX (2016) in CADETE (2014-2026) -> Should be inside
const res2 = validatePlayerAge("01/10/2016", "01/01/2014", "31/12/2026", false);
console.log('Resultado FELIX (2016) en CADETE (2014-2026):', res2);

// Test case: Player born in 2009 in JUNIOR (2008-2008)
const res3 = validatePlayerAge("01/01/2009", "01/01/2008", "31/12/2008", false);
console.log('Resultado 2009 en JUNIOR (2008):', res3);
