const Api = (() => {
  function isConfigured() {
    return (
      typeof CONFIG !== 'undefined' &&
      CONFIG.appsScriptUrl &&
      !CONFIG.appsScriptUrl.startsWith('PLAK_HIER')
    );
  }

  async function getData() {
    const url =
      CONFIG.appsScriptUrl +
      '?action=data&ts=' +
      Date.now();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  async function post(body) {
    const res = await fetch(CONFIG.appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  function addSale({ dessert, qty, payment }) {
    return post({ action: 'addSale', dessert, qty, payment });
  }

  function deleteSale(id) {
    return post({ action: 'deleteSale', id });
  }

  return { isConfigured, getData, addSale, deleteSale };
})();

const Utils = {
  formatEuro(value) {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: CONFIG.currency || 'EUR',
    }).format(value || 0);
  },

  formatTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString('nl-BE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  paymentLabel(payment) {
    return payment === 'bank' ? 'Bank' : 'Cash';
  },

  computeTotals(sales) {
    const totals = { total: 0, cash: 0, bank: 0, count: 0, units: 0 };
    for (const s of sales) {
      totals.total += s.total || 0;
      totals.count += 1;
      totals.units += s.qty || 0;
      if (s.payment === 'bank') totals.bank += s.total || 0;
      else totals.cash += s.total || 0;
    }
    totals.total = Math.round(totals.total * 100) / 100;
    totals.cash = Math.round(totals.cash * 100) / 100;
    totals.bank = Math.round(totals.bank * 100) / 100;
    return totals;
  },
};
