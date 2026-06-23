// ── Utilities ──────────────────────────────────────────────────
const eur = n => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(+n||0);
const pct = n => `${(+n||0).toFixed(1)} %`;
const today = () => new Date().toISOString().split('T')[0];

function toast(msg, type='info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

async function api(url, method='GET', body=null) {
  const opts = { method, headers: {'Content-Type':'application/json'} };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${r.status}`);
  }
  return r.json();
}

function confirm(title, msg) {
  return new Promise(resolve => {
    const ov = document.getElementById('confirm-overlay');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent   = msg;
    ov.classList.add('active');
    const ok = () => { ov.classList.remove('active'); resolve(true);  cleanup(); };
    const no = () => { ov.classList.remove('active'); resolve(false); cleanup(); };
    function cleanup() {
      document.getElementById('confirm-ok').removeEventListener('click', ok);
      document.getElementById('confirm-no').removeEventListener('click', no);
    }
    document.getElementById('confirm-ok').addEventListener('click', ok);
    document.getElementById('confirm-no').addEventListener('click', no);
  });
}

// ── Navigation ──────────────────────────────────────────────────
const pages = {};
let currentPage = '';

function registerPage(id, fn) { pages[id] = fn; }

function navigate(id) {
  document.querySelectorAll('.nav-link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === id));
  document.getElementById('page-content').innerHTML = '<div class="loader"></div>';
  currentPage = id;
  pages[id]?.();
}

// ── Dashboard ───────────────────────────────────────────────────
registerPage('dashboard', async () => {
  const now = new Date();
  const debMois = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const fin = today();

  let s;
  try { s = await api(`api/stats.php?debut=${debMois}&fin=${fin}`); }
  catch(e) { toast('Erreur chargement stats','error'); return; }

  const benColor = s.benefice_net >= 0 ? 'green' : 'red';

  document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <h2>📊 Dashboard</h2>
      <span class="badge">Ce mois</span>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card purple">
        <div class="kpi-label">CA net</div>
        <div class="kpi-value">${eur(s.ca_net)}</div>
        <div class="kpi-sub">Brut: ${eur(s.ca_brut)}</div>
      </div>
      <div class="kpi-card ${benColor}">
        <div class="kpi-label">Bénéfice net</div>
        <div class="kpi-value">${eur(s.benefice_net)}</div>
        <div class="kpi-sub">Marge: ${pct(s.ca_net > 0 ? s.benefice_net/s.ca_net*100 : 0)}</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-label">Ventes</div>
        <div class="kpi-value">${s.nb_ventes}</div>
        <div class="kpi-sub">Panier moy: ${eur(s.panier_moyen)}</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-label">Marge brute moy.</div>
        <div class="kpi-value">${pct(s.marge_moyenne)}</div>
        <div class="kpi-sub">${s.nb_articles} articles vendus</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Retours</div>
        <div class="kpi-value">${s.nb_retours}</div>
        <div class="kpi-sub">Taux: ${pct(s.taux_retour)} — ${eur(s.total_remboursements)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total charges</div>
        <div class="kpi-value">${eur(s.total_charges)}</div>
        <div class="kpi-sub">URSSAF: ${eur(s.total_cotisations)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title"><span>📈</span> CA mensuel (${now.getFullYear()})</div>
        <div class="chart-wrap"><canvas id="chart-ca"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title"><span>🏆</span> Top articles</div>
        <div class="chart-wrap"><canvas id="chart-top"></canvas></div>
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-title"><span>🏷️</span> Par catégorie</div>
        <div id="cat-list"></div>
      </div>
      <div class="card">
        <div class="card-title"><span>🛒</span> Par canal</div>
        <div id="canal-list"></div>
      </div>
      <div class="card">
        <div class="card-title"><span>💸</span> Détail charges</div>
        ${chargesDetail(s)}
      </div>
    </div>
  `;

  drawCA(s.par_mois);
  drawTop(s.top_articles);
  drawList('cat-list', s.par_categorie, 'categorie', 'ca');
  drawList('canal-list', s.par_canal, 'canal_vente', 'ca');
});

function chargesDetail(s) {
  const items = [
    ['🏷️ Achats marchandises', s.total_achats],
    ['📦 Emballages',          s.total_emballages],
    ['🚗 Trajets essence',     s.total_trajets],
    ['🧾 Frais divers',        s.total_frais_divers],
    ['🏛️ URSSAF (12,8%)',     s.urssaf],
    ['📚 CFP (0,1%)',          s.cfp],
  ];
  const total = s.total_charges + s.total_cotisations;
  return items.map(([l, v]) => {
    const w = total > 0 ? v/total*100 : 0;
    return `<div style="margin-bottom:12px">
      <div class="flex gap-8"><span style="font-size:.82rem">${l}</span><span class="ml-auto fw-bold" style="font-size:.82rem">${eur(v)}</span></div>
      <div class="mini-bar"><div class="mini-fill" style="width:${w.toFixed(1)}%"></div></div>
    </div>`;
  }).join('');
}

function drawList(id, data, keyName, valKey) {
  const el = document.getElementById(id);
  if (!el || !data.length) { el && (el.innerHTML = '<div class="empty"><p>Aucune donnée</p></div>'); return; }
  const max = Math.max(...data.map(d => +d[valKey]));
  el.innerHTML = data.map(d => `
    <div style="margin-bottom:10px">
      <div class="flex gap-8">
        <span style="font-size:.82rem">${d[keyName]}</span>
        <span class="ml-auto fw-bold text-purple" style="font-size:.82rem">${eur(d[valKey])}</span>
      </div>
      <div class="mini-bar"><div class="mini-fill" style="width:${max>0?d[valKey]/max*100:0}%"></div></div>
    </div>
  `).join('');
}

// ── Charts ──────────────────────────────────────────────────────
let chartCA, chartTop;

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

