// ============================================================
// Pátek třináctého – obsluha stránky (výpočet je ve friday13.js)
// ============================================================

// Kdo má v systému vypnuté animace, dostane výsledek rovnou
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Elementy
const els = {
  panelBirth: document.getElementById("panelBirth"),
  panelRange: document.getElementById("panelRange"),
  birthDate: document.getElementById("birthDate"),
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  resultCard: document.getElementById("resultCard"),
  resultNumber: document.getElementById("resultNumber"),
  resultLabel: document.getElementById("resultLabel"),
  resultDetail: document.getElementById("resultDetail"),
  shareBox: document.getElementById("shareBox"),
  downloadBtn: document.getElementById("downloadBtn"),
  copyTextBtn: document.getElementById("copyTextBtn"),
  shareX: document.getElementById("shareX"),
  shareFacebook: document.getElementById("shareFacebook"),
  shareStatus: document.getElementById("shareStatus"),
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
  const buttons = [...document.querySelectorAll(".mode-btn")];

  function selectMode(selected) {
    const mode = selected.dataset.mode;

    buttons.forEach((b) => {
      const isSelected = b === selected;
      b.classList.toggle("active", isSelected);
      b.setAttribute("aria-selected", isSelected ? "true" : "false");
      // Tabulátorem se dá dojít jen na aktivní záložku, mezi nimi se chodí šipkami
      b.tabIndex = isSelected ? 0 : -1;
    });

    els.panelBirth.classList.toggle("hidden", mode !== "birth");
    els.panelRange.classList.toggle("hidden", mode !== "range");

    hideResult();
    hideError();
  }

  buttons.forEach((btn, index) => {
    btn.addEventListener("click", () => selectMode(btn));

    btn.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const step = event.key === "ArrowRight" ? 1 : -1;
      const next = buttons[(index + step + buttons.length) % buttons.length];
      selectMode(next);
      next.focus();
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

// Připravená kartička ke sdílení: { text, file (Promise) }
let pendingShare = null;

async function handleDownload() {
  if (!pendingShare) return;
  els.shareStatus.textContent = await saveShareImage(await pendingShare.file);
}

async function handleCopyText() {
  if (!pendingShare) return;
  els.shareStatus.textContent = await copyShareText(pendingShare.text);
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

  // Sdílecí kartička jen pro „Můj život“. Kreslí se předem, aby kliknutí
  // rovnou otevřelo uložení (prohlížeče ho po delším čekání zablokují).
  els.shareStatus.textContent = "";
  els.shareBox.classList.toggle("hidden", mode !== "birth");
  if (mode === "birth") {
    const today = getTodayDate();
    const isFriday13Today = today.d === 13 && dayOfWeek(today.y, today.m, today.d) === 5;
    pendingShare = {
      text: shareText(data.count, isFriday13Today),
      file: createShareImage(data.count, isFriday13Today),
    };
    const links = shareLinks(pendingShare.text);
    els.shareX.href = links.x;
    els.shareFacebook.href = links.facebook;
  }

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

  if (target === 0 || prefersReducedMotion) {
    element.textContent = target;
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

  // Oba režimy počítají stejně: po kliknutí na tlačítko nebo po Enteru.
  // Schválně ne při každé změně pole – při psaní roku by se přepočítávalo po číslicích.
  els.panelBirth.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateBirth();
  });

  els.panelRange.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateRange();
  });

  els.downloadBtn.addEventListener("click", handleDownload);
  els.copyTextBtn.addEventListener("click", handleCopyText);
}

document.addEventListener("DOMContentLoaded", init);
