const CONFIG = {
  // Plak hier de URL van je Apps Script web-app (zie HANDLEIDING.md).
  appsScriptUrl:
    'https://script.google.com/macros/s/AKfycbzV_kqbVf3z3AqKZaRxu6TrvGR37ey22tXOPVGhH_sDSL_BTwGZnIEpKMjvoRck9uTdcA/exec',

  // Voorbeeld-desserts: worden gebruikt zolang het tabblad "Desserts"
  // in je Google Sheet leeg is. Daarna wint de Sheet het.
  dessertsFallback: [
    { name: 'Chocolademuffin', price: 2.5 },
    { name: 'Frambozentaart', price: 3.0 },
    { name: 'Brownie', price: 2.0 },
    { name: 'Appelcake', price: 2.2 },
    { name: 'Bananasplit', price: 3.5 },
    { name: 'Wafel met slagroom', price: 2.8 },
  ],

  currency: 'EUR',
  refreshIntervalMs: 30000,
};
