module.exports = {
	name: 'invite',
	description: 'Invite me to your server!',
	category: 'Utilities',
	async execute(msg, args) {
		var mess = await msg.channel.send("Getting your invite link...");

		mess.edit(`Invite me to your server! <http://epixbot.gq/> \n\nYou can also join my support server by clicking this link: https://discord.gg/cFv5urj`);
	},
};