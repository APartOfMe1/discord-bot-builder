//Load the dependencies
const Discord = require("discord.js");
global.client = new Discord.Client();
const config = require("../../config/config.json");
const startup = require("./Startup/startup.js");
const cmdhandler = require("./Command-Handler/command-handler.js");
const leveling = require("./Leveling/leveling.js");
const Enmap = require('enmap');
client.points = new Enmap({
    name: "points"
});
client.logchannel = new Enmap({
    name: "logchannel"
});
client.ignore = new Enmap({
    name: "ignored",
});
client.disabledCommands = new Enmap({
    name: "commands",
});
client.settings = new Enmap({
    name: "settings",
    fetchAll: false,
    autoFetch: true,
    cloneLevel: 'deep'
});
client.selfroles = new Enmap({
    name: "selfroles",
});
client.credits = new Enmap({
    name: "credits"
});

client.on("ready", () => { //Start the bootup process by loading available commands
    startup.addCommands("./commands");
});

client.on('error', e => { //Send a message to the error channel when an error occurs with the client
    if (client.channels.cache.get(config.errorChannel)) {
        client.channels.cache.get(config.errorChannel).send(`There was an error with the client \n\`\`\`js\n${e}\`\`\``);
    };
});

client.on('unhandledRejection', e => {
    if (client.channels.cache.get(config.errorChannel)) {
        client.channels.cache.get(config.errorChannel).send(`There was an unhandled rejection error \n\`\`\`js\n${e}\`\`\``);
    };
});

client.on("guildDelete", guild => { //Delete settings when a guild is deleted
    client.settings.delete(guild.id);

    client.ignore.delete(guild.id);

    client.logchannel.delete(guild.id);

    client.selfroles.delete(guild.id);

    client.disabledCommands.delete(guild.id);
});

client.on("botKick", guild => { //Delete settings when the bot is kicked from a guild
    client.settings.delete(guild.id);

    client.ignore.delete(guild.id);

    client.logchannel.delete(guild.id);

    client.selfroles.delete(guild.id);

    client.disabledCommands.delete(guild.id);
});

client.on("message", msg => {
    if (msg.author.bot) { //Ignore messages sent by bots
        return;
    };

    if (msg.guild === null) { //If sent in anything other than a guild, return
        return;
    };

    if (!msg.guild.available) { //Check if the guild is available
        return;
    };

    if (msg.guild.id === "264445053596991498") { //Gotta love when the Discord Bot List server breaks everything
        return;
    };

    leveling.handleLvl(msg);

    cmdhandler.handleCommand(msg, msg.content); //Check if the command is valid and execute it
});

client.on("messageUpdate", (oldmsg, newmsg) => {
    const logdefault = {
        chan: "disabled"
    };

    const defaultSettings = {
        prefix: config.prefix,
        logs: "disabled"
    };

    if (!oldmsg.guild) { //If the message wasn't sent in a guild, ignore it
        return;
    };

    if (!oldmsg.guild.available) { //Check if the guild is available
        return;
    };

    if (oldmsg.author.bot) { //If the message was sent by a bot, ignore it
        return;
    };

    if (!oldmsg.guild.me.hasPermission('SEND_MESSAGES')) { //Send an error if the bot doesn't have permissions
        return;
    };

    var logenabled = client.settings.ensure(oldmsg.guild.id, defaultSettings).logs; //Get the log status

    var chnl = client.channels.cache.get(client.logchannel.ensure(oldmsg.guild.id, logdefault)); //Get the log channel

    if (logenabled === 'enabled') {
        var ignoreids = client.ignore.get(oldmsg.guild.id); //Get the list of IDs that are being ignored from logging

        if (!ignoreids) { //Set this to avoid errors with .includes
            ignoreids = "None";
        };

        if (ignoreids.includes(oldmsg.author.id) || ignoreids.includes(oldmsg.channel.id)) { //Return if there are no IDs or the user/channel is ignored
            return;
        };

        if (oldmsg.content === newmsg.content) { //Return if the edited message is the same as the old one
            return;
        };

        try {
            return chnl.send(`Message sent by **${oldmsg.author.tag}** in ${oldmsg.channel} was edited \`\`\`diff\n-${oldmsg.content}\n\n+${newmsg.content}\`\`\``); //Send a message to the log channel
        } catch (error) {
            return; //Return if the logchannel can't be reached. (If it was deleted or something)
        };
    };
});

client.on("messageDelete", delmsg => {
    const logdefault = {
        chan: "disabled"
    };

    const defaultSettings = {
        prefix: config.prefix,
        logs: "disabled"
    };

    if (!delmsg.guild) { //If the message wasn't sent in a guild, ignore it
        return;
    };

    if (!delmsg.guild.available) { //Check if the guild is available
        return;
    };

    if (delmsg.author.bot) { //If the message was sent by a bot, ignore it
        return;
    };

    if (!delmsg.guild.me.hasPermission('SEND_MESSAGES')) { //Send an error if the bot doesn't have permissions
        return;
    };

    var logenabled = client.settings.ensure(delmsg.guild.id, defaultSettings).logs; //Get the log status

    var chnl = client.channels.cache.get(client.logchannel.ensure(delmsg.guild.id, logdefault)); //Get the log channel

    if (logenabled === 'enabled') {
        var ignoreids = client.ignore.get(delmsg.guild.id); //Get the list of IDs that are being ignored from logging

        if (!ignoreids) { //Set this to avoid errors with .includes
            ignoreids = "None";
        };

        if (ignoreids.includes(delmsg.author.id) || ignoreids.includes(delmsg.channel.id)) { //Return if there are no IDs or the user/channel is ignored
            return;
        };

        try {
            return chnl.send(`Message sent by **${delmsg.author.tag}** in ${delmsg.channel} was deleted \`\`\`diff\n-${delmsg.content}\`\`\``); //Send a message to the log channel
        } catch (error) {
            return; //Return if the logchannel can't be reached. (If it was deleted or something)
        };
    };
});

