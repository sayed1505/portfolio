/**
 * FinTrack — Student Finance Manager
 * script.js
 *
 * Features:
 *  - Dashboard with summary cards + Chart.js charts
 *  - Income & Expense trackers with local storage
 *  - Transaction history with search + filter
 *  - Budget insights with progress bars & alerts
 *  - Dark mode toggle
 *  - Toast notifications
 */

/* ─────────────────────────────────────────────────────────────
   1. APP STATE
───────────────────────────────────────────────────────────── */
let transactions = JSON.parse(localStorage.getItem('fintrack_transactions')) || [];
let darkMode      = JSON.parse(localStorage.getItem('fintrack_dark'))        || false;

// Chart.js instances (kept in module scope so we can destroy & recreate)
let pieChartInst = null;
let barChartInst = null;

/* Emoji map for expense categories */
const CATEGORY_EMOJI = {
  Food: '🍔', Transport: '🚌', Books: '📚',
  Entertainment: '🎮', Health: '💊', Clothing: '👕',
  Utilities: '💡', Other: '📦',
};

/* ─────────────────────────────────────────────────────────────
   2. UTILITY HELPERS
───────────────────────────────────────────────────────────── */

/** Save transactions to localStorage */
function saveData() {
  localStorage.setItem('fintrack_transactions', JSON.stringify(transactions));
}

