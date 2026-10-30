const CONFIG = {
  // Plak hier de URL van je Apps Script web-app (zie HANDLEIDING.md).
  appsScriptUrl:
    'https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRMwWO--5uJcG1eoJhgo1rgFupxyALuIXUuHVWExfq0j1lh58xJ09HQNqG37t-_H4QLDMGGOXK-L3P1IOYFPh_2foVoRqC43VdirA5t9PFJrB9szgDlu1p7o_gVH5O5-DxHaqj5i9f9DhGIPzmG2pntNj_-HWdKNFj7JEtC5DsQ895Ec9xijXTXkipijc1AdcUg-EQ3tP_iYaXzUUXFTGf0RW0mx46Q0WmA1nfVWguG8CjD5POIWIJjU3bhsdaB1dtJgAZuiGNXn40hWDJajTmOs3pPSg&lib=M6yQaAXsv1CbwBBIEGq3P6vML9qzVz1Nl',

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
