// Load .env config
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

import tmi from 'tmi.js';
import * as schedule from './schedule';
import { appToken } from './twitch';

// Read channels to join.
const channels = process.env.CHANNELS?.split(' ') || [];

// Create Twitch chat client
const client = tmi.Client({
  options: { debug: true },
  identity: {
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
  },
  channels,
});

// Command cooldowns
const xLastUsed: { [channel: string]: number } = {};
const anarchyLastUsed: { [channel: string]: number } = {};
const turfLastUsed: { [channel: string]: number } = {};
const salmonLastUsed: { [channel: string]: number } = {};

// Handle chat messages
const rotationLength = 2 * 60 * 60 * 1000;
client.on('message', (channel, userstate, message, self) => {
  if (self) return;

  const args = message.split(' ');
  const displayName = userstate['display-name'];
  const command = args[0].toLowerCase();

  let response;
  let now = Date.now();
  let time = now;
  let when = 'Now';
  let future = false;

  // Command cooldowns.
  if (
    ((command === '!x' || command === '!xbattle') &&
      xLastUsed[channel] &&
      Date.now() - xLastUsed[channel] < 5000) ||
    (command === '!turf' &&
      turfLastUsed[channel] &&
      Date.now() - turfLastUsed[channel] < 5000) ||
    (command === '!anarchy' &&
      anarchyLastUsed[channel] &&
      Date.now() - anarchyLastUsed[channel] < 5000) ||
    (command === '!salmon' &&
      salmonLastUsed[channel] &&
      Date.now() - salmonLastUsed[channel] < 5000)
  ) {
    return;
  }

  if (
    args[1] &&
    (command === '!x' ||
      command === '!xbattle' ||
      command === '!turf' ||
      command === '!anarchy' ||
      command === '!salmon')
  ) {
    if (args[1].toLowerCase() === 'in') {
      // Look for a rotation hours ahead.
      if (args[2] && /^\d+$/.test(args[2])) {
        time += parseInt(args[2]) * 60 * 60 * 1000;
        when = `in ${args[2]} hours`;
        future = true;
      } else {
        response = `@${displayName} You need to give me a number of hours.`;
      }
    } else if (command !== '!salmon' && args[1].toLowerCase() === 'next') {
      // Look for the next rotation.
      time += rotationLength;
      when = 'Next';
    }
  }

  if (!response) {
    if (command === '!xbattle' || command === '!x') {
      xLastUsed[channel] = now;
      const xBattle = schedule.xAt(time);
      if (xBattle) {
        if (xBattle.xMatchSetting !== null) {
          const xMode = xBattle?.xMatchSetting.vsRule.name;
          const xMapA = xBattle?.xMatchSetting.vsStages[0].name;
          const xMapB = xBattle?.xMatchSetting.vsStages[1].name;
          response = `@${displayName} (${when}) X BATTLE - ${xMode} -> ${
            xMapA || '???'
          } + ${xMapB || '???'}`;
        } else {
          response = `@${displayName} X Battle is not available during Splatfest!`;
        }
      } else {
        response = `@${displayName} I couldn't find any info about that rotation, sorry.`;
      }
    } else if (command === '!turf') {
      turfLastUsed[channel] = now;
      const turf = schedule.turfAt(time);
      if (turf) {
        if (turf.regularMatchSetting !== null) {
          const turfMapA = turf?.regularMatchSetting.vsStages[0].name;
          const turfMapB = turf?.regularMatchSetting.vsStages[1].name;
          response = `@${displayName} (${when}) -> ${turfMapA || '???'} + ${
            turfMapB || '???'
          }`;
        } else {
          const fest = schedule.splatfestAt(time);
          const festMapA = fest?.festMatchSetting.vsStages[0].name;
          const festMapB = fest?.festMatchSetting.vsStages[1].name;
          response = `@${displayName} (${when}) SPLATFEST -> ${
            festMapA || '???'
          } + ${festMapB || '???'}`;
        }
      } else {
        response = `@${displayName} I couldn't find any info about that rotation, sorry.`;
      }
    } else if (command === '!anarchy') {
      anarchyLastUsed[channel] = now;
      const anarchy = schedule.anarchyAt(time);
      if (anarchy) {
        if (anarchy.bankaraMatchSettings !== null) {
          const seriesMode = anarchy?.bankaraMatchSettings[0].vsRule.name;
          const seriesMapA = anarchy?.bankaraMatchSettings[0].vsStages[0].name;
          const seriesMapB = anarchy?.bankaraMatchSettings[0].vsStages[1].name;
          const openMode = anarchy?.bankaraMatchSettings[1].vsRule.name;
          const openMapA = anarchy?.bankaraMatchSettings[1].vsStages[0].name;
          const openMapB = anarchy?.bankaraMatchSettings[1].vsStages[1].name;
          response = `@${displayName} (${when}) SERIES - ${seriesMode} -> ${
            seriesMapA || '???'
          } + ${seriesMapB || '???'} | OPEN - ${openMode} -> ${
            openMapA || '???'
          } + ${openMapB || '???'}`;
        } else if (schedule.splatfestAt(time)) {
          response = `@${displayName} Anarchy is not available during Splatfest!`;
        } else {
          response = `@${displayName} An error occurred while reading this anarchy rotation.`;
        }
      } else {
        response = `@${displayName} I couldn't find any info about that rotation, sorry.`;
      }
    } else if (command === '!salmon') {
      salmonLastUsed[channel] = Date.now();
      let salmon = schedule.salmonAt(time);
      let isBigRun = false;

      // Check for Big Run
      if (!salmon) {
        salmon = schedule.bigRunAt(time);
        if (salmon) {
          isBigRun = true;
        }
      }

      if (salmon) {
        const endTime = new Date(salmon.endTime).getTime();
        if ((args[1] && args[1].toLowerCase() === 'next') || future) {
          if (args[1].toLowerCase() === 'next') {
            salmon = schedule.salmonAt(endTime);
          }
          if (salmon) {
            const startTime = new Date(salmon.startTime).getTime();
            const timeUntil = startTime - now;
            const hoursUntil = Math.floor(timeUntil / 1000 / 60 / 60);
            const minutesUntil = Math.floor((timeUntil / 1000 / 60) % 60);
            const futureMap = salmon.setting.coopStage.name;
            const futureWeapons = salmon.setting.weapons;
            response = `@${displayName} ${
              isBigRun ? '[BIG RUN] ' : ''
            }(Opens in ${hoursUntil}h ${minutesUntil}m) - ${
              futureMap || '???'
            } -> ${futureWeapons[0].name} + ${futureWeapons[1].name} + ${
              futureWeapons[2].name
            } + ${futureWeapons[3].name}`;
          }
        } else {
          const timeLeft = endTime - time;
          const hoursLeft = Math.floor(timeLeft / 1000 / 60 / 60);
          const minutesLeft = Math.floor((timeLeft / 1000 / 60) % 60);
          const salmonMap = salmon.setting.coopStage.name;
          const salmonWeapons = salmon.setting.weapons;
          response = `@${displayName} ${
            isBigRun ? '[BIG RUN] ' : ''
          }(Closes in ${hoursLeft}h ${minutesLeft}m) - ${
            salmonMap || '???'
          } -> ${salmonWeapons[0].name} + ${salmonWeapons[1].name} + ${
            salmonWeapons[2].name
          } + ${salmonWeapons[3].name}`;
        }
      } else {
        response = `@${displayName} I couldn't find any info about that Grizzco shift, sorry.`;
      }
    }
  }

  if (response) {
    client.say(channel, response);
  }
});

