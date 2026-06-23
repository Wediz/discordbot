import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database.js';
import { formatEuro } from '../utils/stats.js';

export const data = new SlashCommandBuilder()
  .setName('frais')
  .setDescription('Enregistrer un frais divers (abonnement, pub, matériel...)')
  .addStringOption(o => o.setName('description').setDescription('Description du frais').setRequired(true))
  .addNumberOption(o => o.setName('montant').setDescription('Montant (€)').setRequired(true))
  .addStringOption(o => o.setName('categorie').setDescription('Catégorie').setRequired(true).addChoices(
    { name: 'Abonnement / logiciel', value: 'abonnement' },
    { name: 'Publicité / marketing', value: 'pub' },
    { name: 'Matériel de bureau', value: 'materiel' },
    { name: 'Frais bancaires', value: 'bancaire' },
    { name: 'Formation', value: 'formation' },
    { name: 'Autre', value: 'autre' },
  ))
  .addStringOption(o => o.setName('date').setDescription('Date (AAAA-MM-JJ)'));

export async function execute(interaction) {
  const description = interaction.options.getString('description');
  const montant = interaction.options.getNumber('montant');
  const categorie = interaction.options.getString('categorie');
  const date = interaction.options.getString('date') ?? new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO frais_divers (date, categorie, description, montant)
    VALUES (?, ?, ?, ?)
  `).run(date, categorie, description, montant);

  const embed = new EmbedBuilder()
    .setTitle('🧾 Frais enregistré')
    .setColor(0xfd79a8)
    .addFields(
      { name: '📝 Description', value: description, inline: false },
      { name: '📁 Catégorie', value: categorie, inline: true },
      { name: '💰 Montant', value: formatEuro(montant), inline: true },
      { name: '📅 Date', value: date, inline: true },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
