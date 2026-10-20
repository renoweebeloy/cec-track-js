// Google Apps Script - sending ang reset email
const SECRET = "same-secret-as-in-Vercel";  // parehas sa APPS_SCRIPT_SECRET

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.secret !== SECRET) return ContentService.createTextOutput("forbidden");
  MailApp.sendEmail({ to: d.to, subject: d.subject, body: d.body, name: "CEC-TRACK" });
  return ContentService.createTextOutput("ok");
}
