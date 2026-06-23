import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database.js';
import { formatEuro } from '../utils/stats.js';

export const data = new SlashCommandBuilder()
  .setName('vente')
  .setDescription('Enregistrer une vente')
  .addStringOption(o => o.setName('article').setDescription('Nom de l\'article').setRequired(true))
  .addNumberOption(o => o.setName('prix_achat').setDescription('Prix d\'achat (€)').setRequired(true))
  .addNumberOption(o => o.setName('prix_vente').setDescription('Prix de vente (€)').setRequired(true))
  .addIntegerOption(o => o.setName('quantite').setDescription('Quantité (défaut: 1)'))
  .addNumberOption(o => o.setName('promo').setDescription('Remise en % (ex: 10 pour -10%)'))
  .addStringOption(o => o.setName('categorie').setDescription('Catégorie').addChoices(
    { name: 'Haut', value: 'haut' },
    { name: 'Bas / Jupe / Pantalon', value: 'bas' },
    { name: 'Robe', value: 'robe' },
    { name: 'Veste / Manteau', value: 'veste' },
    { name: 'Accessoire', value: 'accessoire' },
    { name: 'Ensemble', value: 'ensemble' },
    { name: 'Autre', value: 'autre' },
  ))
  .addStringOption(o => o.setName('canal').setDescription('Canal de vente').addChoices(
    { name: 'Instagram', value: 'instagram' },
    { name: 'Vinted', value: 'vinted' },
    { name: 'Site web', value: 'site' },
    { name: 'Présentiel', value: 'presentiel' },
    { name: 'Autre', value: 'autre' },
  ))
  .addStringOption(o => o.setName('emballage').setDescription('Type d\'emballage utilisé (ex: pochette,scotch)'))
  .addStringOption(o => o.setName('notes').setDescription('Notes libres'))
  .addStringOption(o => o.setName('date').setDescription('Date (AAAA-MM-JJ, défaut: aujourd\'hui)'));

export async function execute(interaction) {
  const article = interaction.options.getString('article');
  const prix_achat = interaction.options.getNumber('prix_achat');
  const prix_vente = interaction.options.getNumber('prix_vente');
  const quantite = interaction.options.getInteger('quantite') ?? 1;
  const promo = interaction.options.getNumber('promo') ?? 0;
  const categorie = interaction.options.getString('categorie') ?? 'autre';
  const canal = interaction.options.getString('canal') ?? 'instagram';
  const notes = interaction.options.getString('notes') ?? null;
  const emballageStr = interaction.options.getString('emballage');
  const date = interaction.options.getString('date') ?? new Date().toISOString().split('T')[0];

  const prix_vente_reel = prix_vente * (1 - promo / 100);
  const benefice_brut = (prix_vente_reel - prix_achat) * quantite;
  const marge = ((prix_vente_reel - prix_achat) / prix_vente_reel * 100);

  const stmt = db.prepare(`
    INSERT INTO ventes (date, article, categorie, prix_achat, prix_vente, quantite, promo_pourcent, canal_vente, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(date, article, categorie, prix_achat, prix_vente, quantite, promo, canal, notes);
  const venteId = result.lastInsertRowid;

  // Associer les emballages si précisés
  let coutEmballage = 0;
  let lignesEmballage = [];
  if (emballageStr) {
    const types = emballageStr.split(',').map(s => s.trim().toLowerCase());
    for (const type of types) {
      const emb = db.prepare(`
        SELECT * FROM emballages WHERE LOWER(type) LIKE ? AND stock_restant > 0 ORDER BY created_at DESC LIMIT 1
      `).get(`%${type}%`);
      if (emb) {
        const cout = emb.prix_unitaire;
        db.prepare(`INSERT INTO frais_emballage_vente (vente_id, emballage_id, quantite_utilisee, cout) VALUES (?, ?, 1, ?)`).run(venteId, emb.id, cout);
        db.prepare(`UPDATE emballages SET stock_restant = stock_restant - 1 WHERE id = ?`).run(emb.id);
        coutEmballage += cout;
        lignesEmballage.push(`${emb.type} (${formatEuro(cout)})`);
      }
    }
  }

  const benefice_net = benefice_brut - coutEmballage;
  const couleur = benefice_net >= 0 ? 0x50dc9f : 0xff6b6b;

  const embed = new EmbedBuilder()
    .setTitle('✅ Vente enregistrée')
    .setColor(couleur)
    .setDescription(`**${article}** × ${quantite}${promo > 0 ? ` — Promo -${promo}%` : ''}`)
    .addFields(
      { name: '💰 Prix achat', value: formatEuro(prix_achat), inline: true },
      { name: '🏷️ Prix vente', value: `${formatEuro(prix_vente_reel)}${promo > 0 ? ` *(${formatEuro(prix_vente)} - ${promo}%)*` : ''}`, inline: true },
      { name: '📊 Marge', value: `${marge.toFixed(1)}%`, inline: true },
      { name: '💵 Bénéfice brut', value: formatEuro(benefice_brut), inline: true },
      { name: '📦 Emballage', value: lignesEmballage.length ? lignesEmballage.join(', ') : '—', inline: true },
      { name: '✨ Bénéfice net', value: formatEuro(benefice_net), inline: true },
      { name: '📁 Catégorie', value: categorie, inline: true },
      { name: '🛒 Canal', value: canal, inline: true },
      { name: '📅 Date', value: date, inline: true },
    )
    .setFooter({ text: `ID vente: #${venteId}` })
    .setTimestamp();

  if (notes) embed.addFields({ name: '📝 Notes', value: notes });

  await interaction.reply({ embeds: [embed] });
}
