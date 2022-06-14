const WIN_WEIGHT = 3;
const LOOSE_WEIGHT = 1;
const KR_WEIGHT = 4;

const TEAMKRWEIGHT = 500;
const TEAMELOWEIGHT = 500;

module.exports = class Methods {
  constructor(faceit) {
    this.faceit = faceit;
  }

  async EloChange (nickname, depth) {
    const user = await this.faceit.GetUser(nickname);
    const latestMatches = await this.faceit.GetLatestMatches(user.id, (depth)? 2000 : 50, 0);
    const elo = (user && user.games && user.games.csgo)? user.games.csgo.faceit_elo : 0;

    let timepoint = new Date(Date.now());

    if(timepoint.getUTCHours() < 5){// If clock is between 00 -> 05 UTC
      timepoint.setUTCDate(timepoint.getUTCDate() - 1);
    }

    timepoint.setUTCHours(5);
    timepoint.setUTCMinutes(0);
    timepoint.setUTCSeconds(0);
    timepoint.setUTCMilliseconds(1);

    if(depth){
      timepoint.setUTCDate(timepoint.getUTCDate() - (depth - 1));
    }

    const peakElo = {
      elo: elo || 0,
      date: Date.now()
    }

    latestMatches.forEach((row) => {
      if(row.elo && row.elo > peakElo.elo){
        peakElo.elo = row.elo;
        peakElo.date = row.date;
      }
    })

    const recentMatch = latestMatches.filter((row) => row.elo != undefined).find((row) => timepoint.valueOf() > new Date(row.date).valueOf())
    if(!recentMatch){
      throw({
        status: 400,
        code: "NOT_OLD_ENOUGH_MATCHES",
        message: `Could not retreive old enough data. Try again with a smaller timerange.`
      })
    }

    const eloChange = parseInt(elo) - parseInt(recentMatch.elo);
    const eloChangeString = (eloChange > 0)? `+${eloChange}` : `${eloChange}`;

    return {
      elo,
      eloChange,
      eloChangeString,
      peakElo,
      timepoint: timepoint.toISOString(),
    }
  }

  MapStats (matches) {
    const stats = {
      kills: 0,
      deaths: 0,
      headshots: 0,
      rounds: 0,
      wins: 0,
      mvps: 0,
      assists: 0,
      peakElo: 0,
    };

    let highestKR = 0;
    let highestElo = 0;
    let maps = [];

    matches.forEach((match) => {
      const kr = Math.round((parseInt(match.i6) / parseInt(match.i12)) * 100) / 100;
      const elo = (match.elo)? (typeof match.elo === "string")? parseInt(match.elo) : match.elo : 0;
      if(highestKR < kr){
        highestKR = kr;
      }
      if(elo > highestElo){
        highestElo = elo;
      }
    });

    matches.forEach((match) => {
      stats.kills += parseInt(match.i6)
      stats.assists += parseInt(match.i7)
      stats.deaths += parseInt(match.i8)
      stats.headshots += parseInt(match.i13)
      stats.mvps += parseInt(match.i9)
      stats.rounds += parseInt(match.i12)
      stats.wins += (match.teamId === match.i2)? 1 : 0
      stats.peakElo = (match.elo && (stats.peakElo < match.elo))? match.elo : stats.peakElo;

      const map = maps.find(row => row.map == match.i1);

      if(map){
        maps = maps.map(row => {
          if(row.map == match.i1){
            const kr = Math.round((parseInt(match.i6) / parseInt(match.i12)) * 100) / 100

            const winWeight = (parseInt(match.i10) > 0)? map.weight + WIN_WEIGHT : map.weight + LOOSE_WEIGHT
            const krWeight = (KR_WEIGHT * kr)
            const performanceWeight = krWeight;

            const weight = winWeight + performanceWeight

            return {
              map: match.i1,
              wins: map.wins + parseInt(match.i10),
              matches: map.matches + 1,
              kills: map.kills + parseInt(match.i6),
              rounds: map.rounds + parseInt(match.i12),
              performanceWeight: map.performanceWeight + performanceWeight,
              weight
            }
          }
          return row
        }).sort((a, b) => {
          return b.weight - a.weight
        })
      }else{
        const kr = Math.round((parseInt(match.i6) / parseInt(match.i12)) * 100) / 100

        const winWeight = (parseInt(match.i10) > 0)? WIN_WEIGHT : LOOSE_WEIGHT
        const krWeight = (KR_WEIGHT * kr)
        const performanceWeight = krWeight;

        const weight = winWeight + performanceWeight

        maps = [...maps, {
          map: match.i1,
          wins: parseInt(match.i10),
          matches: 1,
          kills: parseInt(match.i6),
          rounds: parseInt(match.i12),
          performanceWeight,
          weight
        }]
      }
    });

    const fullWeight = maps.map((row) => row.weight).reduce((accumulator, currentValue) => accumulator + currentValue)

    return {
      ...stats,
      kd: parseFloat((Math.round((stats.kills / stats.deaths) * 100) / 100).toFixed(2)),
      kr: parseFloat((Math.round((stats.kills / stats.rounds) * 100) / 100).toFixed(2)),
      hs: Math.round((stats.headshots / stats.kills) * 100).toFixed(0) + "%",
      win: (stats.wins / matches.length * 100).toFixed(0) + "%",
      avg: Math.round(stats.kills / matches.length),
      sampleSize: matches.length,
      maps: maps.map((row) => {
        return {...row,
          kr: (Math.round((row.kills / row.rounds) * 100) / 100).toFixed(2),
          weightPercent: row.weight / fullWeight,
          weightPercentText: `${Math.round((row.weight / fullWeight) * 100)}%`
        }
      }).sort((a, b) => b.weightPercent - a.weightPercent),
    };
  };

  GetLevelSVG (level) {
    return `https://cdn-frontend.faceit.com/web/960/src/app/assets/images-compress/skill-icons/skill_level_${level}_svg.svg`
  };

  GetWombotFaceitIcon (level) {
    return `https://wombot.fi/resources/level${(level === 10)? "max" : level}.png`
  }
}