function drawCA(data) {
  if (chartCA) chartCA.destroy();
  const ctx = document.getElementById('chart-ca')?.getContext('2d');
  if (!ctx) return;
  chartCA = new Chart(ctx, {
    data: {
      labels: data.map(r => MOIS[+r.mois-1]),
      datasets: [
        { type:'bar', label:'CA (€)', data: data.map(r=>r.ca),
          backgroundColor:'rgba(180,111,255,.6)', borderColor:'rgba(180,111,255,1)',
          borderWidth:2, borderRadius:5, yAxisID:'y' },
        { type:'bar', label:'Bénéfice (€)', data: data.map(r=>r.benefice_brut),
          backgroundColor:'rgba(80,220,159,.6)', borderColor:'rgba(80,220,159,1)',
          borderWidth:2, borderRadius:5, yAxisID:'y' },
        { type:'line', label:'Ventes', data: data.map(r=>r.nb_ventes),
          borderColor:'rgba(249,180,74,1)', pointBackgroundColor:'rgba(249,180,74,1)',
          fill:false, tension:.3, yAxisID:'y2' },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ color:'#aaa', boxWidth:12, font:{size:11} } } },
      scales: {
        x:  { ticks:{color:'#888'}, grid:{color:'#1e1e36'} },
        y:  { ticks:{color:'#888', callback:v=>eur(v)}, grid:{color:'#1e1e36'} },
        y2: { ticks:{color:'#f9b44a'}, grid:{drawOnChartArea:false}, position:'right' }
      }
    }
  });
}

function drawTop(data) {
  if (chartTop) chartTop.destroy();
  const ctx = document.getElementById('chart-top')?.getContext('2d');
  if (!ctx || !data.length) return;
  const top = data.slice(0,8);
  chartTop = new Chart(ctx, {
    type:'bar',
    data: {
      labels: top.map(v => v.article.length > 16 ? v.article.slice(0,16)+'…' : v.article),
      datasets:[{
        label:'Bénéfice (€)', data: top.map(v=>v.benefice),
        backgroundColor: top.map((_,i)=>`hsl(${260+i*12},65%,60%)`),
        borderRadius:5,
      }]
    },
    options: {
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false} },
      scales: {
        x:{ ticks:{color:'#888', callback:v=>eur(v)}, grid:{color:'#1e1e36'} },
        y:{ ticks:{color:'#ccc'}, grid:{color:'#1e1e36'} }
      }
    }
  });
}

// ── Ventes page ──────────────────────────────────────────────────
registerPage('ventes', async () => {
  let embs = [];
  try { embs = await api('api/emballages.php'); } catch(e){}

  document.getElementById('page-content').innerHTML = `
    <div class="page-header"><h2>🛍️ Ventes</h2></div>

    <div class="card">
      <div class="card-title"><span>➕</span> Nouvelle vente</div>
      <form id="form-vente">
        <div class="form-grid">
          <div class="form-group">
            <label>Date *</label>
            <input type="date" name="date" value="${today()}" required>
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label>Article *</label>
            <input type="text" name="article" placeholder="ex: Robe fleurie rose" required>
          </div>
          <div class="form-group">
            <label>Catégorie</label>
            <select name="categorie">
              <option value="haut">Haut</option>
              <option value="bas">Bas / Jupe / Pantalon</option>
              <option value="robe">Robe</option>
              <option value="veste">Veste / Manteau</option>
              <option value="accessoire">Accessoire</option>
              <option value="ensemble">Ensemble</option>
              <option value="autre" selected>Autre</option>
            </select>
          </div>
          <div class="form-group">
            <label>Canal de vente</label>
            <select name="canal_vente">
              <option value="instagram">Instagram</option>
              <option value="vinted">Vinted</option>
              <option value="site">Site web</option>
              <option value="presentiel">Présentiel</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div class="form-group">
            <label>Prix d'achat (€) *</label>
            <input type="number" name="prix_achat" step="0.01" min="0" placeholder="0.00" required>
          </div>
          <div class="form-group">
            <label>Prix de vente (€) *</label>
            <input type="number" name="prix_vente" step="0.01" min="0" placeholder="0.00" required id="pv-input">
          </div>
          <div class="form-group">
            <label>Quantité</label>
            <input type="number" name="quantite" min="1" value="1">
          </div>
          <div class="form-group">
            <label>Promo (%)</label>
            <input type="number" name="promo_pourcent" min="0" max="100" step="0.1" value="0" id="promo-input">
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label>Notes</label>
            <textarea name="notes" placeholder="Notes libres..."></textarea>
          </div>
        </div>

        <div id="preview-ben" style="margin:12px 0;font-size:.85rem;color:var(--muted)"></div>

        ${embs.length ? `
        <div class="form-group mt-8">
          <label>Emballages utilisés</label>
          <div class="emb-picker" id="emb-picker">
            ${embs.filter(e=>e.stock_restant>0).map(e=>`
              <div class="emb-chip" data-id="${e.id}" data-pu="${e.prix_unitaire}">
                📦 ${e.type} <small class="text-muted">${eur(e.prix_unitaire)}/u</small>
                <span class="emb-qty" style="display:none">
                  ×<input type="number" min="1" max="${e.stock_restant}" value="1" onclick="event.stopPropagation()">
                </span>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <div class="mt-16">
          <button type="submit" class="btn btn-primary">💾 Enregistrer la vente</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-title"><span>📋</span> Historique des ventes</div>
      <div class="flex gap-8" style="margin-bottom:14px;flex-wrap:wrap">
        <input type="text" id="search-ventes" placeholder="Rechercher…" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:7px 12px;font-size:.85rem;outline:none;width:200px">
        <input type="date" id="filter-debut" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:7px 12px;font-size:.85rem;outline:none">
        <input type="date" id="filter-fin"   style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:7px 12px;font-size:.85rem;outline:none">
        <button class="btn btn-ghost btn-sm" id="btn-filter">Filtrer</button>
      </div>
      <div id="table-ventes"><div class="loader"></div></div>
    </div>
  `;

  loadVentes();
  setupVenteForm(embs);

  document.getElementById('btn-filter').addEventListener('click', loadVentes);
  document.getElementById('search-ventes').addEventListener('keyup', e => e.key==='Enter' && loadVentes());

  const pvInput = document.getElementById('pv-input');
  const promoInput = document.getElementById('promo-input');
  function updatePreview() {
    const pa = parseFloat(document.querySelector('[name=prix_achat]')?.value)||0;
    const pv = parseFloat(pvInput?.value)||0;
    const promo = parseFloat(promoInput?.value)||0;
    const pvR = pv*(1-promo/100);
    const ben = pvR - pa;
    const marge = pvR > 0 ? ben/pvR*100 : 0;
    const el = document.getElementById('preview-ben');
    if (el && (pa||pv)) {
      el.innerHTML = `Prix vente réel: <strong>${eur(pvR)}</strong> — Bénéfice: <strong class="${ben>=0?'text-green':'text-red'}">${eur(ben)}</strong> — Marge: <strong>${pct(marge)}</strong>`;
    }
  }
  document.querySelector('[name=prix_achat]')?.addEventListener('input', updatePreview);
  pvInput?.addEventListener('input', updatePreview);
  promoInput?.addEventListener('input', updatePreview);
});

function setupVenteForm(embs) {
  // Toggle emb chips
  document.getElementById('emb-picker')?.addEventListener('click', e => {
    const chip = e.target.closest('.emb-chip');
    if (!chip) return;
    chip.classList.toggle('selected');
    const qtyEl = chip.querySelector('.emb-qty');
    if (qtyEl) qtyEl.style.display = chip.classList.contains('selected') ? 'inline-flex' : 'none';
  });

  document.getElementById('form-vente').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());

    // Collect emballages
    const selectedEmbs = [];
    document.querySelectorAll('.emb-chip.selected').forEach(chip => {
      const qty = parseInt(chip.querySelector('input')?.value||1);
      selectedEmbs.push({ id: +chip.dataset.id, quantite: qty });
    });
    body.emballages = selectedEmbs;
    body.prix_achat = +body.prix_achat;
    body.prix_vente = +body.prix_vente;
    body.quantite   = +body.quantite;
    body.promo_pourcent = +body.promo_pourcent;

    try {
      await api('api/ventes.php', 'POST', body);
      toast('Vente enregistrée ✅','success');
      e.target.reset();
      e.target.querySelector('[name=date]').value = today();
      loadVentes();
    } catch(err) {
      toast(err.message,'error');
    }
  });
}

