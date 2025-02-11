const Discord = require('discord.js');
const config = require("../../config/config.json");

module.exports = {
    name: 'settings',
    description: 'Change the guild\'s settings',
    category: 'Moderation',
    aliases: ["options", "opts", "config"],
    usage: '`{prefix}settings <setting> <value>`',
    examples: 'Use `{prefix}settings` for more detailed information',
    async execute(msg, args) {
        //Hoo boy here we go. This is a huge mess, but I *really* don't want to rewrite it

        if (!msg.member.hasPermission('MANAGE_GUILD')) { //Make sure the author can manage the guild
            return msg.reply("Sorry! You need the manage server permission to change the settings!");
        };

        var [prop, ...value] = args; //Split up the message 

        const defaultSettings = { //Define the default settings
            prefix: config.prefix,
            logs: "disabled"
        };

        var guildConf = client.settings.ensure(msg.guild.id, defaultSettings); //Make sure that the enmap has the default settings

        client.selfroles.ensure(msg.guild.id, {
            selfroles: [],
            autorole: "Not set"
        });

        switch (prop) {
            case 'view':
                view();

                break;

            case 'prefix':
                prefix();

                break;

            case 'logs':
                logs();

                break;

            case "commands":
                commands();

                break;

            case "selfroles":
                selfroles();

                break;

            case "autorole":
                autorole();

                break;

            default:
                if (!client.settings.has(msg.guild.id, prop)) { //Make sure the given setting is valid
                    return msg.channel.send("That's not a setting!");
                };

                const embed = new Discord.MessageEmbed() //Send a default message if no setting was provided
                    .setColor(config.embedColor)
                    .addField('Settings', `To change a setting, use \`${config.prefix}settings <setting> <value>\`. For example, \`${config.prefix}settings prefix >\`. Use \`${config.prefix}settings <setting>\` for detailed usage info. To view the guild's current settings, use \`${config.prefix}settings view\` \n\nAvailable settings are: \`\`\`\nprefix, logs, commands, selfroles, autorole\`\`\``);

                return msg.channel.send({
                    embed
                });
        };

        function view() {
            try { //Get the logchannel
                var logchannel = `#${client.channels.cache.get(client.logchannel.get(msg.guild.id)).name} (${client.logchannel.get(msg.guild.id)})`;
            } catch (error) {
                var logchannel = "disabled";
            };

            var ignoredlist = client.ignore.get(msg.guild.id); //Get the list of ignored channels/users

            var idconvert = []; //Blank variable to convert usernames from IDs

            try {
                ignoredlist.forEach(id => { //Get the list of ignored users/channels and add them to the variable
                    try {
                        idconvert.push(client.users.cache.get(id).tag);
                    } catch (error) { //If the result isn't a user, check to see if it's a channel
                        idconvert.push(`#${client.channels.cache.get(id).name}`);
                    };
                });
            } catch (error) {
                idconvert.push("None have been ignored");
            };


            if (idconvert.length === 0) { //Check if any data was added
                idconvert.push("None have been ignored");
            };

            var getAll = client.selfroles.get(msg.guild.id, "selfroles"); //Get the list of selfroles

            var roleList = [];

            try {
                getAll.forEach(role => { //Get the list of ignored users/channels and add them to the variable
                    roleList.push(`${msg.guild.roles.cache.get(role).name} (${role})`);
                });
            } catch (error) {
                roleList.push("No selfroles available");
            };

            if (roleList.length === 0) { //Check if any data was added
                roleList.push("No selfroles available");
            };

            if (guildConf.logs === undefined) { //Set logs as disabled if not found
                client.settings.set(msg.guild.id, 'disabled', "logs");
            };

            if (msg.guild.roles.cache.has(client.selfroles.get(msg.guild.id, "autorole"))) {
                var selfrole = msg.guild.roles.cache.get(client.selfroles.get(msg.guild.id, "autorole")).name;
            } else {
                var selfrole = client.selfroles.get(msg.guild.id, "autorole");
            };

            var disabledcommands = client.disabledCommands.get(msg.guild.id); //Get the list of disabled commands

            if (!disabledcommands || disabledcommands.length === 0) { //If there aren't any disabled commands, set a backup message
                disabledcommands = "No commands have been disabled";
            };

            const viewembed = new Discord.MessageEmbed() //Setup and send an embed
                .setColor(config.embedColor)
                .addField("General", `\`\`\`Prefix: ${guildConf.prefix} \n\nAutorole: ${selfrole}\`\`\``, true)
                .addField("Logs", `\`\`\`Logs: ${guildConf.logs} \n\nLog Channel: ${logchannel} \n\nIgnored Users/Channels: ${idconvert.join(", ")}\`\`\``, true)
                .addField("Commands", `\`\`\`Disabled Commands: ${disabledcommands}\`\`\``)
                .addField("Selfroles", `\`\`\`${roleList.join(", ")}\`\`\``);

            return msg.channel.send({
                embed: viewembed
            });
        };

        function prefix() {
            const prefix = args.slice(1).join(' '); //Split the message to get the prefix

            if (prefix.length > 5 || prefix.includes(' ')) { //Make sure the prefix isn't anything crazy
                return msg.channel.send('Your prefix should be 5 characters max and not include any spaces');
            };

            if (prefix === "") { //If there wasn't any prefix given, send a default message
                return msg.channel.send(`To change the prefix, use \`${config.prefix}settings prefix <prefix>\`. For example \`${config.prefix}settings prefix eb!\`. Note that your prefix can't have spaces, and cannot be more than 5 characters long`);
            };

            client.settings.set(msg.guild.id, value.join(" "), prop); //Set the prefix

            msg.channel.send(`Prefix has been changed to: \`${value.join(" ")}\``); //Send a success message

            return msg.guild.me.setNickname(`${client.user.username} [${prefix}]`); //Set the bot's nickname to match the new prefix
        };

        function logs() {
            const log = args[1]; //Get the subcommand

            switch (log) {
                case "enable":
                    if (args[2]) {
                        var chnl = msg.mentions.channels.first(); //Get the mentioned channel

                        if (!chnl) { //Send a message if the channel is invalid
                            return msg.channel.send('Please specify a channel!');
                        };
                    } else { //Send a message if there wasn't a channel specified
                        return msg.channel.send('Please specify a channel!');
                    };

                    client.settings.set(msg.guild.id, 'enabled', prop); //Set logs to enabled

                    client.logchannel.set(msg.guild.id, chnl.id); //Set the logchannel

                    return msg.channel.send(`Logs have been successfully enabled in ${chnl}`); //Send a success message

                case "disable":
                    if (!client.logchannel.has(msg.guild.id)) { //Make sure the logs aren't already disabled
                        return msg.channel.send('Logs are already disabled!');
                    };

                    client.settings.set(msg.guild.id, 'disabled', prop); //Set logs to disabled

                    client.logchannel.delete(msg.guild.id); //Delete the logchannel

                    return msg.channel.send('Logs have been successfully disabled'); //Send a success message

                case "ignore":
                    if (args[2]) {
                        var ignoredid = msg.mentions.channels.first() || msg.mentions.users.first(); //Get the id to ignore

                        if (!ignoredid) { //Send an error if the channel/user is invalid
                            return msg.channel.send("Please specify a user or channel to ignore from logging");
                        };
                    } else { //Send an error if there weren't any channels given
                        return msg.channel.send("Please specify a user or channel to ignore from logging");
                    };

                    if (client.ignore.includes(msg.guild.id, ignoredid.id)) { //Make sure the user isn't already ignored
                        return msg.channel.send('That user or channel is already ignored from logging!');
                    };

                    client.ignore.ensure(msg.guild.id, []); //Ensure that the enmap has the guild

                    client.ignore.push(msg.guild.id, ignoredid.id); //Add the id to the enmap

                    return msg.channel.send(`${ignoredid} was successfully excluded from message logging`); //Send a success message

                case "unignore":
                    if (args[2]) {
                        var ignoredid = msg.mentions.channels.first() || msg.mentions.users.first(); //get the id to ignore

                        if (!ignoredid) { //Send an error if the channel/user is invalid
                            return msg.channel.send("Please specify a user or channel to unignore");
                        };
                    } else {
                        return msg.channel.send("Please specify a user or channel to unignore"); //Send an error if there weren't any channels given
                    };

                    if (!client.ignore.includes(msg.guild.id, ignoredid.id)) { //Make sure the user is actually ignored
                        return msg.channel.send('That user or channel isn\'t ignored from logging!');
                    };

                    client.ignore.remove(msg.guild.id, ignoredid.id); //Remove the id from the list

                    return msg.channel.send(`${ignoredid} is now included in message logging`); //Send a success message

                default:
                    return msg.channel.send(`For message logging please use the format \`${config.prefix}settings logs <enable/disable> <channel>\`. For example, \`${config.prefix}settings logs enable #logs\` \n\nYou can also exclude a user or channel from logging by using \`${config.prefix}settings logs <ignore/unignore> <@user/#channel>\``); //Send an info message
            };
        };

        function commands() {
            const sub = args[1];

            if (!args[2]) { //Send a message if there was no command specified
                return msg.channel.send(`To ignore commands entirely use \`${config.prefix}settings commands enable/disable <command>\`. For example, \`${config.prefix}settings commands disable actas\``);
            };

            var cmd = args[2].toLowerCase(); //Get the command specified

            switch (sub) {
                case "disable":
                    const unignorable = [ //List of commands that can't be ignored
                        "settings",
                        "help",
                        "helpdm"
                    ];

                    for (const ignore of unignorable) { //Make sure the command exists and can be ignored
                        if (ignore === cmd || !client.commands.get(cmd)) {
                            return msg.channel.send(`**${cmd}** either doesn't exist or cannot be disabled`);
                        };
                    };

                    var findCmd = client.commands.get(cmd) || client.commands.find(c => c.aliases && c.aliases.includes(cmd)); //Get a list of commands and aliases

                    if (findCmd.category === "Administration") { //If the command is in the Administration category, ignore it
                        return msg.channel.send(`**${cmd}** either doesn't exist or cannot be disabled`);
                    };

                    client.disabledCommands.ensure(msg.guild.id, []); //Ensure that the enmap has the guild

                    if (client.disabledCommands.includes(msg.guild.id, cmd)) { //Check if the command is already disabled
                        return msg.channel.send(`**${cmd}** is already disabled`);
                    };

                    client.disabledCommands.push(msg.guild.id, cmd); //Add the command to the enmap

                    return msg.channel.send(`**${cmd}** has been disabled`); //Send a success message

                case "enable":
                    if (!client.commands.get(cmd)) { //Check if the command exists
                        return msg.channel.send(`**${cmd}** either doesn't exist or cannot be disabled/enabled`);
                    };

                    var findCmd = client.commands.get(cmd) || client.commands.find(c => c.aliases && c.aliases.includes(cmd)); //Get a list of commands and aliases

                    if (findCmd.category === "Administration") { //If the command is in the Administration category, ignore it
                        return msg.channel.send(`**${cmd}** either doesn't exist or cannot be disabled`);
                    };

                    client.disabledCommands.ensure(msg.guild.id, []); //Ensure that the enmap has the guild

                    if (!client.disabledCommands.includes(msg.guild.id, cmd)) { //Check if the command is actually disabled
                        return msg.channel.send(`**${cmd}** is not disabled!`);
                    };

                    client.disabledCommands.remove(msg.guild.id, cmd); //Remove the command from the map

                    return msg.channel.send(`**${cmd}** has been enabled`); //Send a success message

                default:
                    return msg.channel.send(`To ignore commands entirely use \`${config.prefix}settings commands <enable/disable> <command>\`. For example, \`${config.prefix}settings commands disable actas\``); //Send an informational message
            };
        };

        function selfroles() {
            client.selfroles.ensure(msg.guild.id, {
                selfroles: [],
                autorole: "Not set"
            });

            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) { //Send an error if the bot doesn't have permissions
                return msg.channel.send("I don't have permissions to add roles to users! Please give me the \"Manage Roles\" permission and run the command again");
            };

            switch (args[1]) {
                case "add":
                    if (args[2]) { //Check if a role was given
                        var role = msg.guild.roles.cache.find(i => i.name.toLowerCase() === args.slice(2).join(" ").toLowerCase()) || msg.guild.roles.cache.find(i => i.id === args[2]) || msg.mentions.roles.first();

                        if (!role) { //Check if the given role is valid
                            return msg.channel.send("I couldn't find that role! Try mentioning it or giving its ID");
                        };
                    } else {
                        return msg.channel.send(`To add a role to the list of selfroles, use \`${config.prefix}settings selfroles add <name/id/@role>\`. For example: \`${config.prefix}settings selfroles add announcement-pings\``);
                    };

                    if (msg.member.roles.highest.comparePositionTo(role) < 0) { //Send an error if the member has a higher role than the bot
                        return msg.channel.send("I can't add a role to someone higher up than me!");
                    };

                    client.selfroles.push(msg.guild.id, role.id, "selfroles"); //Add the role to the list of selfroles

                    msg.channel.send(`Alright! I've added **${role.name}** to the list of selfroles. Users can assign it to themselves by using \`${config.prefix}selfrole ${role.name}\``);

                    break;

                case "remove":
                    if (args[2]) { //Check if a role was given
                        var role = msg.guild.roles.cache.find(i => i.name.toLowerCase() === args.slice(2).join(" ").toLowerCase()) || msg.guild.roles.cache.find(i => i.id === args[2]) || msg.mentions.roles.first();

                        if (!role) { //Make sure the role is valid
                            return msg.channel.send("I couldn't find that role! Try mentioning it or giving its ID");
                        };
                    } else {
                        return msg.channel.send(`To remove a role to the list of selfroles, use \`${config.prefix}settings selfroles remove <name/id/@role>\`. For example: \`${config.prefix}settings selfroles remove announcement-pings\``);
                    };

                    if (client.selfroles.includes(msg.guild.id, role.id, "selfroles")) { //Check if the array includes the given role
                        client.selfroles.remove(msg.guild.id, role.id, "selfroles"); //Remove the role from the array

                        return msg.channel.send(`**${role.name}** was removed from the list of selfroles`);
                    } else {
                        return msg.channel.send(`**${role.name}** isn't a selfrole!`);
                    };

                default:
                    msg.channel.send(`To add a role to the list of selfroles, use \`${config.prefix}settings selfroles add <name/id/@role>\`. For example: \`${config.prefix}settings selfroles add announcement-pings\` \n\nTo remove a role from the list, just do the opposite: \`${config.prefix}settings selfroles remove <name/id/@role>\``);

                    break;
            };
        };

        function autorole() {
            client.selfroles.ensure(msg.guild.id, {
                selfroles: [],
                autorole: "Not set"
            });

            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) { //Send an error if the bot doesn't have permissions
                return msg.channel.send("I don't have permissions to add roles to users! Please give me the \"Manage Roles\" permission and run the command again");
            };

            if (args[1]) {
                if (args[1].toLowerCase() === "remove") { 
                    client.selfroles.set(msg.guild.id, "Not set", "autorole"); //Remove the autorole

                    return msg.channel.send("The autorole has been disabled");
                };

                var role = msg.guild.roles.cache.find(i => i.name.toLowerCase() === args.slice(1).join(" ").toLowerCase()) || msg.guild.roles.cache.find(i => i.id === args[1]) || msg.mentions.roles.first();

                if (!role) { //Check if a valid role was given
                    return msg.channel.send("I couldn't find that role! Try mentioning it or giving its ID");
                };

                client.selfroles.set(msg.guild.id, role.id, "autorole"); //Set the autorole

                return msg.channel.send(`**${role.name}** was successfully set as the auto role! Any new members that join will automatically get the role added to them. To remove the autorole, use \`${config.prefix}settings autorole remove\``);
            } else {
                return msg.channel.send(`To set up an autorole and have it be given to new users, use \`${config.prefix}settings autorole <name/id/@role>\`. For example: \`${config.prefix}settings autorole member\` \n\nTo remove the autorole, use \`${config.prefix}settings autorole remove\``);
            };
        };
    },
};