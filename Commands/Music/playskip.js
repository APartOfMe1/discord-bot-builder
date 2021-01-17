module.exports = {
    name: 'playskip',
    description: 'Skip all tracks in the queue and immediately play music',
    category: 'Music',
    usage: '`{prefix}playskip <song>` or `{prefix}playskip <youtube link>`',
    examples: '`{prefix}playskip africa` or `{prefix}playskip https://www.youtube.com/watch?v=dQw4w9WgXcQ`',
    async execute(msg, args) {
        //The discord-player 2.0 update broke this one
        if (!msg.member.voice.channel) { //Make sure the user is in a VC
            return msg.channel.send('I can\'t play music if you\'re not in a voice channel!');
        };

        const perms = msg.member.voice.channel.permissionsFor(msg.client.user); //Get the bots' permissions for the current voice channel

        if (!perms.has('CONNECT')) { //Make sure the bot can connect
            return msg.channel.send('I can\'t connect to this voice channel. Do I have the correct permissions?');
        };

        if (!perms.has('SPEAK')) { //Make sure the bot can transmit audio
            return msg.channel.send('I can\'t speak in this channel! Do I have the correct permissions?');
        };

        if (!args[0]) { //Make sure the bot is actually given a song to search for
            return msg.channel.send("You need to give me a song to play!");
        };

        client.player.clearQueue(msg.guild.id).then(() => { //Clear the queue, add the new song to the queue, and skip to it
            client.player.play(args.join(" "), msg.member.voice.channel, msg.channel, msg.author);

            setTimeout(() => {
                client.player.skip(msg.guild.id);
            }, 1500);
        }).catch(err => { //Just play the song if there's nothing in the queue to clear
            return client.player.play(args.join(" "), msg.member.voice.channel, msg.channel, msg.author);
        });
    },
};