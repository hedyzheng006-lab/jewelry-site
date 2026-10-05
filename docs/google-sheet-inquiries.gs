// Google Apps Script for the custom design form.
// Paste into Extensions > Apps Script of the Google Sheet that should collect requests,
// set SECRET to the same value as INQUIRY_WEBHOOK_SECRET in Vercel, then deploy as a web app.

const SECRET = "PUT-YOUR-SECRET-HERE";

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.secret !== SECRET) return reply({ ok: false });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Submitted at", "Idea", "Budget", "Email", "Phone"]);
  }
  sheet.appendRow([new Date(), safe(data.idea), safe(data.budget), safe(data.email), safe(data.phone)]);
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