async function loadVentes() {
  const search = document.getElementById('search-ventes')?.value || '';
  const debut  = document.getElementById('filter-debut')?.value || '';
  const fin    = document.getElementById('filter-fin')?.value   || '';
  const wrap   = document.getElementById('table-ventes');
  if (!wrap) return;
  wrap.innerHTML = '<div class="loader"></div>';

  let params = `limit=100`;
  if (search) params += `&search=${encodeURIComponent(search)}`;
  if (debut)  params += `&debut=${debut}`;
  if (fin)    params += `&fin=${fin}`;

  try {
    const { data } = await api(`api/ventes.php?${params}`);
    if (!data.length) { wrap.innerHTML = '<div class="empty"><div class="empty-icon">🛍️</div><p>Aucune vente</p></div>'; return; }

    wrap.innerHTML = `
      <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Date</th><th>Article</th><th>Catégorie</th><th>Canal</th>
          <th class="td-right">Achat</th><th class="td-right">Vente</th><th class="td-right">Promo</th>
          <th class="td-right">Qté</th><th class="td-right">Bénéfice</th><th class="td-right">Marge</th>
          <th></th>
        </tr></thead>
        <tbody>
          ${data.map(v => {
            const pvR = v.prix_vente*(1-v.promo_pourcent/100);
            const ben = (pvR-v.prix_achat)*v.quantite;
            const marge = pvR>0?(pvR-v.prix_achat)/pvR*100:0;
            return `<tr>
              <td>${v.date}</td>
              <td><strong>${escHtml(v.article)}</strong>${v.notes?`<br><small class="text-muted">${escHtml(v.notes)}</small>`:''}  </td>
              <td><span class="tag tag-purple">${v.categorie}</span></td>
              <td><span class="tag tag-blue">${v.canal_vente}</span></td>
              <td class="td-right">${eur(v.prix_achat)}</td>
              <td class="td-right">${eur(pvR)}</td>
              <td class="td-right">${v.promo_pourcent>0?`<span class="tag tag-orange">-${v.promo_pourcent}%</span>`:'—'}</td>
              <td class="td-center">${v.quantite}</td>
              <td class="td-right fw-bold ${ben>=0?'text-green':'text-red'}">${eur(ben)}</td>
              <td class="td-right">${pct(marge)}</td>
              <td><button class="btn btn-danger btn-sm btn-icon" onclick="deleteVente(${v.id})">🗑</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>`;
  } catch(err) {
    wrap.innerHTML = `<div class="empty"><p>${err.message}</p></div>`;
  }
}

async function deleteVente(id) {
  if (!await confirm('Supprimer cette vente ?', 'Le stock emballage sera restitué. Action irréversible.')) return;
  try {
    await api(`api/ventes.php?id=${id}`, 'DELETE');
    toast('Vente supprimée','info');
    loadVentes();
  } catch(e) { toast(e.message,'error'); }
}

// ── Emballages page ──────────────────────────────────────────────
registerPage('emballages', async () => {
  document.getElementById('page-content').innerHTML = `
    <div class="page-header"><h2>📦 Emballages & Matériel</h2></div>

    <div class="card">
      <div class="card-title"><span>➕</span> Ajouter un achat d'emballage</div>
      <form id="form-emb">
        <div class="form-grid">
          <div class="form-group">
            <label>Date *</label>
            <input type="date" name="date" value="${today()}" required>
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label>Type *</label>
            <input type="text" name="type" placeholder="ex: Pochette noire, Scotch décoratif, Papier cadeau…" required>
          </div>
          <div class="form-group">
            <label>Quantité achetée *</label>
            <input type="number" name="quantite_achetee" min="1" value="1" required id="emb-qty">
          </div>
          <div class="form-group">
            <label>Prix total payé (€) *</label>
            <input type="number" name="prix_total" step="0.01" min="0" placeholder="0.00" required id="emb-pt">
          </div>
          <div class="form-group">
            <label>Prix unitaire calculé</label>
            <input type="text" id="emb-pu" readonly placeholder="Automatique" style="opacity:.6">
          </div>
        </div>
        <div class="mt-16">
          <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-title"><span>🗃️</span> Stock & historique</div>
      <div id="table-emb"><div class="loader"></div></div>
    </div>
  `;

  loadEmb();

  const calcPU = () => {
    const q = +document.getElementById('emb-qty').value || 1;
    const p = +document.getElementById('emb-pt').value  || 0;
    document.getElementById('emb-pu').value = q ? `${(p/q).toFixed(4)} €` : '';
  };
  document.getElementById('emb-qty').addEventListener('input', calcPU);
  document.getElementById('emb-pt').addEventListener('input', calcPU);

  document.getElementById('form-emb').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.quantite_achetee = +body.quantite_achetee;
    body.prix_total = +body.prix_total;
    try {
      const r = await api('api/emballages.php','POST',body);
      toast(`Enregistré — ${eur(r.prix_unitaire)}/unité ✅`,'success');
      e.target.reset();
      e.target.querySelector('[name=date]').value = today();
      document.getElementById('emb-pu').value = '';
      loadEmb();
    } catch(err) { toast(err.message,'error'); }
  });
});

async function loadEmb() {
  const wrap = document.getElementById('table-emb');
  if (!wrap) return;
  wrap.innerHTML = '<div class="loader"></div>';
  try {
    const data = await api('api/emballages.php');
    if (!data.length) { wrap.innerHTML = '<div class="empty"><div class="empty-icon">📦</div><p>Aucun emballage</p></div>'; return; }
    wrap.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr>
          <th>Date</th><th>Type</th>
          <th class="td-right">Acheté</th><th class="td-right">Prix total</th>
          <th class="td-right">Prix unitaire</th><th class="td-right">Stock restant</th>
          <th class="td-right">Utilisés</th><th class="td-right">Val. utilisée</th>
          <th class="td-right">Val. stock</th><th></th>
        </tr></thead>
        <tbody>
          ${data.map(e => {
            const valStock = e.stock_restant * e.prix_unitaire;
            const lowStock = e.stock_restant < 10;
            return `<tr>
              <td>${e.date}</td>
              <td><strong>${escHtml(e.type)}</strong></td>
              <td class="td-right">${e.quantite_achetee}</td>
              <td class="td-right">${eur(e.prix_total)}</td>
              <td class="td-right fw-bold text-orange">${eur(e.prix_unitaire)}</td>
              <td class="td-right ${lowStock?'text-red fw-bold':''}">${e.stock_restant} ${lowStock?'⚠️':''}</td>
              <td class="td-right">${e.total_utilise}</td>
              <td class="td-right">${eur(e.cout_total_utilise)}</td>
              <td class="td-right text-purple">${eur(valStock)}</td>
              <td><button class="btn btn-danger btn-sm btn-icon" onclick="deleteEmb(${e.id})">🗑</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>`;
  } catch(err) { wrap.innerHTML = `<div class="empty"><p>${err.message}</p></div>`; }
}

async function deleteEmb(id) {
  if (!await confirm('Supprimer cet emballage ?', 'Les frais liés aux ventes seront aussi supprimés.')) return;
  try { await api(`api/emballages.php?id=${id}`,'DELETE'); toast('Supprimé','info'); loadEmb(); }
  catch(e) { toast(e.message,'error'); }
}

// ── Retours page ─────────────────────────────────────────────────
registerPage('retours', async () => {
  document.getElementById('page-content').innerHTML = `
    <div class="page-header"><h2>↩️ Retours</h2></div>
    <div class="card">
      <div class="card-title"><span>➕</span> Enregistrer un retour</div>
      <form id="form-retour">
        <div class="form-grid">
          <div class="form-group"><label>Date *</label><input type="date" name="date" value="${today()}" required></div>
          <div class="form-group" style="grid-column:span 2"><label>Article *</label><input type="text" name="article" required placeholder="Nom de l'article"></div>
          <div class="form-group"><label>Prix de vente initial (€) *</label><input type="number" name="prix_vente" step="0.01" min="0" required></div>
          <div class="form-group"><label>Montant remboursé (€) *</label><input type="number" name="remboursement" step="0.01" min="0" required></div>
          <div class="form-group"><label>ID vente originale</label><input type="number" name="vente_id" min="1" placeholder="optionnel"></div>
          <div class="form-group" style="grid-column:span 2"><label>Motif</label><input type="text" name="motif" placeholder="ex: Taille, Défaut…"></div>
        </div>
        <div class="mt-16"><button type="submit" class="btn btn-primary">💾 Enregistrer</button></div>
      </form>
    </div>
    <div class="card">
      <div class="card-title"><span>📋</span> Historique des retours</div>
      <div id="table-retours"><div class="loader"></div></div>
    </div>
  `;

  loadRetours();

  document.getElementById('form-retour').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.prix_vente    = +body.prix_vente;
    body.remboursement = +body.remboursement;
    if (body.vente_id) body.vente_id = +body.vente_id; else delete body.vente_id;
    try {
      await api('api/retours.php','POST',body);
      toast('Retour enregistré','success');
      e.target.reset();
      e.target.querySelector('[name=date]').value = today();
      loadRetours();
    } catch(err) { toast(err.message,'error'); }
  });
});

async function loadRetours() {
  const wrap = document.getElementById('table-retours');
  if (!wrap) return;
  wrap.innerHTML = '<div class="loader"></div>';
  try {
    const data = await api('api/retours.php');
    if (!data.length) { wrap.innerHTML = '<div class="empty"><div class="empty-icon">↩️</div><p>Aucun retour</p></div>'; return; }
    wrap.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>Article</th><th>Motif</th><th class="td-right">Prix vente</th><th class="td-right">Remboursé</th><th class="td-right">Perte</th><th></th></tr></thead>
      <tbody>${data.map(r=>`<tr>
        <td>${r.date}</td><td><strong>${escHtml(r.article)}</strong></td>
        <td>${escHtml(r.motif||'—')}</td>
        <td class="td-right">${eur(r.prix_vente)}</td>
        <td class="td-right text-red">${eur(r.remboursement)}</td>
        <td class="td-right fw-bold text-red">-${eur(r.remboursement)}</td>
        <td><button class="btn btn-danger btn-sm btn-icon" onclick="deleteRetour(${r.id})">🗑</button></td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  } catch(err) { wrap.innerHTML = `<div class="empty"><p>${err.message}</p></div>`; }
}

