import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { getMeilleuresVentes, formatEuro } from '../utils/stats.js';
import { genererGraphiqueMeilleuresVentes } from '../utils/charts.js';

export const data = new SlashCommandBuilder()
  .setName('top')
  .setDescription('Top des meilleures ventes')
  .addIntegerOption(o => o.setName('limite').setDescription('Nombre d\'articles à afficher (défaut: 10)'))
  .addStringOption(o => o.setName('debut').setDescription('Date début (AAAA-MM-JJ)'))
  .addStringOption(o => o.setName('fin').setDescription('Date fin (AAAA-MM-JJ)'))
  .addBooleanOption(o => o.setName('graphique').setDescription('Afficher le graphique'));

export async function execute(interaction) {
  await interaction.deferReply();

  const limite = interaction.options.getInteger('limite') ?? 10;
  const debut = interaction.options.getString('debut');
  const fin = interaction.options.getString('fin');
  const avecGraphique = interaction.options.getBoolean('graphique') ?? true;

  const ventes = getMeilleuresVentes(limite, debut, fin);

  const embed = new EmbedBuilder()
    .setTitle(`🏆 Top ${limite} articles`)
    .setColor(0xb46fff)
    .setTimestamp();

  if (ventes.length === 0) {
    embed.setDescription('Aucune vente enregistrée pour cette période.');
  } else {
    const MEDALS = ['🥇', '🥈', '🥉'];
    const lines = ventes.map((v, i) => {
      const medal = MEDALS[i] ?? `${i + 1}.`;
      return `${medal} **${v.article}** (${v.categorie})\n` +
        `   Prix moy: ${formatEuro(v.prix_moyen)} | Bénéfice: **${formatEuro(v.benefice)}** | Marge: ${v.marge_pct}% | Qté: ×${v.qte_vendue}`;
    }).join('\n\n');
    embed.setDescription(lines);
  }

  const files = [];
  if (avecGraphique && ventes.length > 0) {
    try {
      const buffer = await genererGraphiqueMeilleuresVentes(ventes);
      const attachment = new AttachmentBuilder(buffer, { name: 'top.png' });
      files.push(attachment);
      embed.setImage('attachment://top.png');
    } catch (e) {}
  }

  await interaction.editReply({ embeds: [embed], files });
}
