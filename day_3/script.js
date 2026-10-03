// Starting data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

const originalNotes = notes;
const VALID_CATEGORIES = ["personal", "work", "study"];

// normalizeText
function normalizeText(text) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

// searchNotes
function searchNotes(word) {
  const search = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(search));
}

console.log(searchNotes("MILK"));
console.log(searchNotes("the"));
console.log(searchNotes("zebra"));

// longestNote
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];
  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }
  return longest;
}

console.log(longestNote());
notes = [];
console.log(longestNote());
notes = originalNotes;

// countByCategory
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    if (counts[note.category] === undefined) {
      counts[note.category] = 1;
    } else {
      counts[note.category]++;
    }
  }
  return counts;
}

console.log(countByCategory());
notes = [];
console.log(countByCategory());
notes = originalNotes;

// getSummary
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const noun = total === 1 ? "note" : "notes";

  const personal = counts.personal || 0;
  const work = counts.work || 0;
  const study = counts.study || 0;

  return `${total} ${noun}: ${personal} personal, ${work} work, ${study} study.`;
}

console.log(getSummary());
notes = [originalNotes[0]];
console.log(getSummary());
notes = originalNotes;

// isDuplicate
function isDuplicate(text) {
  const wanted = normalizeText(text);
  return notes.some((note) => normalizeText(note.text) === wanted);
}

console.log(isDuplicate("  BUY   milk and BREAD "));
console.log(isDuplicate("Walk the dog"));

// addNote
function addNote(text, category) {
  if (typeof text !== "string") {
    console.log("Not added: text must be a string.");
    return false;
  }

  const cleanText = text.trim();

  if (cleanText.length < 1 || cleanText.length > 200) {
    console.log("Not added: text must be 1-200 characters.");
    return false;
  }

  if (isDuplicate(cleanText)) {
    console.log("Not added: this note already exists.");
    return false;
  }

  if (!VALID_CATEGORIES.includes(category)) {
    console.log("Not added: category must be personal, work or study.");
    return false;
  }

  let newId = 1;
  for (const note of notes) {
    if (note.id >= newId) {
      newId = note.id + 1;
    }
  }

  notes.push({ id: newId, text: cleanText, category: category });
  return true;
}

console.log(addNote("Walk the dog", "personal"));
console.log(addNote("buy milk and BREAD", "personal"));
console.log(addNote("", "work"));
console.log(addNote("x".repeat(201), "work"));
console.log(addNote("Plan the meeting", "hobby"));
console.log(addNote("y".repeat(200), "study"));
console.log(getSummary());