async function deleteRetour(id) {
  if (!await confirm('Supprimer ce retour ?','Action irréversible.')) return;
  try { await api(`api/retours.php?id=${id}`,'DELETE'); toast('Supprimé','info'); loadRetours(); }
  catch(e) { toast(e.message,'error'); }
}

// ── Trajets page ─────────────────────────────────────────────────
registerPage('trajets', async () => {
  document.getElementById('page-content').innerHTML = `
    <div class="page-header"><h2>🚗 Trajets Essence</h2></div>
    <div class="card">
      <div class="card-title"><span>➕</span> Nouveau trajet</div>
      <form id="form-trajet">
        <div class="form-grid">
          <div class="form-group"><label>Date *</label><input type="date" name="date" value="${today()}" required></div>
          <div class="form-group"><label>Destination</label><input type="text" name="destination" value="La Poste"></div>
          <div class="form-group"><label>Distance aller (km) *</label><input type="number" name="distance_km" step="0.1" min="0" required id="t-dist" placeholder="ex: 3.5"></div>
          <div class="form-group"><label>Prix essence (€/L) *</label><input type="number" name="prix_essence_litre" step="0.001" min="0" required id="t-pe" placeholder="ex: 1.85"></div>
          <div class="form-group"><label>Consommation (L/100km) *</label><input type="number" name="consommation_100km" step="0.1" min="0" required id="t-conso" placeholder="ex: 6.5"></div>
          <div class="form-group"><label>Nombre de colis</label><input type="number" name="nb_colis" min="1" value="1" id="t-colis"></div>
        </div>
        <div id="preview-trajet" style="margin:12px 0;font-size:.85rem;color:var(--muted)"></div>
        <div class="mt-16"><button type="submit" class="btn btn-primary">💾 Enregistrer</button></div>
      </form>
    </div>
    <div class="card">
      <div class="card-title"><span>📋</span> Historique des trajets</div>
      <div id="table-trajets"><div class="loader"></div></div>
    </div>
  `;

  loadTrajets();

  const calcPreview = () => {
    const dist = +document.getElementById('t-dist').value || 0;
    const pe   = +document.getElementById('t-pe').value   || 0;
    const co   = +document.getElementById('t-conso').value|| 0;
    const nb   = +document.getElementById('t-colis').value|| 1;
    if (!dist || !pe || !co) { document.getElementById('preview-trajet').innerHTML=''; return; }
    const litres = dist*2*co/100;
    const cout   = litres*pe;
    const pColis = cout/nb;
    document.getElementById('preview-trajet').innerHTML =
      `Aller-retour: <strong>${(dist*2).toFixed(1)} km</strong> — Litres: <strong>${litres.toFixed(2)} L</strong> — Coût total: <strong class="text-orange">${eur(cout)}</strong> — Par colis: <strong class="text-green">${eur(pColis)}</strong>`;
  };
  ['t-dist','t-pe','t-conso','t-colis'].forEach(id => document.getElementById(id)?.addEventListener('input',calcPreview));

  document.getElementById('form-trajet').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.distance_km = +body.distance_km;
    body.prix_essence_litre = +body.prix_essence_litre;
    body.consommation_100km = +body.consommation_100km;
    body.nb_colis = +body.nb_colis;
    try {
      const r = await api('api/trajets.php','POST',body);
      toast(`Trajet enregistré — ${eur(r.cout_total)} (${r.litres} L) ✅`,'success');
      e.target.reset();
      e.target.querySelector('[name=date]').value = today();
      document.getElementById('preview-trajet').innerHTML = '';
      loadTrajets();
    } catch(err) { toast(err.message,'error'); }
  });
});

