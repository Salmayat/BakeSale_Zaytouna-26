(() => {
  const state = {
    desserts: [],
    sales: [],
    busy: false,
  };

  const charts = { perDessert: null, payment: null, overTime: null };

  const el = {
    banner: document.getElementById('banner'),
    kpiTotal: document.getElementById('kpi-total'),
    kpiCash: document.getElementById('kpi-cash'),
    kpiBank: document.getElementById('kpi-bank'),
    kpiUnits: document.getElementById('kpi-units'),
    kpiTop: document.getElementById('kpi-top'),
    kpiBasmatie: document.getElementById('kpi-basmatie'),
    kpiPelicano: document.getElementById('kpi-pelicano'),
    tableBody: document.getElementById('sales-body'),
    refreshBtn: document.getElementById('refresh-btn'),
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
      render();
    } catch (err) {
      showBanner(
        'Kon data niet laden (' + err.message + '). Controleer de URL en je internetverbinding.',
        'error'
      );
    }
  }

  function render() {
    renderKpis();
    renderCharts();
    renderTable();
  }

  function renderKpis() {
    const t = Utils.computeTotals(state.sales);
    el.kpiTotal.textContent = Utils.formatEuro(t.total);
    el.kpiCash.textContent = Utils.formatEuro(t.cash);
    el.kpiBank.textContent = Utils.formatEuro(t.bank);
    el.kpiUnits.textContent = String(t.units);

    const byDessert = {};
    for (const s of state.sales) {
      byDessert[s.dessert] = (byDessert[s.dessert] || 0) + s.qty;
    }
    let top = '—';
    let topQty = 0;
    for (const [name, qty] of Object.entries(byDessert)) {
      if (qty > topQty) {
        topQty = qty;
        top = name + ' (' + qty + ')';
      }
    }
    el.kpiTop.textContent = top;

    const half = Math.round((t.total / 2) * 100) / 100;
    el.kpiBasmatie.textContent = Utils.formatEuro(half);
    el.kpiPelicano.textContent = Utils.formatEuro(half);
  }

  function dessertNames() {
    const names = new Set(state.desserts.map((d) => d.name));
    for (const s of state.sales) names.add(s.dessert);
    return Array.from(names);
  }

  function renderCharts() {
    const names = dessertNames();
    const revenueByName = names.map((name) => {
      let sum = 0;
      for (const s of state.sales) {
        if (s.dessert === name) sum += s.total || 0;
      }
      return Math.round(sum * 100) / 100;
    });

    charts.perDessert = upsert(charts.perDessert, 'chartDesserts', {
      type: 'bar',
      data: {
        labels: names,
        datasets: [
          {
            label: 'Opbrengst per dessert',
            data: revenueByName,
            backgroundColor: '#124724',
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });

    const t = Utils.computeTotals(state.sales);
    charts.payment = upsert(charts.payment, 'chartPayment', {
      type: 'doughnut',
      data: {
        labels: ['Cash', 'Bank'],
        datasets: [
          {
            data: [t.cash, t.bank],
            backgroundColor: ['#124724', '#dcc21e'],
          },
        ],
      },
      options: { plugins: { legend: { position: 'bottom' } } },
    });

    const byHour = {};
    const sorted = state.sales
      .slice()
      .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
    let cumulative = 0;
    const labels = [];
    const values = [];
    for (const s of sorted) {
      const d = new Date(s.timestamp);
      if (isNaN(d)) continue;
      const key =
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0') +
        ' ' +
        String(d.getHours()).padStart(2, '0') +
        ':00';
      byHour[key] = (byHour[key] || 0) + (s.total || 0);
    }
    for (const [key, val] of Object.entries(byHour)) {
      cumulative += val;
      labels.push(key.split(' ')[1] + 'u');
      values.push(Math.round(cumulative * 100) / 100);
    }

    charts.overTime = upsert(charts.overTime, 'chartTime', {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Cumulatieve opbrengst',
            data: values,
            borderColor: '#124724',
            backgroundColor: 'rgba(18, 71, 36, 0.15)',
            fill: true,
            tension: 0.25,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  function upsert(chart, canvasId, config) {
    if (chart) {
      chart.data = config.data;
      chart.update();
      return chart;
    }
    const canvas = document.getElementById(canvasId);
    return new Chart(canvas, config);
  }

  function renderTable() {
    el.tableBody.innerHTML = '';
    if (!state.sales.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'empty';
      td.textContent = 'Nog geen verkoop genoteerd.';
      tr.appendChild(td);
      el.tableBody.appendChild(tr);
      return;
    }
    for (const s of state.sales) {
      const tr = document.createElement('tr');

      const tdTime = document.createElement('td');
      tdTime.textContent = Utils.formatTime(s.timestamp);

      const tdDessert = document.createElement('td');
      tdDessert.textContent = s.dessert;

      const tdQty = document.createElement('td');
      tdQty.textContent = String(s.qty);

      const tdPayment = document.createElement('td');
      tdPayment.textContent = Utils.paymentLabel(s.payment);

      const tdTotal = document.createElement('td');
      tdTotal.textContent = Utils.formatEuro(s.total);

      const tdDel = document.createElement('td');
      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.type = 'button';
      del.dataset.id = s.id;
      del.title = 'Verwijderen';
      del.setAttribute('aria-label', 'Verwijderen');
      del.textContent = '×';
      tdDel.appendChild(del);

      tr.append(tdTime, tdDessert, tdQty, tdPayment, tdTotal, tdDel);
      el.tableBody.appendChild(tr);
    }
  }

  el.tableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn || state.busy) return;
    if (!confirm('Deze verkoop verwijderen?')) return;
    state.busy = true;
    try {
      await Api.deleteSale(btn.dataset.id);
      await refresh();
    } catch (err) {
      showBanner('Verwijderen mislukt: ' + err.message, 'error');
    } finally {
      state.busy = false;
    }
  });

  el.refreshBtn.addEventListener('click', () => {
    if (!state.busy) refresh();
  });

  refresh();
  setInterval(() => {
    if (!document.hidden && !state.busy) refresh();
  }, CONFIG.refreshIntervalMs);
})();
