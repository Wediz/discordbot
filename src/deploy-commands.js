import 'dotenv/config';
import { REST, Routes } from 'discord.js';
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

const commands = [vente, emballage, retour, trajet, frais, stats, fiscal, stock, top, historique]
  .map(c => c.data.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('⏳ Déploiement des slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log('✅ Slash commands déployées avec succès !');
  } catch (error) {
    console.error(error);
  }
})();
