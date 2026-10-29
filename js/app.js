(() => {
  const state = {
    desserts: [],
    sales: [],
    qty: {},
    lastSale: null,
    busy: false,
  };

  const el = {
    banner: document.getElementById('banner'),
    grid: document.getElementById('dessert-grid'),
    recent: document.getElementById('recent-list'),
    repeatBtn: document.getElementById('repeat-btn'),
    totTotal: document.getElementById('tot-total'),
    totCash: document.getElementById('tot-cash'),
    totBank: document.getElementById('tot-bank'),
  };

  function showBanner(message, kind) {
    el.banner.textContent = message;
    el.banner.className = 'banner ' + (kind || 'info');
    el.banner.classList.remove('hidden');
  }

  function hideBanner() {
    el.banner.classList.add('hidden');
  }

  async function refresh() {
    if (!Api.isConfigured()) {
      showBanner(
        'De site is nog niet gekoppeld aan Google Sheets. Plak de Apps Script URL in js/config.js (zie HANDLEIDING.md).',
        'warn'
      );
      state.desserts = CONFIG.dessertsFallback;
      state.sales = [];
      renderAll();
      return;
    }
    try {
      const data = await Api.getData();
      state.desserts =
        data.desserts && data.desserts.length
          ? data.desserts
          : CONFIG.dessertsFallback;
      state.sales = data.sales || [];
      hideBanner();
      renderAll();
    } catch (err) {
      showBanner(
        'Kon data niet laden (' + err.message + '). Controleer de URL en je internetverbinding.',
        'error'
      );
      renderAll();
    }
  }

  function renderAll() {
    renderTotals();
    renderGrid();
    renderRecent();
    renderRepeat();
  }

  function renderTotals() {
    const t = Utils.computeTotals(state.sales);
    el.totTotal.textContent = Utils.formatEuro(t.total);
    el.totCash.textContent = Utils.formatEuro(t.cash);
    el.totBank.textContent = Utils.formatEuro(t.bank);
  }

  function qtyFor(name) {
    if (!state.qty[name]) state.qty[name] = 1;
    return state.qty[name];
  }

  function renderGrid() {
    el.grid.innerHTML = '';
    for (const d of state.desserts) {
      const card = document.createElement('article');
      card.className = 'dessert-card';
      card.dataset.name = d.name;

      const title = document.createElement('h3');
      title.textContent = d.name;

      const price = document.createElement('p');
      price.className = 'price';
      price.textContent = Utils.formatEuro(d.price);

      const qtyRow = document.createElement('div');
      qtyRow.className = 'qty-row';

      const minus = document.createElement('button');
      minus.className = 'qty-btn';
      minus.dataset.action = 'minus';
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Minder');
      minus.textContent = '−';

      const qty = document.createElement('span');
      qty.className = 'qty';
      qty.dataset.action = 'qty';
      qty.textContent = String(qtyFor(d.name));

      const plus = document.createElement('button');
      plus.className = 'qty-btn';
      plus.dataset.action = 'plus';
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Meer');
      plus.textContent = '+';

      qtyRow.append(minus, qty, plus);

      const payRow = document.createElement('div');
      payRow.className = 'pay-row';

      const cash = document.createElement('button');
      cash.className = 'btn btn-cash';
      cash.type = 'button';
      cash.dataset.action = 'pay';
      cash.dataset.payment = 'cash';
      cash.textContent = 'Cash';

      const bank = document.createElement('button');
      bank.className = 'btn btn-bank';
      bank.type = 'button';
      bank.dataset.action = 'pay';
      bank.dataset.payment = 'bank';
      bank.textContent = 'Bank';

      payRow.append(cash, bank);
      card.append(title, price, qtyRow, payRow);
      el.grid.appendChild(card);
    }
  }

  function renderRecent() {
    el.recent.innerHTML = '';
    const recent = state.sales.slice(0, 12);
    if (!recent.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Nog geen verkoop genoteerd.';
      el.recent.appendChild(li);
      return;
    }
    for (const s of recent) {
      const li = document.createElement('li');

      const text = document.createElement('span');
      text.className = 'recent-text';
      text.textContent =
        s.qty + '× ' + s.dessert + ' — ' + Utils.formatEuro(s.total);

      const meta = document.createElement('span');
      meta.className = 'recent-meta';
      meta.textContent =
        Utils.paymentLabel(s.payment) + ' · ' + Utils.formatTime(s.timestamp);

      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.type = 'button';
      del.dataset.id = s.id;
      del.title = 'Verwijderen';
      del.setAttribute('aria-label', 'Verwijderen');
      del.textContent = '×';

      li.append(text, meta, del);
      el.recent.appendChild(li);
    }
  }

  function renderRepeat() {
    el.repeatBtn.disabled = !state.lastSale || state.busy;
    if (state.lastSale) {
      el.repeatBtn.textContent =
        'Nogmaals: ' +
        state.lastSale.qty +
        '× ' +
        state.lastSale.dessert +
        ' (' +
        Utils.paymentLabel(state.lastSale.payment) +
        ')';
    } else {
      el.repeatBtn.textContent = 'Nogmaals';
    }
  }

  function setBusy(busy) {
    state.busy = busy;
    document.body.classList.toggle('busy', busy);
    renderRepeat();
  }

  async function submitSale(dessert, qty, payment) {
    if (state.busy) return;
    setBusy(true);
    try {
      await Api.addSale({ dessert, qty, payment });
      state.lastSale = { dessert, qty, payment };
      state.qty[dessert] = 1;
      await refresh();
    } catch (err) {
      showBanner('Verkoop niet opgeslagen: ' + err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  el.grid.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || state.busy) return;
    const card = btn.closest('.dessert-card');
    if (!card) return;
    const name = card.dataset.name;
    const action = btn.dataset.action;

    if (action === 'minus') {
      state.qty[name] = Math.max(1, qtyFor(name) - 1);
      card.querySelector('[data-action="qty"]').textContent =
        String(state.qty[name]);
    } else if (action === 'plus') {
      state.qty[name] = Math.min(99, qtyFor(name) + 1);
      card.querySelector('[data-action="qty"]').textContent =
        String(state.qty[name]);
    } else if (action === 'pay') {
      submitSale(name, qtyFor(name), btn.dataset.payment);
    }
  });

  el.recent.addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn || state.busy) return;
    if (!confirm('Deze verkoop verwijderen?')) return;
    setBusy(true);
    try {
      await Api.deleteSale(btn.dataset.id);
      await refresh();
    } catch (err) {
      showBanner('Verwijderen mislukt: ' + err.message, 'error');
    } finally {
      setBusy(false);
    }
  });

  el.repeatBtn.addEventListener('click', () => {
    if (!state.lastSale) return;
    submitSale(
      state.lastSale.dessert,
      state.lastSale.qty,
      state.lastSale.payment
    );
  });

  refresh();
  setInterval(() => {
    if (!document.hidden && !state.busy) refresh();
  }, CONFIG.refreshIntervalMs);
})();
