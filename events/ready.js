const SlashCommands = require('../tasks/refreshSlashCommands.js');
const Config = require('../config');

module.exports = {
	name: 'ready',
	once: true,
	execute(args) {
    const [ client ] = args;
		client.log(`[Discord - Wombot]: Logged in as <${client.user.id}> ${client.user.tag}`);

    if(Config.discord.refreshCommands)
      SlashCommands(client)
	},
};
