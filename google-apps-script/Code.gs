/**
 * Backend voor de dessert-verkoop site.
 *
 * Plak deze volledige code in:
 *   Google Sheet → Extensies → Apps Script
 * en deploy daarna als web-app (zie HANDLEIDING.md).
 */

var SHEET_VERKOOP = 'Verkoop';
var SHEET_DESSERTS = 'Desserts';

var VOORBEELD_DESSERTS = [
  ['Chocolademuffin', 2.5],
  ['Frambozentaart', 3.0],
  ['Brownie', 2.0],
  ['Appelcake', 2.2],
  ['Bananasplit', 3.5],
  ['Wafel met slagroom', 2.8],
];

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'data';
    if (action === 'data') {
      return json_({ desserts: leesDesserts_(), sales: leesVerkoop_() });
    }
    return json_({ error: 'Onbekende actie: ' + action });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var body = {};
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return json_({ error: 'Ongeldige JSON' });
    }
    if (body.action === 'addSale') {
      return json_({ ok: true, sale: voegVerkoopToe_(body) });
    }
    if (body.action === 'deleteSale') {
      return json_({ ok: true, deleted: verwijderVerkoop_(body.id) });
    }
    return json_({ error: 'Onbekende actie: ' + body.action });
  } catch (err) {
    return json_({ error: String(err) });
  } finally {
    try {
      lock.releaseLock();
    } catch (lockErr) {}
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function verkoopSheet_() {
  var sheet = ss_().getSheetByName(SHEET_VERKOOP);
  if (!sheet) {
    sheet = ss_().insertSheet(SHEET_VERKOOP);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'timestamp', 'dessert', 'aantal', 'betaaltype', 'prijs', 'totaal']);
  }
  return sheet;
}

function dessertsSheet_() {
  var sheet = ss_().getSheetByName(SHEET_DESSERTS);
  if (!sheet) {
    sheet = ss_().insertSheet(SHEET_DESSERTS);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['naam', 'prijs']);
    for (var i = 0; i < VOORBEELD_DESSERTS.length; i++) {
      sheet.appendRow(VOORBEELD_DESSERTS[i]);
    }
  }
  return sheet;
}

function leesDesserts_() {
  var sheet = dessertsSheet_();
  var values = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var naam = String(values[i][0]).trim();
    var prijs = Number(values[i][1]);
    if (naam && !isNaN(prijs)) {
      out.push({ name: naam, price: prijs });
    }
  }
  return out;
}

function leesVerkoop_() {
  var sheet = verkoopSheet_();
  if (sheet.getLastRow() < 2) {
    return [];
  }
  var values = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    var ts = row[1];
    out.push({
      id: String(row[0]),
      timestamp: ts instanceof Date ? ts.toISOString() : String(ts),
      dessert: String(row[2]),
      qty: Number(row[3]),
      payment: String(row[4]),
      price: Number(row[5]),
      total: Number(row[6]),
    });
  }
  out.sort(function (a, b) {
    return a.timestamp < b.timestamp ? 1 : -1;
  });
  return out;
}

function prijsVoor_(naam) {
  var desserts = leesDesserts_();
  for (var i = 0; i < desserts.length; i++) {
    if (desserts[i].name === naam) {
      return desserts[i].price;
    }
  }
  return null;
}

function voegVerkoopToe_(body) {
  var naam = String(body.dessert || '').trim();
  var qty = parseInt(body.qty, 10);
  var payment = String(body.payment || '').toLowerCase();
  if (!naam) throw new Error('Geen dessert opgegeven');
  if (!qty || qty < 1) throw new Error('Ongeldig aantal');
  if (payment !== 'cash' && payment !== 'bank') {
    throw new Error('Ongeldig betaaltype');
  }
  var prijs = prijsVoor_(naam);
  if (prijs === null) throw new Error('Onbekend dessert: ' + naam);
  var totaal = Math.round(prijs * qty * 100) / 100;
  var id = Utilities.getUuid();
  var timestamp = new Date();
  verkoopSheet_().appendRow([
    id,
    Utilities.formatDate(
      timestamp,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd'T'HH:mm:ss"
    ),
    naam,
    qty,
    payment,
    prijs,
    totaal,
  ]);
  return {
    id: id,
    timestamp: timestamp.toISOString(),
    dessert: naam,
    qty: qty,
    payment: payment,
    price: prijs,
    total: totaal,
  };
}

function verwijderVerkoop_(id) {
  id = String(id || '');
  if (!id) throw new Error('Geen id opgegeven');
  var sheet = verkoopSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var ids = sheet.getRange(1, 1, lastRow, 1).getValues();
  for (var i = ids.length - 1; i >= 1; i--) {
    if (String(ids[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}
