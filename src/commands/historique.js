import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database.js';
import { formatEuro } from '../utils/stats.js';

export const data = new SlashCommandBuilder()
  .setName('historique')
  .setDescription('Voir les dernières ventes / retours / trajets')
  .addStringOption(o => o.setName('type').setDescription('Type').addChoices(
    { name: 'Ventes', value: 'ventes' },
    { name: 'Retours', value: 'retours' },
    { name: 'Trajets', value: 'trajets' },
    { name: 'Frais divers', value: 'frais' },
  ))
  .addIntegerOption(o => o.setName('limite').setDescription('Nombre d\'entrées (défaut: 10)'));

export async function execute(interaction) {
  const type = interaction.options.getString('type') ?? 'ventes';
  const limite = interaction.options.getInteger('limite') ?? 10;

  let rows, title, lines;

  if (type === 'ventes') {
    rows = db.prepare(`
      SELECT id, date, article, categorie, prix_achat, prix_vente, quantite, promo_pourcent, canal_vente
      FROM ventes ORDER BY created_at DESC LIMIT ?
    `).all(limite);
    title = '🛍️ Dernières ventes';
    lines = rows.map(v => {
      const pv = v.prix_vente * (1 - v.promo_pourcent / 100);
      const ben = (pv - v.prix_achat) * v.quantite;
      return `**#${v.id}** ${v.date} — **${v.article}** ×${v.quantite} — Achat: ${formatEuro(v.prix_achat)} | Vente: ${formatEuro(pv)}${v.promo_pourcent > 0 ? ` (-${v.promo_pourcent}%)` : ''} | Bén: ${formatEuro(ben)}`;
    });
  } else if (type === 'retours') {
    rows = db.prepare(`SELECT * FROM retours ORDER BY created_at DESC LIMIT ?`).all(limite);
    title = '↩️ Derniers retours';
    lines = rows.map(r => `**#${r.id}** ${r.date} — **${r.article}** — Remboursé: ${formatEuro(r.remboursement)} — ${r.motif}`);
  } else if (type === 'trajets') {
    rows = db.prepare(`SELECT * FROM trajets ORDER BY created_at DESC LIMIT ?`).all(limite);
    title = '🚗 Derniers trajets';
    lines = rows.map(t => `**#${t.id}** ${t.date} — ${t.destination} — ${t.distance_km*2} km A/R — ${t.nb_colis} colis — Coût: ${formatEuro(t.cout_total)}`);
  } else {
    rows = db.prepare(`SELECT * FROM frais_divers ORDER BY created_at DESC LIMIT ?`).all(limite);
    title = '🧾 Derniers frais';
    lines = rows.map(f => `**#${f.id}** ${f.date} — [${f.categorie}] ${f.description} — ${formatEuro(f.montant)}`);
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0x00cec9)
    .setDescription(lines.length > 0 ? lines.join('\n') : 'Aucune entrée.')
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
