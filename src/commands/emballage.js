import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database.js';
import { formatEuro } from '../utils/stats.js';

export const data = new SlashCommandBuilder()
  .setName('emballage')
  .setDescription('Enregistrer un achat d\'emballage ou matériel')
  .addStringOption(o => o.setName('type').setDescription('Type (ex: pochette, scotch, papier cadeau, enveloppe...)').setRequired(true))
  .addIntegerOption(o => o.setName('quantite').setDescription('Quantité achetée').setRequired(true))
  .addNumberOption(o => o.setName('prix_total').setDescription('Prix total payé (€)').setRequired(true))
  .addStringOption(o => o.setName('date').setDescription('Date (AAAA-MM-JJ)'));

export async function execute(interaction) {
  const type = interaction.options.getString('type');
  const quantite = interaction.options.getInteger('quantite');
  const prix_total = interaction.options.getNumber('prix_total');
  const date = interaction.options.getString('date') ?? new Date().toISOString().split('T')[0];

  const prix_unitaire = prix_total / quantite;

  const result = db.prepare(`
    INSERT INTO emballages (date, type, quantite_achetee, prix_total, stock_restant)
    VALUES (?, ?, ?, ?, ?)
  `).run(date, type, quantite, prix_total, quantite);

  const embed = new EmbedBuilder()
    .setTitle('📦 Emballage enregistré')
    .setColor(0xf9b44a)
    .addFields(
      { name: '🏷️ Type', value: type, inline: true },
      { name: '🔢 Quantité', value: quantite.toString(), inline: true },
      { name: '💰 Prix total', value: formatEuro(prix_total), inline: true },
      { name: '📐 Prix unitaire', value: formatEuro(prix_unitaire), inline: true },
      { name: '📦 Stock restant', value: quantite.toString(), inline: true },
      { name: '📅 Date', value: date, inline: true },
    )
    .setDescription(`**${quantite} ${type}** achetés — coûte **${formatEuro(prix_unitaire)}** l'unité\nEt sera déduit automatiquement à chaque vente qui l'utilise.`)
    .setFooter({ text: `ID: #${result.lastInsertRowid}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
