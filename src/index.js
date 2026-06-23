import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import * as vente from './commands/vente.js';
import * as emballage from './commands/emballage.js';
import * as retour from './commands/retour.js';
import * as trajet from './commands/trajet.js';
import * as frais from './commands/frais.js';
import * as stats from './commands/stats.js';
import * as fiscal from './commands/fiscal.js';
import * as stock from './commands/stock_emballage.js';
import * as top from './commands/top.js';
import * as historique from './commands/historique.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commands = [vente, emballage, retour, trajet, frais, stats, fiscal, stock, top, historique];
for (const cmd of commands) {
  client.commands.set(cmd.data.name, cmd);
}

client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  client.user.setActivity('la boutique 👗', { type: 3 });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Erreur commande ${interaction.commandName}:`, error);
    const msg = { content: '❌ Une erreur est survenue.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