async function loadTrajets() {
  const wrap = document.getElementById('table-trajets');
  if (!wrap) return;
  wrap.innerHTML = '<div class="loader"></div>';
  try {
    const data = await api('api/trajets.php');
    if (!data.length) { wrap.innerHTML = '<div class="empty"><div class="empty-icon">🚗</div><p>Aucun trajet</p></div>'; return; }
    wrap.innerHTML = `<div class="table-wrap"><table>
      <thead><tr>
        <th>Date</th><th>Destination</th><th class="td-right">Dist. A/R</th>
        <th class="td-right">Prix essence</th><th class="td-right">Conso</th>
        <th class="td-right">Litres</th><th class="td-right">Nb colis</th>
        <th class="td-right">Coût total</th><th class="td-right">Par colis</th><th></th>
      </tr></thead>
      <tbody>${data.map(t=>{
        const litres = t.distance_km*2*t.consommation_100km/100;
        const pC = t.cout_total/t.nb_colis;
        return `<tr>
          <td>${t.date}</td><td>${escHtml(t.destination)}</td>
          <td class="td-right">${(t.distance_km*2).toFixed(1)} km</td>
          <td class="td-right">${eur(t.prix_essence_litre)}/L</td>
          <td class="td-right">${t.consommation_100km} L/100</td>
          <td class="td-right">${litres.toFixed(2)} L</td>
          <td class="td-center">${t.nb_colis}</td>
          <td class="td-right fw-bold text-orange">${eur(t.cout_total)}</td>
          <td class="td-right text-green">${eur(pC)}</td>
          <td><button class="btn btn-danger btn-sm btn-icon" onclick="deleteTrajet(${t.id})">🗑</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
  } catch(err) { wrap.innerHTML = `<div class="empty"><p>${err.message}</p></div>`; }
}

async function deleteTrajet(id) {
  if (!await confirm('Supprimer ce trajet ?','Action irréversible.')) return;
  try { await api(`api/trajets.php?id=${id}`,'DELETE'); toast('Supprimé','info'); loadTrajets(); }
  catch(e) { toast(e.message,'error'); }
}

// ── Frais page ───────────────────────────────────────────────────
registerPage('frais', async () => {
  document.getElementById('page-content').innerHTML = `
    <div class="page-header"><h2>🧾 Frais divers</h2></div>
    <div class="card">
      <div class="card-title"><span>➕</span> Ajouter un frais</div>
      <form id="form-frais">
        <div class="form-grid">
          <div class="form-group"><label>Date *</label><input type="date" name="date" value="${today()}" required></div>
          <div class="form-group">
            <label>Catégorie *</label>
            <select name="categorie" required>
              <option value="abonnement">Abonnement / Logiciel</option>
              <option value="pub">Publicité / Marketing</option>
              <option value="materiel">Matériel de bureau</option>
              <option value="bancaire">Frais bancaires</option>
              <option value="formation">Formation</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:span 2"><label>Description *</label><input type="text" name="description" required placeholder="ex: Abonnement Canva Pro"></div>
          <div class="form-group"><label>Montant (€) *</label><input type="number" name="montant" step="0.01" min="0" required></div>
        </div>
        <div class="mt-16"><button type="submit" class="btn btn-primary">💾 Enregistrer</button></div>
      </form>
    </div>
    <div class="card">
      <div class="card-title"><span>📋</span> Historique</div>
      <div id="table-frais"><div class="loader"></div></div>
    </div>
  `;

  loadFrais();

  document.getElementById('form-frais').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.montant = +body.montant;
    try {
      await api('api/frais.php','POST',body);
      toast('Frais enregistré ✅','success');
      e.target.reset();
      e.target.querySelector('[name=date]').value = today();
      loadFrais();
    } catch(err) { toast(err.message,'error'); }
  });
});

