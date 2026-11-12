// ============================================================
// Pátek třináctého – hlavní aplikační logika
// ============================================================

// === Algoritmus (převzatý z patek_trinacteho_app.html) ===

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

// === Self-test ===

(function selfTest() {
  const test1 = countFriday13(parseISODate("1968-08-01"), parseISODate("2026-03-12"));
  const test2 = countFriday13(parseISODate("2024-09-13"), parseISODate("2024-09-13"));
  const test3 = countFriday13(parseISODate("2024-09-14"), parseISODate("2024-12-12"));

  if (test1.count !== 100 || test2.count !== 1 || test3.count !== 0) {
    console.error("Self-test selhal!", { test1, test2, test3 });
  }
})();

// === UI logika ===

let currentMode = "birth";

// Elementy
const els = {
  panelBirth: document.getElementById("panelBirth"),
  panelRange: document.getElementById("panelRange"),
  birthDate: document.getElementById("birthDate"),
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  calcBirth: document.getElementById("calcBirth"),
  calcRange: document.getElementById("calcRange"),
  resultCard: document.getElementById("resultCard"),
  resultNumber: document.getElementById("resultNumber"),
  resultLabel: document.getElementById("resultLabel"),
  resultDetail: document.getElementById("resultDetail"),
  dateList: document.getElementById("dateList"),
  dateListWrapper: document.getElementById("dateListWrapper"),
  errorBox: document.getElementById("errorBox"),
};

// Dnešní datum jako objekt
function getTodayDate() {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

// Dnešní datum jako ISO string (formát, který čeká <input type="date">)
function getTodayISO() {
  const { y, m, d } = getTodayDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// České skloňování: 1 pátek / 2-4 pátky / 0, 5+ pátků
function sklonovaniPatku(count) {
  if (count === 1) return "pátek třináctého";
  if (count >= 2 && count <= 4) return "pátky třináctého";
  return "pátků třináctého";
}

// Přepínání režimů
function setupModeSwitch() {
  const buttons = document.querySelectorAll(".mode-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentMode = btn.dataset.mode;

      buttons.forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });

      els.panelBirth.classList.toggle("hidden", currentMode !== "birth");
      els.panelRange.classList.toggle("hidden", currentMode !== "range");

      hideResult();
      hideError();
    });
  });
}

// Výpočet v režimu "Můj život"
function calculateBirth() {
  hideError();

  const birthValue = els.birthDate.value;
  const birth = parseISODate(birthValue);

  if (!birth) {
    showError("Zadejte prosím platné datum narození.");
    return;
  }

  const today = getTodayDate();

  if (compareDates(birth, today) > 0) {
    showError("Datum narození nemůže být v budoucnosti.");
    return;
  }

  const result = countFriday13(birth, today);
  showResult(result, "birth");
}

// Výpočet v režimu "Vlastní rozmezí"
function calculateRange() {
  hideError();

  const fromValue = els.fromDate.value;
  const toValue = els.toDate.value;
  const from = parseISODate(fromValue);
  const to = parseISODate(toValue);

  if (!from || !to) {
    showError("Zadejte prosím dvě platná data.");
    return;
  }

  const result = countFriday13(from, to);
  showResult(result, "range");
}

// Zobrazení výsledku s animací
function showResult(data, mode) {
  // Animace čísla od 0 nahoru
  animateNumber(els.resultNumber, data.count);

  // Popisek
  els.resultLabel.textContent = sklonovaniPatku(data.count);

  // Detail pod popiskem
  if (mode === "birth") {
    els.resultDetail.textContent = `Od ${formatDateCZ(data.normalizedFrom)} do dnes`;
  } else {
    let text = `Od ${formatDateCZ(data.normalizedFrom)} do ${formatDateCZ(data.normalizedTo)}`;
    if (data.swapped) text += " (data byla prohozena)";
    els.resultDetail.textContent = text;
  }

  // Seznam dat
  els.dateList.innerHTML = data.hits
    .map((date) => `<li>${formatDateCZ(date)}</li>`)
    .join("");

  // Zavřít details při novém výpočtu; bez nálezů není co rozbalovat
  els.dateListWrapper.open = false;
  els.dateListWrapper.classList.toggle("hidden", data.count === 0);

  // Zobrazit kartu s animací (re-trigger)
  els.resultCard.classList.remove("hidden");
  els.resultCard.style.animation = "none";
  els.resultCard.offsetHeight; // reflow
  els.resultCard.style.animation = "";
}

// CountUp animace čísla
let numberAnimationId = null;

function animateNumber(element, target) {
  // Zrušit rozběhnutou animaci, jinak by přepsala nový výsledek starým číslem
  cancelAnimationFrame(numberAnimationId);

  if (target === 0) {
    element.textContent = "0";
    return;
  }

  const duration = 800;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out kubická křivka
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(eased * target);

    if (progress < 1) {
      numberAnimationId = requestAnimationFrame(update);
    }
  }

  numberAnimationId = requestAnimationFrame(update);
}

// Chybové stavy
function showError(message) {
  els.errorBox.textContent = message;
  els.errorBox.classList.remove("hidden");
  hideResult();
}

function hideError() {
  els.errorBox.classList.add("hidden");
}

function hideResult() {
  els.resultCard.classList.add("hidden");
}

// === Inicializace ===

function init() {
  setupModeSwitch();

  // Max datum na dnes (nelze zadat budoucnost)
  const today = getTodayISO();
  els.birthDate.max = today;
  els.toDate.value = today;

  // Event listenery
  els.calcBirth.addEventListener("click", calculateBirth);
  els.birthDate.addEventListener("change", calculateBirth);

  els.calcRange.addEventListener("click", calculateRange);
}

document.addEventListener("DOMContentLoaded", init);
