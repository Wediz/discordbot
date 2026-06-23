<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>👗 Boutique — Comptabilité</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<!-- Hamburger mobile -->
<button class="hamburger" aria-label="Menu">
  <span></span><span></span><span></span>
</button>
<div class="overlay" id="overlay"></div>

<!-- Sidebar -->
<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo">
    <h1>👗 Ma Boutique</h1>
    <p>Comptabilité complète</p>
  </div>
  <nav>
    <div class="nav-section">Vue générale</div>
    <a class="nav-link" data-page="dashboard">
      <span class="icon">📊</span> Dashboard
    </a>
    <a class="nav-link" data-page="stats">
      <span class="icon">📈</span> Statistiques
    </a>
    <a class="nav-link" data-page="fiscal">
      <span class="icon">🏛️</span> Bilan fiscal
    </a>

    <div class="nav-section">Enregistrer</div>
    <a class="nav-link" data-page="stock">
      <span class="icon">🗃️</span> Mon stock
    </a>
    <a class="nav-link" data-page="import">
      <span class="icon">📥</span> Import Shopify
    </a>
    <a class="nav-link" data-page="ventes">
      <span class="icon">🛍️</span> Ventes
    </a>
    <a class="nav-link" data-page="retours">
      <span class="icon">↩️</span> Retours
    </a>
    <a class="nav-link" data-page="emballages">
      <span class="icon">📦</span> Emballages
    </a>
    <a class="nav-link" data-page="trajets">
      <span class="icon">🚗</span> Trajets essence
    </a>
    <a class="nav-link" data-page="frais">
      <span class="icon">🧾</span> Frais divers
    </a>
  </nav>

  <div style="padding:16px 20px;border-top:1px solid var(--border);font-size:.72rem;color:var(--muted)">
    <?php echo date('d/m/Y'); ?> — Base locale
  </div>
</aside>

<!-- Main -->
<main class="main">
  <div id="page-content">
    <div class="loader"></div>
  </div>
</main>

<!-- Toast -->
<div id="toast-container"></div>

<!-- Confirm dialog -->
<div class="confirm-overlay" id="confirm-overlay">
  <div class="confirm-box">
    <h3 id="confirm-title">Confirmer</h3>
    <p id="confirm-msg">Cette action est irréversible.</p>
    <div class="confirm-actions">
      <button class="btn btn-ghost" id="confirm-no">Annuler</button>
      <button class="btn btn-danger" id="confirm-ok">Supprimer</button>
    </div>
  </div>
</div>

<!-- Chart.js CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
