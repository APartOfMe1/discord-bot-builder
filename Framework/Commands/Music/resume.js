module.exports = {
    name: 'resume',
    description: 'Resume any paused music',
    category: 'Music',
    async execute(msg, args) {
        if (!msg.member.voice.channel) { //Make sure the user is in a VC
            return msg.channel.send('I can\'t resume music if you\'re not in a voice channel!');
        };

        client.player.resume(msg.guild.id).then(result => {
            return msg.channel.send(result);
        }).catch(e => {
            return msg.channel.send(e);
        });
    },
};