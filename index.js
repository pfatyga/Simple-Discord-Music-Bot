var Promise = require("bluebird");
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const ytSearch = Promise.promisify(require('youtube-search'));
const client = new Discord.Client();

const dotenv = require('dotenv');
dotenv.config();

const discordToken = process.env['DISCORD_TOKEN'];
const youtubeAPIKey = process.env['YOUTUBE_API_KEY'];
let stream;
let dispatcher;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  // Voice only works in guilds, if the msg does not come from a guild,
  // we ignore it
  if (!msg.guild) return;

  if (msg.content === '/ping') {
    msg.reply('Pong!');
  }

  if (msg.content.startsWith('/yt')) {
    // Only try to join the sender's voice channel if they are in one themselves
    joinVoiceChannel(msg)
      .then(connection => { // Connection is an instance of VoiceConnection
        const arg = msg.content.substring(3);
        //if it's a link use it
        if(arg.indexOf('http') !== -1) {
          playSong(arg, connection, msg);
        } else {
          //search using youtube API
          ytSearch(arg, {maxResults: 1, key: youtubeAPIKey}).then(results => {
            console.log(results);
            if(results.length > 0) {
              msg.reply(`Playing ${results[0].title} by ${results[0].channelTitle}`);
              playSong(results[0].link, connection, msg);
            } else {
              msg.reply(`Unable to find results for ${arg} on youtube.`);
            }
          });
          return;
        }
      })
  }

  if(msg.content === '/stop') {
    if(dispatcher) {
      dispatcher.end();
    }
  }

});

function joinVoiceChannel(msg) {
  if (msg.member.voiceChannel) {
    return msg.member.voiceChannel.join().catch(console.log);
  } else {
    msg.reply('You need to join a voice channel first!');
    return Promise.reject('Member is not in voice channel');
  }
}

function playSong(youtubeURL, connection, msg) {
  stream = ytdl(youtubeURL);
  try {
    dispatcher = connection.playStream(stream);
  } catch (exception) {
    console.error(exception);
  }
}

client.login(discordToken);