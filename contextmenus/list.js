const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { ApplicationCommandType } = require('discord-api-types/v9');


module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('list')
		.setType(ApplicationCommandType.User),

	/** @param {import('discord.js').ContextMenuInteraction} interaction */
	async execute(interaction) {
		const executingUser = await interaction.client.users.fetch(interaction.targetId);
		interaction.user = executingUser;
		interaction.client.commands.get('list').execute(interaction);
	}
};