// Map update timer
function tickMapUpdate(nextUpdateTime: number) {
  setTimeout(async () => {
    // Check which channels are playing Splatoon 3.
    const queryStrings: string[] = [];
    channels.forEach((channel) => {
      queryStrings.push(`user_login=${channel.toLowerCase().substring(1)}`);
    });
    const bearer = await appToken();

    let streams;
    if (queryStrings.length > 0) {
      const result = await axios.get(
        `https://api.twitch.tv/helix/streams?${queryStrings.join('&')}`,
        {
          headers: {
            Authorization: `Bearer ${bearer}`,
            'Client-Id': process.env.CLIENT_ID || '',
          },
        }
      );
      streams = result.data.data;

      // Announce map rotations in chat.
      const xBattles = schedule.xAt(nextUpdateTime);
      const anarchy = schedule.anarchyAt(nextUpdateTime);
      const turf = schedule.turfAt(nextUpdateTime);
      if (
        xBattles?.xMatchSetting &&
        anarchy?.bankaraMatchSettings &&
        turf?.regularMatchSetting
      ) {
        const xMode = xBattles.xMatchSetting.vsRule.name;
        const xMapA = xBattles.xMatchSetting.vsStages[0].name;
        const xMapB = xBattles.xMatchSetting.vsStages[1].name;
        const seriesMode = anarchy.bankaraMatchSettings[0].vsRule.name;
        const seriesMapA = anarchy.bankaraMatchSettings[0].vsStages[0].name;
        const seriesMapB = anarchy.bankaraMatchSettings[0].vsStages[1].name;
        const openMode = anarchy.bankaraMatchSettings[1].vsRule.name;
        const openMapA = anarchy.bankaraMatchSettings[1].vsStages[0].name;
        const openMapB = anarchy.bankaraMatchSettings[1].vsStages[1].name;
        const turfMapA = turf.regularMatchSetting.vsStages[0].name;
        const turfMapB = turf.regularMatchSetting.vsStages[1].name;

        streams.forEach((stream: { user_login: string; game_name: string }) => {
          if (stream.game_name === 'Splatoon 3') {
            const announcement = `Maps Updated! | X BATTLE - ${xMode} -> ${
              xMapA || '???'
            } + ${xMapB || '???'} | SERIES - ${seriesMode} -> ${
              seriesMapA || '???'
            } + ${seriesMapB || '???'} | OPEN - ${openMode} -> ${
              openMapA || '???'
            } + ${openMapB || '???'} | TURF WAR -> ${turfMapA || '???'} + ${
              turfMapB || '???'
            }`;
            client.say(stream.user_login, announcement);
          }
        });
      } else {
        const fest = schedule.splatfestAt(nextUpdateTime);
        if (fest) {
          const festMapA = fest.festMatchSetting.vsStages[0].name;
          const festMapB = fest.festMatchSetting.vsStages[1].name;

          streams.forEach(
            (stream: { user_login: string; game_name: string }) => {
              if (stream.game_name === 'Splatoon 3') {
                const announcement = `Maps Updated! | SPLATFEST -> ${
                  festMapA || '???'
                } + ${festMapB || '???'}`;
                client.say(stream.user_login, announcement);
              }
            }
          );
        }
      }
    }

    // Wait a little before pulling new map data.
    setTimeout(() => {
      schedule.update();
    }, 10000);

    tickMapUpdate(nextUpdateTime + rotationLength);
  }, nextUpdateTime - Date.now());
}

// Start the bot
const now = Date.now();
const nextUpdateTime = now + rotationLength - (now % rotationLength);
schedule
  .update()
  .then(() => {
    client.connect();
  })
  .then(() => {
    tickMapUpdate(nextUpdateTime);
  })
  .catch(console.error);
