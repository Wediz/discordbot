import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getStockEmballages, getCoutEmballageParColis, formatEuro } from '../utils/stats.js';

export const data = new SlashCommandBuilder()
  .setName('stock')
  .setDescription('Voir le stock d\'emballages et les coûts associés');

export async function execute(interaction) {
  const stock = getStockEmballages();
  const couts = getCoutEmballageParColis();

  const embed = new EmbedBuilder()
    .setTitle('📦 Stock Emballages')
    .setColor(0xf9b44a)
    .setTimestamp();

  if (stock.length === 0) {
    embed.setDescription('Aucun emballage en stock. Utilisez `/emballage` pour en ajouter.');
  } else {
    const lines = stock.map(e =>
      `**${e.type}** — ${e.stock_restant} unités — ${formatEuro(e.prix_unitaire)}/unité — Valeur: ${formatEuro(e.valeur_stock)}`
    ).join('\n');
    embed.addFields({ name: '🗃️ Stock actuel', value: lines });
  }

  if (couts.length > 0) {
    const coutsLines = couts.map(c =>
      `**${c.type}** — ${c.total_utilise} utilisés — ${formatEuro(c.prix_unitaire)}/unité — Total dépensé: ${formatEuro(c.cout_total)}`
    ).join('\n');
    embed.addFields({ name: '📊 Utilisation historique', value: coutsLines });
  }

  await interaction.reply({ embeds: [embed] });
}
