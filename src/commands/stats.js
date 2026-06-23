import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { getStatsGlobales, getMeilleuresVentes, getStatsParMois, formatEuro, formatPct, nomMois } from '../utils/stats.js';
import { genererGraphiqueCA, genererGraphiqueMeilleuresVentes } from '../utils/charts.js';

const PERIODES = {
  aujourd_hui: () => {
    const d = new Date().toISOString().split('T')[0];
    return [d, d];
  },
  cette_semaine: () => {
    const now = new Date();
    const debut = new Date(now);
    debut.setDate(now.getDate() - now.getDay() + 1);
    return [debut.toISOString().split('T')[0], now.toISOString().split('T')[0]];
  },
  ce_mois: () => {
    const now = new Date();
    return [`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, now.toISOString().split('T')[0]];
  },
  cette_annee: () => {
    const now = new Date();
    return [`${now.getFullYear()}-01-01`, now.toISOString().split('T')[0]];
  },
  tout: () => [null, null],
};

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Statistiques complètes de la boutique')
  .addStringOption(o => o.setName('periode').setDescription('Période').addChoices(
    { name: "Aujourd'hui", value: 'aujourd_hui' },
    { name: 'Cette semaine', value: 'cette_semaine' },
    { name: 'Ce mois', value: 'ce_mois' },
    { name: 'Cette année', value: 'cette_annee' },
    { name: 'Tout', value: 'tout' },
  ))
  .addBooleanOption(o => o.setName('graphique').setDescription('Afficher le graphique mensuel'))
  .addStringOption(o => o.setName('debut').setDescription('Date début personnalisée (AAAA-MM-JJ)'))
  .addStringOption(o => o.setName('fin').setDescription('Date fin personnalisée (AAAA-MM-JJ)'));

export async function execute(interaction) {
  await interaction.deferReply();

  const periodeKey = interaction.options.getString('periode') ?? 'ce_mois';
  const avecGraphique = interaction.options.getBoolean('graphique') ?? true;
  const debutCustom = interaction.options.getString('debut');
  const finCustom = interaction.options.getString('fin');

  let debut, fin;
  if (debutCustom && finCustom) {
    [debut, fin] = [debutCustom, finCustom];
  } else {
    [debut, fin] = PERIODES[periodeKey]?.() ?? [null, null];
  }

  const s = getStatsGlobales(debut, fin);
  const top = getMeilleuresVentes(5, debut, fin);

  const periodeLabel = debutCustom
    ? `${debut} → ${fin}`
    : { aujourd_hui: "Aujourd'hui", cette_semaine: 'Cette semaine', ce_mois: 'Ce mois', cette_annee: 'Cette année', tout: 'Tout' }[periodeKey];

  const marge_nette = s.ca_net > 0 ? (s.benefice_net / s.ca_net * 100) : 0;

  const embed = new EmbedBuilder()
    .setTitle('📊 Statistiques Boutique')
    .setColor(0xb46fff)
    .setDescription(`**Période : ${periodeLabel}**`)
    .addFields(
      // CA & ventes
      { name: '─── 💼 VENTES ───────────────', value: '​' },
      { name: '📈 CA brut', value: formatEuro(s.ca_brut), inline: true },
      { name: '↩️ Retours', value: `-${formatEuro(s.total_remboursements)}`, inline: true },
      { name: '💰 CA net', value: formatEuro(s.ca_net), inline: true },
      { name: '🛍️ Nb ventes', value: s.nb_ventes.toString(), inline: true },
      { name: '👕 Articles vendus', value: s.nb_articles.toString(), inline: true },
      { name: '🛒 Panier moyen', value: formatEuro(s.panier_moyen), inline: true },
      { name: '📊 Marge brute moyenne', value: formatPct(s.marge_moyenne), inline: true },
      { name: '↩️ Taux de retour', value: formatPct(s.taux_retour), inline: true },
      { name: '​', value: '​', inline: true },

      // Charges
      { name: '─── 💸 CHARGES ──────────────', value: '​' },
      { name: '🏷️ Achats marchandises', value: formatEuro(s.total_achats), inline: true },
      { name: '📦 Emballages', value: formatEuro(s.total_emballages), inline: true },
      { name: '🚗 Trajets essence', value: formatEuro(s.total_trajets), inline: true },
      { name: '🧾 Frais divers', value: formatEuro(s.total_frais_divers), inline: true },
      { name: '📊 Total charges', value: formatEuro(s.total_charges), inline: true },
      { name: '​', value: '​', inline: true },

      // URSSAF
      { name: '─── 🏛️ URSSAF & FISCAL ──────', value: '​' },
      { name: '🏛️ Cotisations URSSAF (12,8%)', value: formatEuro(s.urssaf), inline: true },
      { name: '📚 Formation pro (0,1%)', value: formatEuro(s.cfp), inline: true },
      { name: '📋 Total cotisations', value: formatEuro(s.total_cotisations), inline: true },
      { name: '📉 Revenu imposable (abat. 71%)', value: formatEuro(s.revenu_imposable), inline: true },
      { name: '​', value: '​', inline: true },
      { name: '​', value: '​', inline: true },

      // Résultat
      { name: '─── ✨ RÉSULTAT NET ──────────', value: '​' },
      {
        name: s.benefice_net >= 0 ? '✅ Bénéfice net' : '❌ Perte nette',
        value: `**${formatEuro(s.benefice_net)}**`,
        inline: true,
      },
      { name: '📐 Marge nette', value: formatPct(marge_nette), inline: true },
      { name: '​', value: '​', inline: true },
    )
    .setTimestamp();

  // Top 5 articles
  if (top.length > 0) {
    const topText = top.map((v, i) =>
      `**${i + 1}.** ${v.article} — ${formatEuro(v.benefice)} bén. (marge ${v.marge_pct}%) × ${v.qte_vendue} vendus`
    ).join('\n');
    embed.addFields({ name: '🏆 Top 5 articles', value: topText });
  }

  const files = [];
  if (avecGraphique) {
    try {
      const annee = new Date().getFullYear().toString();
      const { getStatsParMois: getM } = await import('../utils/stats.js');
      const parMois = getM(annee);
      if (parMois.length > 0) {
        const buffer = await genererGraphiqueCA(parMois);
        const attachment = new AttachmentBuilder(buffer, { name: 'stats.png' });
        files.push(attachment);
        embed.setImage('attachment://stats.png');
      }
    } catch (e) {
      // graphique optionnel
    }
  }

  await interaction.editReply({ embeds: [embed], files });
}
