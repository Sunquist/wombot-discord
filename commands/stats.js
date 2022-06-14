const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const commandConfig = {
  command: "stats",
  commandAlts: [ "s" ],
  description: "Fetches given players faceit stats.",
  help: "elo :nickname* :filters",
}

const getMessage = async (client, nickname, filters, message) => {
  try {
    let depth = filters.depth || 30;

    if(filters.days && depth === 30){
      depth = filters.days * 30;
    }

    if(filters.map && depth === 30){
      depth = 15000;
    }

    const user = await client.Faceit.GetUser(nickname);

    let matches = await client.Faceit.GetLatestMatches(user.id, depth, 0);

    if(filters.days){
      let timepoint = new Date(Date.now());

      if(timepoint.getUTCHours() < 5){
        timepoint.setUTCDate(timepoint.getUTCDate() - 1);
      }

      timepoint.setUTCHours(5);
      timepoint.setUTCMinutes(0);
      timepoint.setUTCSeconds(0);
      timepoint.setUTCMilliseconds(1);
      timepoint.setUTCDate(timepoint.getUTCDate() - (filters.days - 1));

      matches = matches.filter((match) => new Date(match.date).valueOf() > timepoint.valueOf())
      if(matches.length < 1){
        throw({
          message: `Found no matches within the last ${filters.days} days.`
        })
      }
    }

    if(filters.map){
      const originalLength = (matches)? matches.length : 0;
      matches = matches.filter((match) => match.i1.toLowerCase() === filters.map.toLowerCase())
      if(!matches || matches.length < 1){
        throw({
          message: `There are no matches with the filter map ${filters.map} within the players last ${originalLength} matches.`
        })
      }
    }

    const stats = await client.Faceit.Methods.MapStats(matches);
    const statsReq = await client.Faceit.GetStats(user.id);
    const lifeTimeMatches = statsReq.lifetime.m1

    if(matches.length < 1){
      throw({
        message: `No matches found.`
      })
    }

    const peakElo = (user.games.csgo.faceit_elo > stats.peakElo)? user.games.csgo.faceit_elo : stats.peakElo;

    const embed = (!filters.map)? new MessageEmbed()
      .setAuthor({ name: nickname, iconURL: client.Faceit.Methods.GetWombotFaceitIcon(user.games.csgo.skill_level), url: `https://www.faceit.com/en/players/${nickname}` })
      .setThumbnail(user.avatar)
      .addFields(
       { name: "Matches", value: `${lifeTimeMatches}`, inline: true},
       { name: "Elo Points", value: `${user.games.csgo.faceit_elo}`, inline: true},
       { name: "Peak Elo", value: `${peakElo || user.games.csgo.faceit_elo}`, inline: true},
       { name: "Avg win", value: stats.win, inline: true},
       { name: "Kills / HS", value: `${stats.avg} / ${stats.hs}`, inline: true},
       { name: "KD / KR", value: `${stats.kd} / ${stats.kr}`, inline: true},
       { name: "Favourite maps", value: stats.maps.slice(0,3).map((row, index) => {
          return `${index + 1}. ${row.map} [Matches: ${row.matches}, Wins: ${row.wins}, KR: ${row.kr}]`
        }).join("\n")}
       ).setFooter({text: (filters.days)?
         `Statistics based on ${stats.sampleSize} matches in the last ${filters.days} days, including peak elo.`
         :
         `Statistics based on the last ${stats.sampleSize} matches, including peak elo.`
       }) :
       new MessageEmbed()
         .setAuthor({ name: nickname, iconURL: client.Faceit.Methods.GetWombotFaceitIcon(user.games.csgo.skill_level), url: `https://www.faceit.com/en/players/${nickname}` })
         .setThumbnail(user.avatar)
         .addFields(
           { name: "Matches", value: `${lifeTimeMatches}`, inline: true},
           { name: "Elo Points", value: `${user.games.csgo.faceit_elo}`, inline: true},
           { name: "Wins / Matches", value: `${stats.maps[0].wins} / ${stats.sampleSize}`, inline: true},
           { name: "Avg win", value: stats.win, inline: true},
           { name: "Kills / HS", value: `${stats.avg} / ${stats.hs}`, inline: true},
           { name: "KD / KR", value: `${stats.kd} / ${stats.kr}`, inline: true},
         ).setFooter({text:(filters.days)?
           `Based on ${stats.sampleSize} matches in the last ${filters.days} days on ${filters.map}.`
           :
           `Statistics based on the last ${stats.sampleSize} matches on ${filters.map}.`
         });
    return { embeds: [embed], ephemeral: false };
  }catch(Ex){
    console.log(Ex);

    client.error(`(COMMAND_STATS): ${Ex.message || "Unknown exception"}`)

    if(Ex.message)
      return Ex.message

    return "Unknown exception"
  }
}

module.exports = {
  commandConfig,
  chat: async (client, message) => {
    const messageParts = message.content.split(" ");

    if(messageParts.length < 3)
      return await message.reply("Missing required argument :nickname");

    filters = messageParts.slice(3)

    let filter = {}

    filters.forEach((f) => {
      if(f.includes("de_") || f.includes("WORKSHOP") || f.includes("DE_")){
        filter.map = f;
      }else if(f.includes("d")){
        filter.days = parseInt(f.replace("d", ""));
      } else {
        filter.depth = parseInt(f);
      }
    })

    const nickname = messageParts[2];

    return await message.reply(await getMessage(client, nickname, filter, message));
  },
	data: new SlashCommandBuilder()
		.setName(commandConfig.command)
		.setDescription(commandConfig.description)
    .addStringOption(option =>
  		option.setName('nickname')
  			.setDescription('Faceit nickname')
  			.setRequired(true))
    .addIntegerOption(option =>
  		option.setName('matches')
  			.setDescription('Number of matches to fetch from history')
  			.setRequired(false))
    .addStringOption(option =>
  		option.setName('map')
  			.setDescription('Specific map')
  			.setRequired(false))
    .addIntegerOption(option =>
  		option.setName('days')
  			.setDescription('Number of days to fetch from history')
  			.setRequired(false))
  ,async execute(client, interaction) {
    const message = await interaction.deferReply();

    const nickname = interaction.options.get("nickname");
    const matches = interaction.options.get("matches");
    const map = interaction.options.get("map");
    const days = interaction.options.get("days");

    let filters = {};

    if(matches)
      filters = {...filters, depth: matches.value}
    if(map)
      filters = {...filters, map: map.value}
    if(days)
      filters = {...filters, days: days.value}

		return await interaction.editReply(await getMessage(client, nickname.value, filters, message));
	},
};
