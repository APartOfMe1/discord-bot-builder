module.exports = {
  name: 'prune',
  description: 'Bulk delete messages',
  aliases: ['purge'],
  category: 'Moderation',
  usage: '`{prefix}prune <number>`',
  examples: '`{prefix}prune 15`',
  async execute(msg, args) {

    if (!msg.member.hasPermission('MANAGE_MESSAGES')) { //If the author can't delete messages, send an error
      return msg.reply("Sorry! You can't prune messages");
    };

    if (!msg.guild.me.hasPermission('MANAGE_MESSAGES ')) { //Send an error if the bot doesn't have permissions
      return msg.author.send(`I can't delete messages! I need the \`Manage Messages\` permission`);
    };

    const deleteCount = parseInt(args[0], 10); //Get the number of messages to delete

    if (!deleteCount || deleteCount < 2 || deleteCount > 100) { //Check if the number of messages to delete is greater than 1, and less than 100
      return msg.reply("Please provide a number between 2 and 100 for the number of messages to delete");
    };

    const fetched = await msg.channel.messages.fetch({ //Get the specified number of messages
      limit: deleteCount
    });

    msg.channel.bulkDelete(fetched)
      .catch(error => msg.reply(`Couldn't delete messages because of: ${error}`));
  },
};