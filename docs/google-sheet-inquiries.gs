// Google Apps Script for the site's forms (custom design requests and gift cards).
// Paste into Extensions > Apps Script of the Google Sheet that should collect them,
// set SECRET to the same value as INQUIRY_WEBHOOK_SECRET in Vercel, then deploy as a web app.

const SECRET = "PUT-YOUR-SECRET-HERE";

const TABS = {
  "custom-request": { name: "Custom requests", columns: ["idea", "budget", "email", "phone"], headers: ["Idea", "Budget", "Email", "Phone"] },
  "gift-card": { name: "Gift cards", columns: ["orderNumber", "recipient", "occasion", "message"], headers: ["Order number", "Who it's for", "Occasion", "Card message"] },
};

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.secret !== SECRET) return reply({ ok: false });

  const tab = TABS[data.type] || TABS["custom-request"];
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(tab.name) || book.insertSheet(tab.name);
  if (sheet.getLastRow() === 0) sheet.appendRow(["Submitted at"].concat(tab.headers));
  sheet.appendRow([new Date()].concat(tab.columns.map((key) => safe(data[key]))));
  return reply({ ok: true });
}

// Store text as plain text, so input like "=..." is never run as a formula.
function safe(value) {
  const text = String(value || "");
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
