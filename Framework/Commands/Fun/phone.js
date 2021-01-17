const Discord = require('discord.js');
const config = require("../../config/config.json");
var waiting = [];
var chatting = [];

module.exports = {
    name: 'phone',
    description: 'Have a conversation with users on another server',
    category: 'Fun',
    aliases: ["userphone", "call"],
    cooldown: 60000,
    async execute(msg, args) {
        if (chatting.find(i => i.find(g => g.guild.id === msg.guild.id)) || waiting.find(i => i.guild.id === msg.guild.id)) { //Check if a call is already going on
            return msg.channel.send("A call is already going on in this server!");
        };

        var serverInfo = {
            guild: msg.guild,
            channel: msg.channel.id
        };

        waiting.push(serverInfo);

        msg.channel.send("Trying to find another server...");

        setTimeout(() => { //Delete the server info after 30 seconds
            var toDelete = waiting.indexOf(waiting.find(i => i.guild.id === msg.guild.id));

            waiting.splice(toDelete, 1);
        }, 30000);

        while (waiting.length > 1) { //Make sure there's 2 or more servers in the queue
            const first2 = waiting.slice(0, 2); //Get the first 2 servers

            waiting.splice(waiting.indexOf(waiting.find(i => i.guild.id === first2[0].guild.id)), 1); //Remove the first server from the waiting list

            waiting.splice(waiting.indexOf(waiting.find(i => i.guild.id === first2[1].guild.id)), 1); //Remove the 2nd server

            chatting.push(first2); //Add the 2 servers to the list of currently chatting servers

            connect(first2);
        };

        function connect(servers) {
            client.channels.cache.get(servers[0].channel).send(`Server found! Connected to **${servers[1].guild.name}**. Use \`${config.prefix}hangup\` to hang up the phone`); //Send a success message to the first server

            client.channels.cache.get(servers[1].channel).send(`Server found! Connected to **${servers[0].guild.name}**. Use \`${config.prefix}hangup\` to hang up the phone`); //Send a success message to the second server

            client.on("message", message => {
                if (message.author.bot) { //Ignore messages sent by bots
                    return;
                };

                if (message.guild === null) { //If sent in anything other than a guild, return
                    return;
                };

                if (!message.guild.available) { //Check if the guild is available
                    return;
                };

                if (message.channel.id === servers[0].channel && chatting.includes(servers)) { //Make sure the message is from one of the currently chatting servers
                    if (message.content.toLowerCase() === `${config.prefix}hangup`) { //Check if the user wants to hang up
                        chatting.splice(chatting.indexOf(chatting.find(i => i.channel === servers[0].channel)), 1); //Remove the servers from the list

                        client.channels.cache.get(servers[1].channel).send(`The other server hung up the phone`); //Send a message to the other channel

                        return message.channel.send("You hung up the phone"); //Send a message to the current channel
                    };

                    client.channels.cache.get(servers[1].channel).send(`${message.author.tag}: ${filter(message.content)}`); //Filter out any unwanted parts of the message and send it
                } else if (message.channel.id === servers[1].channel && chatting.includes(servers)) { //Same as above but for the other server
                    if (message.content.toLowerCase() === `${config.prefix}hangup`) {
                        chatting.splice(chatting.indexOf(chatting.find(i => i.channel === servers[0].channel)), 1);

                        client.channels.cache.get(servers[0].channel).send(`The other server hung up the phone`);

                        return message.channel.send("You hung up the phone");
                    };

                    client.channels.cache.get(servers[0].channel).send(`${message.author.tag}: ${filter(message.content)}`);
                } else {
                    return;
                };
            });
        };

        function filter(message) {
            var filteredMsg = message;

            const banned = [ //The list of banned words/phrases
                "@everyone",
                "@here"
            ];

            for (let i = 0; i < filteredMsg.split(" ").length; i++) { //Check each word to see if it's included in the list of banned words/phrases
                for (const item of banned) {
                    if (filteredMsg.includes(item)) {
                        filteredMsg = filteredMsg.replace(item, "<removed>");
                    };
                };
            };

            return filteredMsg;
        };
    },
};