client.on("guildMemberRemove", oldmember => {
    const logdefault = {
        chan: "disabled"
    };

    const defaultSettings = {
        prefix: config.prefix,
        logs: "disabled"
    };

    if (!oldmember.guild) { //Make sure the member actually left a guild
        return;
    };

    if (!oldmember.guild.available) { //Check if the guild is available
        return;
    };

    if (oldmember === client.user.id) { //Check if the bot itself is the user that left the guild
        return;
    };

    if (!oldmember.guild.me.hasPermission('SEND_MESSAGES')) { //Send an error if the bot doesn't have permissions
        return;
    };

    oldmember.guild.channels.cache.forEach(channel => { //Get each channel
        if (channel.type === "text" && channel.topic) { //Check if it's a text channel and has a set topic
            if (channel.topic.toLowerCase().includes("+>leave<+") || channel.topic.toLowerCase().includes("+>welcomeleave<+")) { //Make sure the topic includes one of the phrases
                channel.send(`${oldmember.user.tag} just left the server...`);
            };
        };
    });

    var logenabled = client.settings.ensure(oldmember.guild.id, defaultSettings).logs; //Get the status of the logs

    var chnl = client.channels.cache.get(client.logchannel.ensure(oldmember.guild.id, logdefault)); //Get the log channel

    if (logenabled === 'enabled') { //Send a message to the log channel if enabled
        try {
            return chnl.send(`${client.users.cache.get(oldmember.id).tag} (${oldmember.id}) has left ${oldmember.guild}`); //Send a message to the log channel
        } catch (error) {
            return; //Return if the logchannel can't be reached. (If it was deleted or something)
        };
    };
});

client.on("guildCreate", guild => { //Send a message when the bot joins a guild
    if (!guild.available) { //Check if the guild is available
        return;
    };

    if (!guild.me.hasPermission('SEND_MESSAGES')) { //Send an error if the bot doesn't have permissions
        return;
    };

    let defaultChannel = "";

    guild.channels.cache.forEach((channel) => {
        if (channel.type == "text" && defaultChannel == "") { //Sort by text channels
            if (channel.permissionsFor(guild.me).has("SEND_MESSAGES")) { //If the bot can send messages in the channel
                defaultChannel = channel; //Set the first available channel as the default channel
            };
        };
    });

    const embed = new Discord.MessageEmbed() //Send a nice message
        .setColor("RANDOM")
        .addField('Thank you for adding me!', `My default prefix is \`${config.prefix}\`. Use \`${config.prefix}help\` or \`${config.prefix}helpdm\` for a list of commands!`);

    defaultChannel.send({
        embed
    });
});

client.on("guildMemberAdd", newmember => {
    const logdefault = {
        chan: "disabled"
    };

    const defaultSettings = {
        prefix: config.prefix,
        logs: "disabled"
    };

    if (!newmember.guild) { //Make sure the member actually joined a guild
        return;
    };

    if (!newmember.guild.available) { //Check if the guild is available
        return;
    };

    if (!newmember.guild.me.hasPermission('SEND_MESSAGES')) { //Send an error if the bot doesn't have permissions
        return;
    };

    if (!newmember.guild.me.hasPermission('MANAGE_ROLES')) { //Send an error if the bot doesn't have permissions
        return;
    };

    client.selfroles.ensure(newmember.guild.id, { //Make sure the enmap has the settings
        selfroles: [],
        autorole: "Not set"
    });

    var autorole = client.selfroles.get(newmember.guild.id, "autorole"); //Get the autorole

    if (!newmember.roles.cache.has(autorole)) { //Check if the message author already has the role
        newmember.roles.add(autorole).catch((e) => { //Add the role
            return;
        });
    };

    newmember.guild.channels.cache.forEach(channel => { //Get each channel
        if (channel.type === "text" && channel.topic) { //check if it's a text channel and has a set topic
            if (channel.topic.toLowerCase().includes("+>welcome<+") || channel.topic.toLowerCase().includes("+>welcomeleave<+")) { //Check if the topic includes one of the phrases
                channel.send(`Welcome ${newmember} to ${newmember.guild}! You are user number **${newmember.guild.members.cache.size}**`);
            };
        };
    });

    var logenabled = client.settings.ensure(newmember.guild.id, defaultSettings).logs; //Get the status of the logs

    var chnl = client.channels.cache.get(client.logchannel.ensure(newmember.guild.id, logdefault)); //Get the log channel

    if (logenabled === 'enabled') { //Send a message to the log channel if enabled
        try {
            return chnl.send(`${client.users.cache.get(newmember.id).tag} (${newmember.id}) joined ${newmember.guild}`); //Send a message to the log channel
        } catch (error) {
            return; //Return if the logchannel can't be reached. (If it was deleted or something)
        };
    };
});

client.login(config.token); //Log into Discord