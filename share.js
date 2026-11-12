// ============================================================
// Pátek třináctého – sdílecí kartička
// ============================================================
// Z výsledku nakreslí čtvercový obrázek a nabídne ho ke sdílení.
// Na mobilu přes systémové sdílení, na počítači stažením + zkopírováním textu.

const SHARE_URL = "https://patek13.inspiruj.se/";
const SHARE_QUESTION = "Kolik jste jich přežili vy?";

// Věta na kartičce se liší podle toho, jestli je pátek třináctého právě dnes.
// Vrací tři části, aby šlo číslo vysadit velkým písmem.
function shareSentenceParts(count, isFriday13Today) {
  if (isFriday13Today) {
    return { before: "Dneska je můj", number: `${count}.`, after: "pátek třináctého." };
  }
  return { before: "Mám za sebou", number: String(count), after: `${sklonovaniPatku(count)}.` };
}

function shareText(count, isFriday13Today) {
  const { before, number, after } = shareSentenceParts(count, isFriday13Today);
  return `${before} ${number} ${after} ${SHARE_QUESTION}`;
}

// Nakreslí kartičku 1080 × 1080 a vrátí ji jako PNG soubor
async function createShareImage(count, isFriday13Today) {
  const size = 1080;
  const center = size / 2;
  const font = (weight, px) => `${weight} ${px}px "DM Sans", system-ui, sans-serif`;

  // Canvas neumí počkat na webfont sám – bez toho by první kartička byla v náhradním písmu
  try {
    await Promise.all([document.fonts.load(font(900, 100)), document.fonts.load(font(700, 100)), document.fonts.load(font(500, 100))]);
  } catch {
    // Když se písmo nenačte, nakreslí se systémovým
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const { before, number, after } = shareSentenceParts(count, isFriday13Today);

  // Pozadí s červenou září za číslem
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, size, size);
  const glow = ctx.createRadialGradient(center, 500, 0, center, 500, 520);
  glow.addColorStop(0, "rgba(239, 68, 68, 0.28)");
  glow.addColorStop(1, "rgba(239, 68, 68, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#fafafa";
  ctx.font = font(700, 72);
  ctx.fillText(before, center, 250);

  // Číslo zmenšit, kdyby se nevešlo na šířku (čtyřciferné výsledky)
  let numberSize = 380;
  ctx.font = font(900, numberSize);
  const maxWidth = size - 160;
  const measured = ctx.measureText(number).width;
  if (measured > maxWidth) {
    numberSize = Math.floor((numberSize * maxWidth) / measured);
    ctx.font = font(900, numberSize);
  }
  ctx.fillStyle = "#ef4444";
  ctx.fillText(number, center, 500 + numberSize * 0.36);

  ctx.fillStyle = "#fafafa";
  ctx.font = font(700, 72);
  ctx.fillText(after, center, 770);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = font(500, 46);
  ctx.fillText(SHARE_QUESTION, center, 880);

  ctx.fillStyle = "#ef4444";
  ctx.font = font(700, 38);
  ctx.fillText("patek13.inspiruj.se", center, 1000);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return new File([blob], "patek-trinacteho.png", { type: "image/png" });
}

// Sdílení: vrací krátkou zprávu pro uživatele (nebo prázdný text, když není co hlásit)
async function shareResult(file, text) {
  // Mobil: systémový dialog sdílení včetně obrázku
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: `${text} ${SHARE_URL}` });
      return "";
    } catch (error) {
      // Zavření dialogu není chyba; cokoli jiného zkusíme vyřešit stažením
      if (error.name === "AbortError") return "";
    }
  }

  // Počítač: obrázek stáhnout a text s odkazem dát do schránky
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(link.href);

  try {
    await navigator.clipboard.writeText(`${text} ${SHARE_URL}`);
    return "Obrázek je stažený a text s odkazem ve schránce.";
  } catch {
    return "Obrázek je stažený.";
  }
}
