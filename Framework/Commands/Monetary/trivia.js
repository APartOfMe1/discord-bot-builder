const Discord = require('discord.js');
const config = require("../../config/config.json");
const {
    get
} = require('node-superfetch');

module.exports = {
    name: 'trivia',
    description: 'Play a game of trivia! How far can you get?',
    category: 'Monetary',
    aliases: ["quiz"],
    cooldown: 5000,
    usage: '`{prefix}trivia`  or `{prefix}trivia <amount>`',
    examples: '`{prefix}trivia 250`',
    async execute(msg, args) {
        var streak = 0;

        var credits = parseInt(args[0], 10); //Get the amount of credits to bet

        if (!credits) { //If there were no credits specified, set the amount to 1
            credits = 1;
        };

        if (credits > 500) { //Make sure the user doesn't bet more than 500 credits at a time
            credits = 500;
        };

        client.credits.ensure(msg.author.id, { //Set the default settings for credits
            user: msg.author.id,
            credits: 0,
            streak: 0,
            totalcredits: 0,
            totaldailies: 0
        });

        if (client.credits.get(msg.author.id, "credits") < credits) { //Check to see if the user has enough credits to play
            return msg.channel.send("You don't have enough credits!");
        };

        client.credits.set(msg.author.id, client.credits.get(msg.author.id, "credits") - credits, "credits"); //Remove the specified amount of credits from the user's account

        msg.channel.send(`You used **${credits}** credits to play trivia!`);

        return newQuestion(); //Get a question

        async function newQuestion() {
            const {
                body
            } = await get('https://opentdb.com/api.php?amount=1&encode=url3986'); //Get the question info. The question is retrieved in RFC 3986 and decoded later to avoid issues with the default format

            var answers = body.results[0].incorrect_answers; //Get the incorrect answers in an array

            answers.push(body.results[0].correct_answer); //Add the correct answer to the array

            shuffle(answers); //Randomize the order of the answers

            var i = 0; //Set a variable for the answer number

            var numbers = []; //An array that will contain the total number of answers

            var correctNumber = null; //Set a blank variable that will store the number of the correct answer

            answers = answers.map((a) => { //Get all the answers
                +i; //Increment the counter by one

                numbers.push(i = i + 1); //Add the current number to the array

                if (a === body.results[0].correct_answer) { //Add the correct answer to the variable
                    correctNumber = i;
                };

                return `${`**${i}.**`} ${a}`; //Format the message correctly
            }).join('\n');

            const questionEmbed = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle(decodeURIComponent(body.results[0].question))
                .setDescription(`Category: \`${decodeURIComponent(body.results[0].category)}\`, Difficulty: \`${decodeURIComponent(body.results[0].difficulty)}\``)
                .addField("Answers", decodeURIComponent(answers), true)
                .setFooter(`Respond with ${numbers.join(", ")} to select an answer! You have 30 seconds`);

            msg.channel.send({
                embed: questionEmbed
            });

            const filter = m => m.author.id === msg.author.id && numbers.join(",").includes(m.content); //Create a filter that only accepts messages from the original author and that includes a valid answer

            msg.channel.awaitMessages(filter, {
                max: 1,
                time: 30000,
                errors: ['time']
            }).then(collected => {
                if (collected.first().content == correctNumber) { //Check if the correct answer was given
                    ++streak //Add 1 to the members streak

                    msg.channel.send(`You got it right! Your streak is now ${streak}`);

                    return newQuestion(); //Get a new question
                } else {
                    var earnedCredits = credits * streak;

                    if (earnedCredits > 5000) {
                        earnedCredits = 5000;
                    };

                    client.credits.set(msg.author.id, client.credits.get(msg.author.id, "credits") + earnedCredits, "credits"); //Set the credits

                    const failEmbed = new Discord.MessageEmbed() //End the game if the user gave the wrong answer
                        .setTitle("Game Over")
                        .setColor(config.embedColor)
                        .setDescription("That was the wrong answer!")
                        .addField("Correct Answer", `${decodeURIComponent(body.results[0].correct_answer)}`, true)
                        .addField("Your Streak", streak, true)
                        .addField("Credits Earned", earnedCredits, true);

                    return msg.channel.send({
                        embed: failEmbed
                    });
                };
            }).catch(e => {
                var earnedCredits = credits * streak;

                if (earnedCredits > 5000) {
                    earnedCredits = 5000;
                };

                client.credits.set(msg.author.id, client.credits.get(msg.author.id, "credits") + earnedCredits, "credits"); //Set the credits

                const timeEmbed = new Discord.MessageEmbed() //End the game if the user ran out of time
                    .setTitle("Game Over")
                    .setColor(config.embedColor)
                    .setDescription("You ran out of time!")
                    .addField("Correct Answer", `${decodeURIComponent(body.results[0].correct_answer)}`, true)
                    .addField("Your Streak", streak, true)
                    .addField("Credits Earned", earnedCredits, true);

                return msg.channel.send({
                    embed: timeEmbed
                });
            });
        };

        function shuffle(a) { //Uses the Fisher–Yates shuffle algorithm
            var j, x, i;

            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));

                x = a[i];

                a[i] = a[j];

                a[j] = x;
            };

            return a;
        };
    },
};