async function loadFrais() {
  const wrap = document.getElementById('table-frais');
  if (!wrap) return;
  wrap.innerHTML = '<div class="loader"></div>';
  try {
    const data = await api('api/frais.php');
    if (!data.length) { wrap.innerHTML = '<div class="empty"><div class="empty-icon">🧾</div><p>Aucun frais</p></div>'; return; }
    const TAGS = {abonnement:'tag-purple',pub:'tag-blue',materiel:'tag-orange',bancaire:'tag-red',formation:'tag-green',autre:'tag-purple'};
    wrap.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>Catégorie</th><th>Description</th><th class="td-right">Montant</th><th></th></tr></thead>
      <tbody>${data.map(f=>`<tr>
        <td>${f.date}</td>
        <td><span class="tag ${TAGS[f.categorie]||'tag-purple'}">${f.categorie}</span></td>
        <td>${escHtml(f.description)}</td>
        <td class="td-right fw-bold text-red">-${eur(f.montant)}</td>
        <td><button class="btn btn-danger btn-sm btn-icon" onclick="deleteFrais(${f.id})">🗑</button></td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  } catch(err) { wrap.innerHTML = `<div class="empty"><p>${err.message}</p></div>`; }
}

async function deleteFrais(id) {
  if (!await confirm('Supprimer ce frais ?','Action irréversible.')) return;
  try { await api(`api/frais.php?id=${id}`,'DELETE'); toast('Supprimé','info'); loadFrais(); }
  catch(e) { toast(e.message,'error'); }
}

// ── Stats page ───────────────────────────────────────────────────
registerPage('stats', async () => {
  document.getElementById('page-content').innerHTML = `
    <div class="page-header"><h2>📊 Statistiques détaillées</h2></div>
    <div class="period-bar">
      <button class="btn btn-ghost btn-sm period-btn" data-p="mois">Ce mois</button>
      <button class="btn btn-ghost btn-sm period-btn" data-p="trimestre">Trimestre</button>
      <button class="btn btn-ghost btn-sm period-btn" data-p="annee">Cette année</button>
      <button class="btn btn-ghost btn-sm period-btn" data-p="tout">Tout</button>
      <span class="sep">ou</span>
      <input type="date" id="s-debut" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:7px 10px;font-size:.82rem;outline:none">
      <input type="date" id="s-fin"   style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:7px 10px;font-size:.82rem;outline:none">
      <button class="btn btn-primary btn-sm" id="s-filter">Filtrer</button>
    </div>
    <div id="stats-content"><div class="loader"></div></div>
  `;

  const getPeriod = p => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth()+1;
    if (p==='mois')      return [`${y}-${String(m).padStart(2,'0')}-01`, today()];
    if (p==='trimestre') {
      const q = Math.floor((m-1)/3);
      return [`${y}-${String(q*3+1).padStart(2,'0')}-01`, today()];
    }
    if (p==='annee') return [`${y}-01-01`, today()];
    return [null, null];
  };

  let currentDebut, currentFin;

  const load = async (debut, fin) => {
    currentDebut = debut; currentFin = fin;
    const el = document.getElementById('stats-content');
    if (!el) return;
    el.innerHTML = '<div class="loader"></div>';
    const url = debut && fin ? `api/stats.php?debut=${debut}&fin=${fin}` : 'api/stats.php';
    try {
      const s = await api(url);
      const benColor = s.benefice_net>=0 ? 'text-green':'text-red';
      el.innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card purple"><div class="kpi-label">CA net</div><div class="kpi-value">${eur(s.ca_net)}</div><div class="kpi-sub">Brut: ${eur(s.ca_brut)}</div></div>
          <div class="kpi-card ${s.benefice_net>=0?'green':'red'}"><div class="kpi-label">Bénéfice net</div><div class="kpi-value">${eur(s.benefice_net)}</div><div class="kpi-sub">Marge nette: ${pct(s.ca_net>0?s.benefice_net/s.ca_net*100:0)}</div></div>
          <div class="kpi-card orange"><div class="kpi-label">Ventes</div><div class="kpi-value">${s.nb_ventes}</div><div class="kpi-sub">${s.nb_articles} articles</div></div>
          <div class="kpi-card blue"><div class="kpi-label">Panier moyen</div><div class="kpi-value">${eur(s.panier_moyen)}</div><div class="kpi-sub">Marge brute moy: ${pct(s.marge_moyenne)}</div></div>
          <div class="kpi-card red"><div class="kpi-label">Retours</div><div class="kpi-value">${s.nb_retours}</div><div class="kpi-sub">Taux: ${pct(s.taux_retour)}</div></div>
          <div class="kpi-card"><div class="kpi-label">URSSAF estimée</div><div class="kpi-value text-orange">${eur(s.total_cotisations)}</div><div class="kpi-sub">${eur(s.urssaf)} + ${eur(s.cfp)} CFP</div></div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-title"><span>💸</span> Détail des charges</div>
            <table><tbody>
              ${[
                ['Achats marchandises','tag-purple',s.total_achats],
                ['Emballages','tag-orange',s.total_emballages],
                ['Trajets essence','tag-blue',s.total_trajets],
                ['Frais divers','tag-green',s.total_frais_divers],
                ['URSSAF (12,8%)','tag-red',s.urssaf],
                ['CFP (0,1%)','tag-red',s.cfp],
              ].map(([l,t,v])=>`<tr><td><span class="tag ${t}">${l}</span></td><td class="td-right fw-bold">${eur(v)}</td></tr>`).join('')}
              <tr style="border-top:1px solid var(--border)"><td><strong>Total charges + cotisations</strong></td><td class="td-right fw-bold text-red">${eur(s.total_charges+s.total_cotisations)}</td></tr>
            </tbody></table>
          </div>
          <div class="card">
            <div class="card-title"><span>📈</span> CA par mois (${new Date().getFullYear()})</div>
            <div class="chart-wrap"><canvas id="chart-ca-stats"></canvas></div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-title"><span>🏆</span> Top articles</div>
            <div class="table-wrap"><table>
              <thead><tr><th>#</th><th>Article</th><th>Qté</th><th class="td-right">Prix moy</th><th class="td-right">Bénéfice</th><th class="td-right">Marge</th></tr></thead>
              <tbody>${s.top_articles.map((v,i)=>`<tr>
                <td>${['🥇','🥈','🥉'][i]||i+1}</td>
                <td><strong>${escHtml(v.article)}</strong><br><small class="text-muted">${v.categorie}</small></td>
                <td class="td-center">×${v.qte}</td>
                <td class="td-right">${eur(v.prix_moyen)}</td>
                <td class="td-right fw-bold text-green">${eur(v.benefice)}</td>
                <td class="td-right">${pct(v.marge_pct)}</td>
              </tr>`).join('')}</tbody>
            </table></div>
          </div>
          <div class="card">
            <div class="card-title"><span>🏷️</span> Par catégorie & canal</div>
            <div class="card-title" style="margin-top:8px"><span>📁</span> Catégories</div>
            ${s.par_categorie.map(c=>`
              <div class="flex gap-8" style="margin-bottom:6px">
                <span class="tag tag-purple">${c.categorie}</span>
                <span class="text-muted" style="font-size:.8rem">${c.nb_ventes} ventes</span>
                <span class="ml-auto fw-bold">${eur(c.ca)}</span>
                <span class="text-green" style="font-size:.8rem">${eur(c.benefice)}</span>
              </div>`).join('')}
            <hr class="divider">
            <div class="card-title"><span>🛒</span> Canaux</div>
            ${s.par_canal.map(c=>`
              <div class="flex gap-8" style="margin-bottom:6px">
                <span class="tag tag-blue">${c.canal_vente}</span>
                <span class="text-muted" style="font-size:.8rem">${c.nb_ventes} ventes</span>
                <span class="ml-auto fw-bold">${eur(c.ca)}</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-title"><span>🚗</span> Logistique</div>
          <div class="kpi-grid">
            <div class="kpi-card blue"><div class="kpi-label">Km parcourus</div><div class="kpi-value">${s.km_total} km</div><div class="kpi-sub">A/R inclus</div></div>
            <div class="kpi-card orange"><div class="kpi-label">Coût essence</div><div class="kpi-value">${eur(s.total_trajets)}</div></div>
            <div class="kpi-card"><div class="kpi-label">Colis déposés</div><div class="kpi-value">${s.colis_total}</div></div>
            <div class="kpi-card green"><div class="kpi-label">Coût / colis</div><div class="kpi-value">${eur(s.colis_total>0?s.total_trajets/s.colis_total:0)}</div></div>
          </div>
        </div>
      `;

      if (s.par_mois?.length) drawCA(s.par_mois);
      // re-draw chart in stats context
      if (document.getElementById('chart-ca-stats')) {
        const ctx = document.getElementById('chart-ca-stats').getContext('2d');
        new Chart(ctx, {
          data: {
            labels: s.par_mois.map(r=>MOIS[+r.mois-1]),
            datasets:[
              {type:'bar',label:'CA (€)',data:s.par_mois.map(r=>r.ca),backgroundColor:'rgba(180,111,255,.6)',borderColor:'rgba(180,111,255,1)',borderWidth:2,borderRadius:5},
              {type:'bar',label:'Bénéfice (€)',data:s.par_mois.map(r=>r.benefice_brut),backgroundColor:'rgba(80,220,159,.6)',borderColor:'rgba(80,220,159,1)',borderWidth:2,borderRadius:5},
            ]
          },
          options:{responsive:true,maintainAspectRatio:false,
            plugins:{legend:{labels:{color:'#aaa',font:{size:11}}}},
            scales:{x:{ticks:{color:'#888'},grid:{color:'#1e1e36'}},y:{ticks:{color:'#888',callback:v=>eur(v)},grid:{color:'#1e1e36'}}}
          }
        });
      }

    } catch(err) {
      el.innerHTML = `<div class="empty"><p>${err.message}</p></div>`;
    }
  };

  // Default: ce mois
  const [d, f] = getPeriod('mois');
  document.getElementById('s-debut').value = d||'';
  document.getElementById('s-fin').value   = f||'';
  await load(d, f);

  document.querySelectorAll('.period-btn').forEach(btn => btn.addEventListener('click', async () => {
    const [d2,f2] = getPeriod(btn.dataset.p);
    document.getElementById('s-debut').value = d2||'';
    document.getElementById('s-fin').value   = f2||'';
    await load(d2, f2);
  }));

  document.getElementById('s-filter').addEventListener('click', () => {
    const d2 = document.getElementById('s-debut').value;
    const f2 = document.getElementById('s-fin').value;
    load(d2||null, f2||null);
  });
});

// ── Fiscal page ───────────────────────────────────────────────────
registerPage('fiscal', async () => {
  const annee = new Date().getFullYear();
  document.getElementById('page-content').innerHTML = `
    <div class="page-header"><h2>🏛️ Bilan Fiscal</h2></div>
    <div class="card" style="max-width:400px">
      <div class="card-title"><span>⚙️</span> Paramètres</div>
      <div class="form-grid">
        <div class="form-group"><label>Année</label><input type="number" id="f-annee" value="${annee}" min="2020" max="2099"></div>
        <div class="form-group"><label>Autres revenus foyer (€)</label><input type="number" id="f-autres" value="0" step="100" min="0" placeholder="0"></div>
      </div>
      <div class="mt-16"><button class="btn btn-primary" id="f-calc">Calculer</button></div>
    </div>
    <div id="fiscal-content"></div>
  `;

  const calc = async () => {
    const a = document.getElementById('f-annee').value;
    const autres = +document.getElementById('f-autres').value || 0;
    const s = await api(`api/stats.php?debut=${a}-01-01&fin=${a}-12-31`);

    const SEUIL_TVA   = 91900;
    const SEUIL_MICRO = 188700;
    const pctTVA      = Math.min(s.ca_net/SEUIL_TVA*100, 100);
    const pctMicro    = Math.min(s.ca_net/SEUIL_MICRO*100, 100);

    // IR simplifié par tranches 2024
    const tranches = [[11294,0],[28797,.11],[82341,.30],[177106,.41],[Infinity,.45]];
    const irTotal = r => {
      let imp=0, prev=0;
      for (const [lim,tx] of tranches) {
        const t = Math.min(r,lim)-prev;
        if (t<=0) break;
        imp += t*tx; prev=lim;
      }
      return imp;
    };
    const irEstime = irTotal(s.revenu_imposable + autres) - irTotal(autres);

    document.getElementById('fiscal-content').innerHTML = `
      <div class="card">
        <div class="card-title"><span>📋</span> Déclaration URSSAF ${a}</div>
        <div class="fiscal-block">
          <div class="fiscal-line"><div class="fl-label">CA à déclarer</div><div class="fl-value text-purple">${eur(s.ca_net)}</div></div>
          <div class="fiscal-line"><div class="fl-label">URSSAF 12,8%</div><div class="fl-value text-red">${eur(s.urssaf)}</div></div>
          <div class="fiscal-line"><div class="fl-label">CFP 0,1%</div><div class="fl-value text-red">${eur(s.cfp)}</div></div>
          <div class="fiscal-line"><div class="fl-label">Total cotisations</div><div class="fl-value text-orange fw-bold">${eur(s.total_cotisations)}</div></div>
          <div class="fiscal-line"><div class="fl-label">Par trimestre</div><div class="fl-value">${eur(s.total_cotisations/4)}</div></div>
          <div class="fiscal-line"><div class="fl-label">Par mois</div><div class="fl-value">${eur(s.total_cotisations/12)}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span>💶</span> Déclaration Impôts ${a}</div>
        <div class="fiscal-block">
          <div class="fiscal-line"><div class="fl-label">CA net</div><div class="fl-value">${eur(s.ca_net)}</div></div>
          <div class="fiscal-line"><div class="fl-label">Abattement 71%</div><div class="fl-value text-green">-${eur(s.ca_net*.71)}</div></div>
          <div class="fiscal-line"><div class="fl-label">Revenu imposable boutique</div><div class="fl-value text-purple">${eur(s.revenu_imposable)}</div></div>
          ${autres>0?`
          <div class="fiscal-line"><div class="fl-label">Autres revenus foyer</div><div class="fl-value">${eur(autres)}</div></div>
          <div class="fiscal-line"><div class="fl-label">Revenu imposable total</div><div class="fl-value fw-bold">${eur(s.revenu_imposable+autres)}</div></div>
          <div class="fiscal-line"><div class="fl-label">IR estimé boutique</div><div class="fl-value text-red fw-bold">~${eur(irEstime)}</div></div>`:''}
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span>⚠️</span> Seuils à surveiller</div>
        <div style="margin-bottom:20px">
          <div class="flex gap-8" style="margin-bottom:6px">
            <strong>Franchise TVA</strong>
            <span class="ml-auto">${eur(s.ca_net)} / ${eur(SEUIL_TVA)}</span>
            <span class="fw-bold ${pctTVA>=100?'text-red':pctTVA>=90?'text-orange':'text-green'}">${pctTVA.toFixed(1)}%</span>
          </div>
          <div class="seuil-bar">
            <div class="seuil-fill ${pctTVA>=100?'danger':pctTVA>=90?'warn':'ok'}" style="width:${pctTVA}%"></div>
          </div>
          <small class="text-muted">${pctTVA>=100?'⚠️ SEUIL DÉPASSÉ — TVA obligatoire':pctTVA>=90?`⚡ Attention : ${eur(SEUIL_TVA-s.ca_net)} restants`:`✅ ${eur(SEUIL_TVA-s.ca_net)} restants avant la TVA`}</small>
        </div>
        <div>
          <div class="flex gap-8" style="margin-bottom:6px">
            <strong>Seuil micro-entreprise</strong>
            <span class="ml-auto">${eur(s.ca_net)} / ${eur(SEUIL_MICRO)}</span>
            <span class="fw-bold ${pctMicro>=100?'text-red':pctMicro>=90?'text-orange':'text-green'}">${pctMicro.toFixed(1)}%</span>
          </div>
          <div class="seuil-bar">
            <div class="seuil-fill ${pctMicro>=100?'danger':pctMicro>=90?'warn':'ok'}" style="width:${pctMicro}%"></div>
          </div>
          <small class="text-muted">${pctMicro>=100?'🚨 DÉPASSÉ — Passage en EI requis':`✅ ${eur(SEUIL_MICRO-s.ca_net)} restants`}</small>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span>✨</span> Résultat réel ${a}</div>
        <div class="fiscal-block">
          <div class="fiscal-line"><div class="fl-label">CA net</div><div class="fl-value">${eur(s.ca_net)}</div></div>
          <div class="fiscal-line"><div class="fl-label">Total charges</div><div class="fl-value text-red">-${eur(s.total_charges)}</div></div>
          <div class="fiscal-line"><div class="fl-label">Cotisations</div><div class="fl-value text-red">-${eur(s.total_cotisations)}</div></div>
          <div class="fiscal-line" style="border:2px solid var(--accent);border-radius:10px">
            <div class="fl-label">Bénéfice net réel</div>
            <div class="fl-value ${s.benefice_net>=0?'text-green':'text-red'} fw-bold">${eur(s.benefice_net)}</div>
          </div>
        </div>
        <small class="text-muted">Taux micro-entreprise vente de marchandises 2024 — Abattement forfaitaire 71%</small>
      </div>
    `;
  };

  document.getElementById('f-calc').addEventListener('click', calc);
  await calc();
});

// ── Helpers ───────────────────────────────────────────────────────
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-link').forEach(l =>
    l.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('overlay').classList.remove('active');
      navigate(l.dataset.page);
    })
  );

  document.querySelector('.hamburger')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
  });
  document.getElementById('overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  });

  navigate('dashboard');
});
