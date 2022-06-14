const shortcuts = (command) => {
  switch(command){
    case "m":
      return "match"
    case "e":
      return "elo"
    case "a":
    case "analyze":
      return "analyze"
    case "s":
      return "stats"
    case "dt":
      return "divide-teams"
    default:
      return command
  }
}

module.exports = {
	name: 'messageCreate',
	execute(args) {
		const [client, message] = args;
		if(!message.content.startsWith("w!"))
			return;

		const command = client.commands.get(shortcuts(message.content.split(" ")[1]));

    client.log(`[Discord - Wombot]: ${message.author.tag} executed ${shortcuts(message.content.split(" ")[1])}`);

		if(!command)
			return;

		command.chat(client, message)
	},
};
