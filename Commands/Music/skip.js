module.exports = {
    name: 'skip',
    description: 'Skip to the next track in the queue',
    category: 'Music',
    async execute(msg, args) {
        if (!msg.member.voice.channel) { //Make sure the user is in a VC
            return msg.channel.send('I can\'t skip music if you\'re not in a voice channel!');
        };

        client.player.skip(msg.guild.id).then((song) => { //Skip the song
            msg.channel.send(`**${song.title}** has been skipped!`);
        }).catch((err) => { //Send an error if there's nothing to be skipped
            msg.channel.send("There's nothing in the queue!");
        });
    },
};