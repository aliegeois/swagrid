const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { ApplicationCommandType } = require('discord-api-types/v9');


module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('list')
		.setType(ApplicationCommandType.User),

	/**
	 * @param {import('discord.js').ContextMenuInteraction} interaction
	 * @param {import('../SwagridClient')} client
	 */
	async execute(interaction, client) {
		const executingUser = await client.users.fetch(interaction.targetId);
		interaction.user = executingUser;
		client.commands.get('list').execute(interaction);
	}
};