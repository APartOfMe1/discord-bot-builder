const Discord = require('discord.js');
//const ytdl = require('ytdl-core-discord');
const ytdl = require('discord-ytdl-core');
const ytdlCore = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');
const config = require("../../config/config.json");
const queue = {};

module.exports = {
    getQueue(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing");
        };

        return Promise.resolve(queue[guildId]); //Return the guild's queue
    },

    clearQueue(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing");
        };

        queue[guildId].songs.splice(1); //Remove every item except what's currently playing

        queue[guildId].totalTimeMs = this.hmsToMs(queue[guildId].songs[0].duration); //Reset the total time

        return Promise.resolve("Queue cleared");
    },

    skip(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing");
        };

        const skipped = queue[guildId].songs[0]; //Store the song

        queue[guildId].channel.dispatcher.end();

        return Promise.resolve(skipped); //Return info about the skipped song
    },

    leave(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing!");
        };

        queue[guildId].channel.dispatcher.end();

        delete queue[guildId]; //Remove the guild's queue entirely

        return Promise.resolve("Stopped");
    },

    hmsToMs(t) { //Converts an hh:mm:ss timestamp to milliseconds
        var time = t.split(":");

        if (time[2]) { //If we have an hh:mm:ss timestamp
            return ((+time[0] * 60 * 60) + (+time[1] * 60) + +time[2]) * 1000;
        } else if (time[1]) { //If we only have mm:ss
            return ((+time[0] * 60) + +time[1]) * 1000;
        } else { //If there's only ss
            return +time[0] * 1000;
        };
    },

    repeat(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing");
        };

        if (queue[guildId].repeatMode) { //Toggle repeat mode
            queue[guildId].repeatMode = false;

            return Promise.resolve("Repeat mode disabled!");
        } else {
            queue[guildId].repeatMode = true;

            return Promise.resolve("Repeat mode enabled!");
        };
    },

    pause(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing!");
        };

        if (queue[guildId].paused) { //Check if the player is paused
            return Promise.reject("The music is already paused!");
        };

        queue[guildId].paused = true;

        queue[guildId].channel.dispatcher.pause();

        return Promise.resolve("👍 Paused");
    },

    resume(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing!");
        };

        if (!queue[guildId].paused) { //Make sure the player is paused
            return Promise.reject("The music isn't paused!");
        };

        queue[guildId].paused = false;

        queue[guildId].channel.dispatcher.resume();

        return Promise.resolve("👍 Resumed");
    },

    getTime(s) { //Convert from milliseconds to hh:mm:ss
        var ms = s % 1000;

        s = (s - ms) / 1000;

        var secs = s % 60;

        s = (s - secs) / 60;

        var mins = s % 60;

        var hrs = (s - mins) / 60;

        if (hrs < 10) {
            hrs = `0${hrs}`;
        };

        if (secs < 10) {
            secs = `0${secs}`;
        };

        if (mins < 10) {
            mins = `0${mins}`;
        };

        if (hrs === `00`) {
            return mins + ':' + secs;
        };

        return hrs + ':' + mins + ':' + secs;
    },

    async playSong(song, voiceChannel, msgChannel) {
        voiceChannel.join().then(async connection => {
            queue[voiceChannel.guild.id].channel = connection; //Store the info to use in other functions

            const stream = await ytdl(song.url, {
                filter: 'audioonly',
                opusEncoded: true,
                highWaterMark: 1 << 25
            });

            const dispatcher = connection.play(stream, {
                type: 'opus',
                bitrate: 'auto',
                fec: true
            });

            const playingEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setAuthor("Now Playing")
                .setThumbnail(song.thumbnail)
                .setTitle(song.title)
                .setURL(song.url)
                .addField("Duration", song.duration, true)
                .addField("Channel", song.channel, true)
                .addField("Requested By", `${song.requestedBy.username}#${song.requestedBy.discriminator}`, true);

            msgChannel.send({
                embed: playingEmb
            });

            dispatcher.on('finish', () => {
                if (!queue[voiceChannel.guild.id]) { //Check if there's a queue for the guild at all
                    msgChannel.send("I finished playing the current queue!");

                    return voiceChannel.leave();
                };

                if (queue[voiceChannel.guild.id].songs.length && !queue[voiceChannel.guild.id].repeatMode) { //Make sure there's still songs in the queue and repeatmode is off
                    queue[voiceChannel.guild.id].totalTimeMs = queue[voiceChannel.guild.id].totalTimeMs - this.hmsToMs(song.duration); //Reduce the total queue time
                };

                if (!queue[voiceChannel.guild.id].repeatMode) { //Check if repeatMode is on for the server
                    queue[voiceChannel.guild.id].songs.shift(); //Remove the first item from the queue
                };

                if (queue[voiceChannel.guild.id].songs.length) { //If there's songs left in the queue, play the first one. Otherwise just stop the player
                    this.playSong(queue[voiceChannel.guild.id].songs[0], voiceChannel, msgChannel);
                } else {
                    msgChannel.send("I finished playing the current queue!");

                    delete queue[voiceChannel.guild.id];

                    voiceChannel.leave();
                };
            });
        });
    },

    play(search, voiceChannel, msgChannel, user) {
        if (!queue[voiceChannel.guild.id]) { //Initialize the server's queue
            queue[voiceChannel.guild.id] = {
                songs: [],
                totalTimeMs: 0,
                repeatMode: false,
                paused: false,
                channel: null
            };
        };

        if (ytpl.validateID(search)) { //Check if the args are a valid playlist link
            ytpl(search, {
                limit: 500 //Limit to only the first 500 items in the playlist
            }).then(res => {
                var totalTime = 0;

                var overridePlay = false;

                if (!queue[voiceChannel.guild.id].songs.length) { //Make sure the player starts correctly when a playlist is the first thing added
                    overridePlay = true;
                };

                for (const i of res.items) { //Add each result to the queue
                    queue[voiceChannel.guild.id].songs.push({
                        title: i.title,
                        url: i.url,
                        thumbnail: i.thumbnail,
                        duration: i.duration,
                        channel: /*i.author.name*/"Unknown", //Set the channel name as unknown until ytpl adds it back
                        requestedBy: user
                    });

                    if (i.duration) {
                        totalTime = totalTime + this.hmsToMs(i.duration);

                        queue[voiceChannel.guild.id].totalTimeMs = queue[voiceChannel.guild.id].totalTimeMs + this.hmsToMs(i.duration);
                    };
                };

                const playlistEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setAuthor("Added to Queue")
                    .setTitle(res.title)
                    .setURL(res.url)
                    .setThumbnail(res.items[0].thumbnail)
                    .setDescription(`Successfully added ${res.items.length} items to the queue!`)
                    .addField("Length", this.getTime(totalTime), true)
                    .addField("Author", /*res.author.name*/ "Unknown", true) //Set the channel name as unknown until ytpl adds it back
                    .addField("Views", res.views)
                    .addField("Last Updated", res.last_updated, true);

                msgChannel.send({
                    embed: playlistEmb
                });

                if (queue[voiceChannel.guild.id].songs.length < 2 || overridePlay === true) { //Check if we're already playing something
                    overridePlay = false;

                    return this.playSong(queue[voiceChannel.guild.id].songs[0], voiceChannel, msgChannel); //Play the first song in the queue
                };
            }).catch(err => { //Assume the playlist is private if there's an error
                return msgChannel.send("That playlist is private!");
            });
        } else if (ytdl.validateURL(search)) { //Check if the search term is a valid youtube url
            ytdlCore.getBasicInfo(search).then(i => {
                queue[voiceChannel.guild.id].songs.push({
                    title: i.videoDetails.title,
                    url: i.videoDetails.video_url,
                    thumbnail: i.videoDetails.thumbnail.thumbnails.reverse()[0].url,
                    duration: this.getTime(i.videoDetails.lengthSeconds * 1000),
                    channel: i.videoDetails.author.name,
                    requestedBy: user
                });

                queue[voiceChannel.guild.id].totalTimeMs = queue[voiceChannel.guild.id].totalTimeMs + (i.videoDetails.lengthSeconds * 1000);

                if (queue[voiceChannel.guild.id].songs.length < 2) { //Check if we're already playing something
                    return this.playSong(queue[voiceChannel.guild.id].songs[0], voiceChannel, msgChannel); //Play the first song in the queue
                } else {
                    var queueEmb = new Discord.MessageEmbed()
                        .setColor(config.embedColor)
                        .setAuthor("Added to Queue")
                        .setTitle(i.videoDetails.title)
                        .setURL(i.videoDetails.video_url)
                        .setThumbnail(i.videoDetails.thumbnail.thumbnails.reverse()[0].url)
                        .addField("Duration", this.getTime(i.videoDetails.lengthSeconds * 1000), true)
                        .addField("Channel", i.videoDetails.author.name, true)
                        .addField("Views", i.videoDetails.viewCount, true);

                    return msgChannel.send({
                        embed: queueEmb
                    });
                };
            });
        } else {
            ytsr(search, { //Search for youtube videos with the given arguments
                limit: 1
            }).then(searchResults => {
                if (!searchResults.items.length) { //Check if there were no results at all
                    return msgChannel.send("No results found");
                };

                parseResults(searchResults.items).then(result => {
                    queue[voiceChannel.guild.id].songs.push({
                        title: result.title,
                        url: result.url,
                        thumbnail: result.thumbnail,
                        duration: result.duration,
                        channel: result.channel,
                        requestedBy: user
                    });

                    queue[voiceChannel.guild.id].totalTimeMs = queue[voiceChannel.guild.id].totalTimeMs + this.hmsToMs(result.duration);

                    if (queue[voiceChannel.guild.id].songs.length < 2) { //Check if we're already playing something
                        return this.playSong(queue[voiceChannel.guild.id].songs[0], voiceChannel, msgChannel); //Play the first song in the queue
                    } else {
                        var queueEmb = new Discord.MessageEmbed()
                            .setColor(config.prefix)
                            .setAuthor("Added to Queue")
                            .setTitle(result.title)
                            .setURL(result.url)
                            .setThumbnail(result.thumbnail)
                            .addField("Duration", result.duration, true)
                            .addField("Channel", result.channel, true)
                            .addField("Views", result.views, true);

                        return msgChannel.send({
                            embed: queueEmb
                        });
                    };
                }).catch(e => {
                    return msgChannel.send("An error occured while searching");
                });
            });
        };
    },
};

function parseResults(videos) {
    if (!videos || !videos.length) {
        return Promise.reject("No results found");
    };

    const results = [];

    for (let n = 0; n < videos.length; n++) {
        if (videos[n].type && videos[n].type === "video") {
            results.push({
                title: videos[n].title,
                url: videos[n].link,
                thumbnail: videos[n].thumbnail,
                duration: videos[n].duration,
                channel: videos[n].author.name,
                views: videos[n].views
            });
        };
    };

    return Promise.resolve(results[0]);
};

//FIX THIS
client.on("voiceStateUpdate", (oldState, newState) => { //Check if there are no other users in the voice channel
    if (queue[oldState.guild.id]) {
        setTimeout(() => {
            if (queue[oldState.guild.id] && queue[oldState.guild.id].channel.channel.members.size < 2) {
                queue[oldState.guild.id].channel.dispatcher.end();

                delete queue[oldState.guild.id]; //Remove the guild's queue entirely
            };
        }, 500);
    };
});