const Discord = require('discord.js');
const config = require("../../config/config.json");
const {
    Aki
} = require('aki-api');

module.exports = {
    name: 'akinator',
    description: 'Try to have me guess who you\'re thinking of!',
    category: 'Fun',
    aliases: ["aki"],
    cooldown: 30000,
    async execute(msg, args) {
        const reactions = [
            "✅",
            "❌",
            "🤷‍♀️",
            "👍",
            "👎"
        ];

        const gameMsg = await msg.channel.send("Starting game...");

        reactions.forEach(r => { //React in order
            gameMsg.react(r);
        });

        const aki = new Aki("en");

        await aki.start(); //Wait for the game to start

        return newQuestion(gameMsg);

        async function newQuestion(gameMsg) {
            if (aki.progress >= 70 || aki.currentStep >= 78) { //Check if the game is over
                await aki.win();

                gameMsg.reactions.removeAll(); //Remove all reactions

                const character = aki.answers[0]; //Get the first result

                const winEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("My Guess")
                    .setImage(character.absolute_picture_path)
                    .addField("Character", `\`\`\`Name: ${character.name}\nDescription: ${character.description}\nPopularity: ${character.ranking}\`\`\``, true)
                    .addField("Total Guesses", `\`\`\`${aki.currentStep}\`\`\``, true)
                    .setFooter(`${config.name} | You have 45 seconds to make a choice`, client.user.avatarURL());

                return gameMsg.edit("", { //Edit the message with the new embed
                    embed: winEmb
                });
            };

            const gameEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle(`Guess #${aki.currentStep}`)
                .addField("Question", aki.question, true)
                .addField("Progress", aki.progress, true)
                .addField("Reactions", `Yes: ✅\nNo: ❌\nDon't Know: 🤷‍♀️\nProbably: 👍\nProbably Not: 👎`)
                .setFooter(`${config.name} | You have 45 seconds to make a choice`, client.user.avatarURL());

            gameMsg.edit("", { //Edit the message with the new embed
                embed: gameEmb
            });

            const reactionFilter = (r, u) => { //Make sure the reaction emoji is valid and the reactor is the message author
                return reactions.includes(r.emoji.name) && u.id === msg.author.id;
            };

            gameMsg.awaitReactions(reactionFilter, {
                max: 1,
                time: 45000,
                errors: ["time"]
            }).then(async collected => {
                collected.first().emoji.reaction.users.remove(msg.author.id); //Remove the reaction

                switch (collected.first().emoji.name) { //Check for the desired result
                    case "✅":
                        await aki.step(0);

                        newQuestion(gameMsg);

                        break;

                    case "❌":
                        await aki.step(1);

                        newQuestion(gameMsg);

                        break;

                    case "🤷‍♀️":
                        await aki.step(2);

                        newQuestion(gameMsg);

                        break;

                    case "👍":
                        await aki.step(3);

                        newQuestion(gameMsg);

                        break;

                    case "👎":
                        await aki.step(4);

                        newQuestion(gameMsg);

                        break;
                };
            }).catch(e => {
                gameMsg.reactions.removeAll(); //Remove all reactions

                return gameMsg.edit("The answer wasn't given in time!", {
                    embed: null
                });
            })
        };
    },
};