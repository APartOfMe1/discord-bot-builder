module.exports = {
    name: 'repeat',
    description: 'Repeat the current song',
    category: 'Music',
    async execute(msg, args) {
        if (!msg.member.voice.channel) { //Make sure the user is in a VC
            return msg.channel.send('I can\'t repeat music if you\'re not in a voice channel!');
        };

        client.player.repeat(msg.guild.id).then(response => {
            return msg.channel.send(response);
        }).catch(err => {
            return msg.channel.send("I'm not playing anything!");
        });
    },
};