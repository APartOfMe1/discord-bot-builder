const Discord = require("discord.js");
const config = require("../../../config/config.json");
const chalk = require("chalk");
const klaw = require('klaw');

module.exports = {
    addCommands(filepath) {
        client.commands = new Discord.Collection(); //A list of all commands

        client.categories = new Discord.Collection(); //A list of all categories

        klaw(filepath) //Run through the commands folder
            .on('data', c => {
                if (!c.path.endsWith(".js")) { //Ignore non-js files
                    return;
                };

                const command = require(c.path); //Get the filepath for the command

                var commandName = c.path.replace(/^.*[\\\/]/, '').split(".js"); //Get the name of the file

                if (!client.categories.get(command.category)) { //Add the category to the list
                    client.categories.set(command.category);
                };

                client.commands.set(commandName[0], command); //Add the command to the list

                //console.log(`Loaded ${commandName[0]}`); //Enable if you want spam lul
            })
            .on('end', () => {
                console.log(chalk.keyword('yellow')(`Successfully loaded ${client.commands.size} commands and ${client.categories.size} categories!`));

                this.finalize(); //Execute after commands are loaded. Finish bootup
            });
    },

    finalize() {
        setInterval(() => { //Rotate through custom statuses
            const index = Math.floor(Math.random() * config.status.length);

            var activity = "";

            switch (index) {
                case 0: //If the status is the total guild count
                    activity = `with ${client.guilds.cache.size} guilds`;
                    break;

                case 1: //If the status is the total user count
                    activity = `with ${client.users.cache.size} users`;
                    break;

                default:
                    activity = config.status[index];
                    break;
            };

            client.user.setActivity(`${activity} | ${config.prefix}help for a list of commands!`); //Optional: add "| [${index + 1}]" to show which number it is. (Think mantaro)
        }, 60000);

        if (client.channels.cache.get(config.errorChannel)) {
            client.channels.cache.get(config.errorChannel).send("I rebooted!"); //Send a message to a channel on reboot
        };

        console.log(chalk.keyword('green')(`I'm up and running!`)); //Send a message in the console on boot
    }
};