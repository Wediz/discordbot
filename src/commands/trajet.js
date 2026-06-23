import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database.js';
import { formatEuro } from '../utils/stats.js';

export const data = new SlashCommandBuilder()
  .setName('trajet')
  .setDescription('Enregistrer un trajet pour déposer des colis')
  .addNumberOption(o => o.setName('distance_km').setDescription('Distance aller simple en km').setRequired(true))
  .addNumberOption(o => o.setName('prix_essence').setDescription('Prix de l\'essence au litre (€)').setRequired(true))
  .addNumberOption(o => o.setName('consommation').setDescription('Consommation du véhicule aux 100km').setRequired(true))
  .addIntegerOption(o => o.setName('nb_colis').setDescription('Nombre de colis déposés'))
  .addStringOption(o => o.setName('destination').setDescription('Destination (défaut: La Poste)'))
  .addStringOption(o => o.setName('date').setDescription('Date (AAAA-MM-JJ)'));

export async function execute(interaction) {
  const distance_km = interaction.options.getNumber('distance_km');
  const prix_essence = interaction.options.getNumber('prix_essence');
  const consommation = interaction.options.getNumber('consommation');
  const nb_colis = interaction.options.getInteger('nb_colis') ?? 1;
  const destination = interaction.options.getString('destination') ?? 'La Poste';
  const date = interaction.options.getString('date') ?? new Date().toISOString().split('T')[0];

  const distance_ar = distance_km * 2;
  const litres_utilises = (distance_ar * consommation) / 100;
  const cout_total = litres_utilises * prix_essence;
  const cout_par_colis = cout_total / nb_colis;

  db.prepare(`
    INSERT INTO trajets (date, destination, distance_km, prix_essence_litre, consommation_100km, nb_colis)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(date, destination, distance_km, prix_essence, consommation, nb_colis);

  const embed = new EmbedBuilder()
    .setTitle('🚗 Trajet enregistré')
    .setColor(0x74b9ff)
    .addFields(
      { name: '📍 Destination', value: destination, inline: true },
      { name: '📦 Nb colis', value: nb_colis.toString(), inline: true },
      { name: '📅 Date', value: date, inline: true },
      { name: '📏 Distance A/R', value: `${distance_ar} km`, inline: true },
      { name: '⛽ Prix essence', value: `${prix_essence} €/L`, inline: true },
      { name: '🚙 Conso', value: `${consommation} L/100km`, inline: true },
      { name: '🛢️ Litres consommés', value: `${litres_utilises.toFixed(2)} L`, inline: true },
      { name: '💰 Coût total', value: formatEuro(cout_total), inline: true },
      { name: '📦 Coût / colis', value: formatEuro(cout_par_colis), inline: true },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
