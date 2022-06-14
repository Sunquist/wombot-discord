require('dotenv').config();

const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');

const Faceit = require('./utils/faceit');
const Logger = require('./utils/logger');
const Config = require('./config');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.commands = new Collection();

client.log = (message, level) => Logger(message, level);
client.error = (message) => Logger(message, 3);

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	client.log(`Listening for event ${event.name}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute([client, ...args]));
	} else {
		client.on(event.name, (...args) => event.execute([client, ...args]));
	}
}

client.Faceit = Faceit();

client.login(process.env.DISCORD_TOKEN);
