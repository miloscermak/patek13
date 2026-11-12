// ============================================================
// Pátek třináctého – výpočet (bez závislosti na stránce)
// ============================================================
// Datum je všude obyčejný objekt { y, m, d }, aby výsledek
// nezávisel na časové zóně ani na objektu Date.

function isLeapYear(year) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function daysInMonth(year, month) {
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1];
}

function parseISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  const dim = daysInMonth(y, m);
  if (d < 1 || d > dim) return null;
  return { y, m, d };
}

function compareDates(a, b) {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

function nextMonth(date) {
  if (date.m === 12) return { y: date.y + 1, m: 1 };
  return { y: date.y, m: date.m + 1 };
}

// Sakamotův vzorec: 0 = neděle, 1 = pondělí, ..., 5 = pátek, 6 = sobota
function dayOfWeek(year, month, day) {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  let y = year;
  if (month < 3) y -= 1;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[month - 1] + day) % 7;
}

function formatDateCZ(date) {
  return `${date.d}. ${date.m}. ${date.y}`;
}

// Hlavní výpočet – projde všechny měsíce v rozmezí a najde pátky 13.
// Obě krajní data se počítají včetně; obrácené pořadí se samo prohodí.
function countFriday13(from, to) {
  let normalizedFrom = from;
  let normalizedTo = to;
  let swapped = false;

  if (compareDates(normalizedFrom, normalizedTo) > 0) {
    [normalizedFrom, normalizedTo] = [normalizedTo, normalizedFrom];
    swapped = true;
  }

  let y = normalizedFrom.y;
  let m = normalizedFrom.m;
  let count = 0;
  const hits = [];

  while (y < normalizedTo.y || (y === normalizedTo.y && m <= normalizedTo.m)) {
    const candidate = { y, m, d: 13 };

    if (
      compareDates(candidate, normalizedFrom) >= 0 &&
      compareDates(candidate, normalizedTo) <= 0 &&
      dayOfWeek(y, m, 13) === 5
    ) {
      count += 1;
      hits.push(candidate);
    }

    ({ y, m } = nextMonth({ y, m }));
  }

  return { count, hits, normalizedFrom, normalizedTo, swapped };
}

// Export jen pro test v Node (node test.js); v prohlížeči jsou funkce globální
if (typeof module !== "undefined") {
  module.exports = { parseISODate, countFriday13, dayOfWeek, formatDateCZ };
}
