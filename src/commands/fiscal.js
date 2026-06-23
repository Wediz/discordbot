import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getStatsGlobales, formatEuro, formatPct } from '../utils/stats.js';

// Tranches IR 2024
const TRANCHES_IR = [
  { limite: 11294, taux: 0 },
  { limite: 28797, taux: 0.11 },
  { limite: 82341, taux: 0.30 },
  { limite: 177106, taux: 0.41 },
  { limite: Infinity, taux: 0.45 },
];

function calculIR(revenuImposable) {
  let impot = 0;
  let precedent = 0;
  for (const tranche of TRANCHES_IR) {
    const trancheMontant = Math.min(revenuImposable, tranche.limite) - precedent;
    if (trancheMontant <= 0) break;
    impot += trancheMontant * tranche.taux;
    precedent = tranche.limite;
  }
  return impot;
}

export const data = new SlashCommandBuilder()
  .setName('fiscal')
  .setDescription('Résumé fiscal et URSSAF pour la déclaration')
  .addIntegerOption(o => o.setName('annee').setDescription('Année fiscale (défaut: année en cours)'))
  .addNumberOption(o => o.setName('autres_revenus').setDescription('Autres revenus du foyer (€) pour estimer l\'IR'));

export async function execute(interaction) {
  const annee = interaction.options.getInteger('annee') ?? new Date().getFullYear();
  const autresRevenus = interaction.options.getNumber('autres_revenus') ?? 0;

  const debut = `${annee}-01-01`;
  const fin = `${annee}-12-31`;
  const s = getStatsGlobales(debut, fin);

  const irEstime = calculIR(s.revenu_imposable + autresRevenus) - calculIR(autresRevenus);

  // Seuils micro-entreprise 2024
  const SEUIL_TVA = 91900;
  const SEUIL_MICRO = 188700;
  const depasseSeuil = s.ca_net > SEUIL_MICRO;
  const approcheTVA = s.ca_net > SEUIL_TVA * 0.9;

  const embed = new EmbedBuilder()
    .setTitle(`🏛️ Bilan Fiscal ${annee}`)
    .setColor(0x6c5ce7)
    .addFields(
      { name: '─── 📋 DÉCLARATION URSSAF ───', value: '​' },
      { name: '💰 CA à déclarer', value: formatEuro(s.ca_net), inline: true },
      { name: '🏛️ Cotisations URSSAF (12,8%)', value: formatEuro(s.urssaf), inline: true },
      { name: '📚 CFP (0,1%)', value: formatEuro(s.cfp), inline: true },
      { name: '📊 Total cotisations', value: formatEuro(s.total_cotisations), inline: true },
      { name: '📅 Trimestres', value: formatEuro(s.total_cotisations / 4) + ' / trimestre', inline: true },
      { name: '​', value: '​', inline: true },

      { name: '─── 💶 DÉCLARATION IMPÔTS ───', value: '​' },
      { name: '📉 Abattement forfaitaire 71%', value: formatEuro(s.ca_net * 0.71), inline: true },
      { name: '📊 Revenu imposable boutique', value: formatEuro(s.revenu_imposable), inline: true },
      { name: '​', value: '​', inline: true },
      ...(autresRevenus > 0 ? [
        { name: '🏠 Autres revenus déclarés', value: formatEuro(autresRevenus), inline: true },
        { name: '📈 Revenu total imposable', value: formatEuro(s.revenu_imposable + autresRevenus), inline: true },
        { name: '💸 IR estimé sur boutique', value: `~${formatEuro(irEstime)}`, inline: true },
      ] : []),

      { name: '─── ⚠️ SEUILS ───────────────', value: '​' },
      {
        name: '📊 Seuil franchise TVA (91 900 €)',
        value: s.ca_net > SEUIL_TVA
          ? `⚠️ **DÉPASSÉ** (+${formatEuro(s.ca_net - SEUIL_TVA)})`
          : approcheTVA
          ? `⚡ Attention : ${formatPct((s.ca_net / SEUIL_TVA) * 100)} du seuil atteint`
          : `✅ ${formatEuro(SEUIL_TVA - s.ca_net)} restants`,
        inline: false,
      },
      {
        name: '📊 Seuil micro-entreprise (188 700 €)',
        value: depasseSeuil
          ? `🚨 **DÉPASSÉ** — passage en entreprise individuelle requis`
          : `✅ ${formatEuro(SEUIL_MICRO - s.ca_net)} restants`,
        inline: false,
      },

      { name: '─── ✨ RÉSULTAT RÉEL ─────────', value: '​' },
      { name: '💵 Bénéfice net (après charges + cotisations)', value: `**${formatEuro(s.benefice_net)}**`, inline: true },
      { name: '📐 Marge nette', value: formatPct(s.ca_net > 0 ? s.benefice_net / s.ca_net * 100 : 0), inline: true },
    )
    .setFooter({ text: 'Estimations basées sur les taux 2024 micro-entreprise vente de marchandises' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
