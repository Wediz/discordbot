import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database.js';
import { formatEuro } from '../utils/stats.js';

export const data = new SlashCommandBuilder()
  .setName('retour')
  .setDescription('Enregistrer un retour client')
  .addStringOption(o => o.setName('article').setDescription('Nom de l\'article retourné').setRequired(true))
  .addNumberOption(o => o.setName('prix_vente').setDescription('Prix auquel il avait été vendu (€)').setRequired(true))
  .addNumberOption(o => o.setName('remboursement').setDescription('Montant remboursé (€)').setRequired(true))
  .addStringOption(o => o.setName('motif').setDescription('Motif du retour'))
  .addIntegerOption(o => o.setName('vente_id').setDescription('ID de la vente originale (optionnel)'))
  .addStringOption(o => o.setName('date').setDescription('Date (AAAA-MM-JJ)'));

export async function execute(interaction) {
  const article = interaction.options.getString('article');
  const prix_vente = interaction.options.getNumber('prix_vente');
  const remboursement = interaction.options.getNumber('remboursement');
  const motif = interaction.options.getString('motif') ?? 'Non précisé';
  const vente_id = interaction.options.getInteger('vente_id') ?? null;
  const date = interaction.options.getString('date') ?? new Date().toISOString().split('T')[0];

  const perte = remboursement;

  db.prepare(`
    INSERT INTO retours (vente_id, date, article, prix_vente, motif, remboursement)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(vente_id, date, article, prix_vente, motif, remboursement);

  const embed = new EmbedBuilder()
    .setTitle('↩️ Retour enregistré')
    .setColor(0xff6b6b)
    .addFields(
      { name: '🧥 Article', value: article, inline: true },
      { name: '💰 Prix de vente', value: formatEuro(prix_vente), inline: true },
      { name: '💸 Remboursé', value: formatEuro(remboursement), inline: true },
      { name: '📉 Impact sur CA', value: `-${formatEuro(perte)}`, inline: true },
      { name: '❓ Motif', value: motif, inline: true },
      { name: '📅 Date', value: date, inline: true },
    )
    .setTimestamp();

  if (vente_id) embed.setFooter({ text: `Liée à la vente #${vente_id}` });

  await interaction.reply({ embeds: [embed] });
}
