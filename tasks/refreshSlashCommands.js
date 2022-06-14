const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

module.exports = async (client) => {
  try {
		const commands = [];
		const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const command = require(`../commands/${file}`);
			commands.push(command.data.toJSON());
		}

		const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

		client.log(`Started refreshing application <${client.user.id}> (/) commands.`);

		await rest.put(
			Routes.applicationCommands(client.user.id),
			{ body: commands },
		);

		client.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		client.error(error);
	}
}
