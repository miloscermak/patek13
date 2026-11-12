// Test výpočtu – spouští se ručně: node test.js
// Na stránce se nenačítá, aby neběžel u každého návštěvníka.

const assert = require("node:assert");
const { parseISODate, countFriday13, dayOfWeek } = require("./friday13.js");

function count(from, to) {
  return countFriday13(parseISODate(from), parseISODate(to)).count;
}

// Známé případy
assert.strictEqual(count("1968-08-01", "2026-03-12"), 100);
assert.strictEqual(count("2024-09-13", "2024-09-13"), 1); // krajní data se počítají
assert.strictEqual(count("2024-09-14", "2024-12-12"), 0);
assert.strictEqual(count("2026-01-01", "2026-12-31"), 3); // únor, březen, listopad

// Obrácené pořadí dá stejný výsledek
assert.strictEqual(count("2026-03-12", "1968-08-01"), 100);

// Den v týdnu
assert.strictEqual(dayOfWeek(2026, 11, 13), 5); // pátek
assert.strictEqual(dayOfWeek(2000, 1, 1), 6); // sobota

// Neplatná data
assert.strictEqual(parseISODate("2023-02-29"), null);
assert.deepStrictEqual(parseISODate("2024-02-29"), { y: 2024, m: 2, d: 29 });
assert.strictEqual(parseISODate(""), null);

console.log("Všechny testy prošly.");
