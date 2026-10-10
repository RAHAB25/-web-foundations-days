function updateCounts() {
    const textArea = document.getElementById("text-area");
    const wordCount = document.getElementById("wordcount");
    const text = textArea.value.trim();
    const words = text === "" ? 0 : text.split(/\s+/).length;
    wordCount.textContent = words;
}

// ---------- Select elements ----------
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

const MAX_CHARS = 200;
const WARNING_AT = 180;

// ---------- Update counters and warning classes ----------
function updateCounts() {
  const text = noteText.value;
  const chars = text.length;

  // Words: trim spaces, then split on whitespace. Empty text = 0 words.
  const trimmed = text.trim();
  const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;

  charCount.textContent = chars + " / " + MAX_CHARS + " characters";
  wordCount.textContent = words + " words";

  // Remove both classes first, then add the right one
  charCount.classList.remove("warning", "over");
  if (chars > MAX_CHARS) {
    charCount.classList.add("over");
  } else if (chars > WARNING_AT) {
    charCount.classList.add("warning");
  }
}

// ---------- Clear everything ----------
function clearNote() {
  noteText.value = "";
  localStorage.removeItem("draft");
  updateCounts();
}

// ---------- Theme ----------
function applyTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  // The label shows the mode you will switch TO
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

// ---------- 1. On every input: update counts and save draft ----------
noteText.addEventListener("input", function () {
  updateCounts();
  localStorage.setItem("draft", noteText.value);
});

// ---------- 3. Clear button and Escape key ----------
clearBtn.addEventListener("click", clearNote);

noteText.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    clearNote();
  }
});

// ---------- 4. Theme button ----------
themeToggle.addEventListener("click", function () {
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// ---------- 2. On page load: restore draft and theme ----------
const savedDraft = localStorage.getItem("draft");
if (savedDraft !== null) {
  noteText.value = savedDraft;
}

applyTheme(localStorage.getItem("theme") === "dark");
updateCounts();