/** Format a number as Indian Rupees */
function fmt(num) {
  return '₹' + Math.abs(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Generate a short unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Format a date string (YYYY-MM-DD) to a human-readable form */
function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Show a brief toast message */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/** Get today's date in YYYY-MM-DD format */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ─────────────────────────────────────────────────────────────
   3. SUMMARY CALCULATIONS
───────────────────────────────────────────────────────────── */

function calcTotals() {
  const income   = transactions.filter(t => t.type === 'income')
                               .reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense')
                               .reduce((s, t) => s + t.amount, 0);
  return { income, expenses, balance: income - expenses };
}

/* ─────────────────────────────────────────────────────────────
   4. DASHBOARD RENDERING
───────────────────────────────────────────────────────────── */

function renderDashboard() {
  const { income, expenses, balance } = calcTotals();

  document.getElementById('totalIncome').textContent    = fmt(income);
  document.getElementById('totalExpenses').textContent  = fmt(expenses);
  document.getElementById('currentBalance').textContent = fmt(balance);

  // Colour balance card value based on sign
  const balEl = document.getElementById('currentBalance');
  balEl.style.color = balance >= 0
    ? 'var(--blue)'
    : 'var(--red)';

  renderPieChart();
  renderBarChart();
}

function renderPieChart() {
  const canvas  = document.getElementById('pieChart');
  const emptyEl = document.getElementById('pieEmpty');

  // Build category totals
  const catTotals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(catTotals);
  const data   = Object.values(catTotals);

  if (!labels.length) {
    emptyEl.style.display = 'block';
    canvas.style.display  = 'none';
    if (pieChartInst) { pieChartInst.destroy(); pieChartInst = null; }
    return;
  }

  emptyEl.style.display = 'none';
  canvas.style.display  = 'block';

  const COLORS = ['#4a90d9','#5cb88a','#e07070','#f0b429','#9b8adb','#f09050','#50c8c8','#d97ab8'];

  if (pieChartInst) pieChartInst.destroy();
  pieChartInst = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: COLORS.slice(0, labels.length),
        borderWidth: 2,
        borderColor: getComputedStyle(document.body).getPropertyValue('--surface').trim(),
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getComputedStyle(document.body).getPropertyValue('--text-2').trim(),
            padding: 12,
            font: { size: 12 },
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${fmt(ctx.raw)} (${Math.round(ctx.parsed / ctx.dataset.data.reduce((a,b)=>a+b,0)*100)}%)`
          }
        }
      }
    }
  });
}

function renderBarChart() {
  const canvas  = document.getElementById('barChart');
  const emptyEl = document.getElementById('barEmpty');

  if (!transactions.length) {
    emptyEl.style.display = 'block';
    canvas.style.display  = 'none';
    if (barChartInst) { barChartInst.destroy(); barChartInst = null; }
    return;
  }

  emptyEl.style.display = 'none';
  canvas.style.display  = 'block';

  // Build monthly buckets (last 6 months)
  const buckets = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    buckets[key] = { income: 0, expense: 0 };
  }

  transactions.forEach(t => {
    if (!t.date) return;
    const d   = new Date(t.date + 'T00:00:00');
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    if (buckets[key]) buckets[key][t.type] += t.amount;
  });

  const labels   = Object.keys(buckets);
  const incomes  = labels.map(l => buckets[l].income);
  const expenses = labels.map(l => buckets[l].expense);
  const textColor = getComputedStyle(document.body).getPropertyValue('--text-2').trim();
  const gridColor = getComputedStyle(document.body).getPropertyValue('--border').trim();

  if (barChartInst) barChartInst.destroy();
  barChartInst = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomes,
          backgroundColor: 'rgba(92,184,138,.75)',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Expenses',
          data: expenses,
          backgroundColor: 'rgba(224,112,112,.75)',
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, padding: 12, font: { size: 12 } }
        },
        tooltip: {
          callbacks: { label: ctx => ` ${fmt(ctx.raw)}` }
        }
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: {
          ticks: {
            color: textColor,
            callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(1) + 'k' : v)
          },
          grid: { color: gridColor }
        }
      }
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   5. INCOME / EXPENSE ENTRY LISTS
───────────────────────────────────────────────────────────── */

function renderEntries() {
  renderIncomeList();
  renderExpenseList();
}

function buildEntryItem(t) {
  const div = document.createElement('div');
  div.className = 'entry-item';
  div.dataset.id = t.id;

  const emoji = t.type === 'income'
    ? '📥'
    : (CATEGORY_EMOJI[t.category] || '📦');

  div.innerHTML = `
    <div class="entry-left">
      <div class="entry-icon ${t.type}">${emoji}</div>
      <div>
        <div class="entry-name">${escHtml(t.type === 'income' ? t.source : t.category)}</div>
        <div class="entry-date">${fmtDate(t.date)}</div>
        ${t.notes ? `<div class="entry-notes">${escHtml(t.notes)}</div>` : ''}
      </div>
    </div>
    <div class="entry-right">
      <span class="entry-amount ${t.type}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}</span>
      <button class="delete-btn" data-id="${t.id}" aria-label="Delete transaction" title="Delete">✕</button>
    </div>
  `;
  return div;
}

function renderIncomeList() {
  const list  = document.getElementById('incomeList');
  const items = transactions.filter(t => t.type === 'income').slice().reverse();
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<p class="empty-state">No income entries yet. Add your first one above!</p>';
    return;
  }
  items.forEach(t => list.appendChild(buildEntryItem(t)));
}

function renderExpenseList() {
  const list  = document.getElementById('expenseList');
  const items = transactions.filter(t => t.type === 'expense').slice().reverse();
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<p class="empty-state">No expenses yet. Start logging to see your habits!</p>';
    return;
  }
  items.forEach(t => list.appendChild(buildEntryItem(t)));
}

/* ─────────────────────────────────────────────────────────────
   6. TRANSACTION HISTORY
───────────────────────────────────────────────────────────── */

function renderHistory() {
  const search   = (document.getElementById('searchInput').value   || '').toLowerCase();
  const typeF    =  document.getElementById('filterType').value;
  const catF     =  document.getElementById('filterCategory').value;

  let filtered = transactions.slice().reverse();

  if (typeF !== 'all') filtered = filtered.filter(t => t.type === typeF);
  if (catF  !== 'all') filtered = filtered.filter(t => (t.category || t.source) === catF);
  if (search) {
    filtered = filtered.filter(t =>
      (t.source    || '').toLowerCase().includes(search) ||
      (t.category  || '').toLowerCase().includes(search) ||
      (t.notes     || '').toLowerCase().includes(search) ||
      String(t.amount).includes(search)
    );
  }

  const body     = document.getElementById('transactionBody');
  const emptyEl  = document.getElementById('historyEmpty');
  body.innerHTML = '';

  if (!filtered.length) {
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  filtered.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge badge-${t.type}">${t.type}</span></td>
      <td>${escHtml(t.type === 'income' ? (t.source || '—') : (t.category || '—'))}</td>
      <td class="entry-amount ${t.type}" style="white-space:nowrap">
        ${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}
      </td>
      <td style="white-space:nowrap">${fmtDate(t.date)}</td>
      <td style="color:var(--text-3);font-style:italic">${escHtml(t.notes || '—')}</td>
      <td>
        <button class="delete-btn" data-id="${t.id}" aria-label="Delete" title="Delete">✕</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

/** Rebuild the category filter dropdown */
function updateCategoryFilter() {
  const sel = document.getElementById('filterCategory');
  const current = sel.value;
  const cats = [...new Set(
    transactions.filter(t => t.type === 'expense').map(t => t.category)
  )].sort();

  sel.innerHTML = '<option value="all">All Categories</option>';
  cats.forEach(c => {
    const o = document.createElement('option');
    o.value = o.textContent = c;
    sel.appendChild(o);
  });
  if (cats.includes(current)) sel.value = current;
}

/* ─────────────────────────────────────────────────────────────
   7. BUDGET INSIGHTS
───────────────────────────────────────────────────────────── */

function renderInsights() {
  const { income, expenses } = calcTotals();

  // ── Spent percentage
  const spentPct = income > 0 ? Math.min((expenses / income) * 100, 100) : 0;
  document.getElementById('spentPct').textContent = income > 0
    ? Math.round((expenses / income) * 100) + '%'
    : '—';
  const spentBar = document.getElementById('spentBar');
  spentBar.style.width = spentPct + '%';
  spentBar.className   = 'progress-bar' + (spentPct >= 90 ? ' danger' : '');

  // ── Savings rate
  const savRate = income > 0 ? Math.max(0, ((income - expenses) / income) * 100) : 0;
  document.getElementById('savingsPct').textContent = income > 0
    ? Math.round(savRate) + '%'
    : '—';
  document.getElementById('savingsBar').style.width = savRate + '%';

  // ── Alert banner
  const alertEl = document.getElementById('alertBanner');
  alertEl.hidden = !(expenses > income && income > 0);

  // ── Top category
  const catTotals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const topCat = Object.entries(catTotals).sort((a,b) => b[1]-a[1])[0];
  document.getElementById('topCategory').textContent = topCat
    ? `${CATEGORY_EMOJI[topCat[0]] || '📦'} ${topCat[0]}`
    : '—';

  // ── Monthly tx count
  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();
  const count = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;
  document.getElementById('txCount').textContent = count;

  // ── Category breakdown bars
  const breakdown = document.getElementById('categoryBreakdown');
  const expTotal  = expenses || 1;
  if (!Object.keys(catTotals).length) {
    breakdown.innerHTML = '<p class="empty-state">Add expenses to see your breakdown.</p>';
    return;
  }

  const sorted = Object.entries(catTotals).sort((a,b) => b[1]-a[1]);
  breakdown.innerHTML = '';
  sorted.forEach(([cat, amt]) => {
    const pct  = Math.round((amt / expTotal) * 100);
    const div  = document.createElement('div');
    div.className = 'cat-row';
    div.innerHTML = `
      <div class="cat-row-header">
        <span class="cat-name">${CATEGORY_EMOJI[cat] || '📦'} ${cat}</span>
        <span class="cat-amount">${fmt(amt)} <span style="color:var(--text-3);font-size:.8em">(${pct}%)</span></span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar" style="width:${pct}%"></div>
      </div>
    `;
    breakdown.appendChild(div);
  });
}

/* ─────────────────────────────────────────────────────────────
   8. FULL RENDER TRIGGER
───────────────────────────────────────────────────────────── */

function renderAll() {
  renderDashboard();
  renderEntries();
  renderHistory();
  renderInsights();
  updateCategoryFilter();
}

/* ─────────────────────────────────────────────────────────────
   9. ADD TRANSACTIONS
───────────────────────────────────────────────────────────── */

document.getElementById('addIncomeBtn').addEventListener('click', () => {
  const source = document.getElementById('incomeSource').value.trim();
  const amount = parseFloat(document.getElementById('incomeAmount').value);
  const date   = document.getElementById('incomeDate').value;

  if (!source)        { showToast('⚠️ Please enter an income source.'); return; }
  if (!amount || amount <= 0) { showToast('⚠️ Please enter a valid amount.'); return; }
  if (!date)          { showToast('⚠️ Please pick a date.'); return; }

  transactions.push({ id: uid(), type: 'income', source, amount, date, notes: '' });
  saveData();
  renderAll();
  showToast('✅ Income added!');

  // Reset form
  document.getElementById('incomeSource').value = '';
  document.getElementById('incomeAmount').value = '';
  document.getElementById('incomeDate').value   = '';
});

document.getElementById('addExpenseBtn').addEventListener('click', () => {
  const category = document.getElementById('expenseCategory').value;
  const amount   = parseFloat(document.getElementById('expenseAmount').value);
  const date     = document.getElementById('expenseDate').value;
  const notes    = document.getElementById('expenseNotes').value.trim();

  if (!category)      { showToast('⚠️ Please select a category.'); return; }
  if (!amount || amount <= 0) { showToast('⚠️ Please enter a valid amount.'); return; }
  if (!date)          { showToast('⚠️ Please pick a date.'); return; }

  transactions.push({ id: uid(), type: 'expense', category, amount, date, notes });
  saveData();
  renderAll();
  showToast('✅ Expense added!');

  // Reset form
  document.getElementById('expenseCategory').value = '';
  document.getElementById('expenseAmount').value   = '';
  document.getElementById('expenseDate').value     = '';
  document.getElementById('expenseNotes').value    = '';
});

/* ─────────────────────────────────────────────────────────────
   10. DELETE TRANSACTIONS (event delegation)
───────────────────────────────────────────────────────────── */

document.addEventListener('click', e => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  renderAll();
  showToast('🗑️ Transaction deleted.');
});

/* ─────────────────────────────────────────────────────────────
   11. NAVIGATION
───────────────────────────────────────────────────────────── */

function activateSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const section = document.getElementById(name);
  if (section) section.classList.add('active');

  document.querySelectorAll(`[data-section="${name}"]`).forEach(l => l.classList.add('active'));

  // Re-render charts when switching to dashboard (size may have changed)
  if (name === 'dashboard') {
    setTimeout(() => { renderPieChart(); renderBarChart(); }, 50);
  }
  if (name === 'insights') renderInsights();
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.dataset.section;
    if (!target) return;
    activateSection(target);
    // Close mobile menu
    closeMobileMenu();
  });
});

/* ─────────────────────────────────────────────────────────────
   12. MOBILE MENU
───────────────────────────────────────────────────────────── */

const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function closeMobileMenu() {
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
}

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
});

/* ─────────────────────────────────────────────────────────────
   13. DARK MODE
───────────────────────────────────────────────────────────── */

function applyDarkMode(on) {
  document.body.classList.toggle('dark-mode', on);
  localStorage.setItem('fintrack_dark', JSON.stringify(on));
  // Recreate charts to pick up new CSS colour tokens
  setTimeout(() => { renderPieChart(); renderBarChart(); }, 50);
}

document.getElementById('darkModeBtn').addEventListener('click', () => {
  darkMode = !darkMode;
  applyDarkMode(darkMode);
});

/* ─────────────────────────────────────────────────────────────
   14. SEARCH & FILTER (history)
───────────────────────────────────────────────────────────── */

document.getElementById('searchInput').addEventListener('input',   renderHistory);
document.getElementById('filterType').addEventListener('change',   renderHistory);
document.getElementById('filterCategory').addEventListener('change', renderHistory);

/* ─────────────────────────────────────────────────────────────
   15. CLEAR ALL DATA
───────────────────────────────────────────────────────────── */

document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (!confirm('Clear ALL data? This cannot be undone.')) return;
  transactions = [];
  saveData();
  renderAll();
  showToast('🗑️ All data cleared.');
});

/* ─────────────────────────────────────────────────────────────
   16. SET WELCOME DATE
───────────────────────────────────────────────────────────── */

function setWelcomeDate() {
  const el = document.getElementById('currentDate');
  const d  = new Date();
  el.textContent = d.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

/* ─────────────────────────────────────────────────────────────
   17. SECURITY — escape HTML to prevent XSS
───────────────────────────────────────────────────────────── */

function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/* ─────────────────────────────────────────────────────────────
   18. INIT
───────────────────────────────────────────────────────────── */

(function init() {
  // Apply persisted dark mode
  if (darkMode) document.body.classList.add('dark-mode');

  // Set default dates for both forms
  document.getElementById('incomeDate').value  = today();
  document.getElementById('expenseDate').value = today();

  setWelcomeDate();
  renderAll();
  activateSection('dashboard');
})();