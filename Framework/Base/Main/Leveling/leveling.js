const cooldown = new Set();

module.exports = {
    handleLvl(msg) {
        const key = `${msg.guild.id}-${msg.author.id}`;

        client.points.ensure(`${msg.guild.id}-${msg.author.id}`, { //Set the default settings for points
            user: msg.author.id,
            guild: msg.guild.id,
            points: 0,
            level: 1
        });

        if (!cooldown.has(`${msg.author.id} | ${msg.guild.id}`)) { //If the member is in the cooldown list, don't do anything. Otherwise add them to the cooldown
            cooldown.add(`${msg.author.id} | ${msg.guild.id}`);

            setTimeout(() => { //Add a user to the cooldown for 2 minutes
                cooldown.delete(`${msg.author.id} | ${msg.guild.id}`);
            }, 120000);

            var pointsToAdd = Math.floor(Math.random() * (25 - 5 + 1)) + 5; //Get a random amount of points from 5 to 25

            client.points.set(key, client.points.get(key, "points") + pointsToAdd, "points"); //Add the points to the user's score
        };

        const curLevel = Math.floor(0.1 * Math.sqrt(client.points.get(key, "points"))); //Get the users current level

        if (client.points.get(key, "level") < curLevel) { //Figure out if the user leveled up
            if (msg.guild.me.hasPermission('SEND_MESSAGES')) { //Send an error if the bot doesn't have permissions
                msg.reply(`Noice. you've leveled up to **${curLevel}**!`);
            };

            client.points.set(key, curLevel, "level");
        };

        if (client.points.get(key, "level") > curLevel) { //Make sure there are no issues with levels being too low
            client.points.set(key, curLevel, "level");
        };
    }
}