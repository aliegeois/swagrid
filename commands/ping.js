const { SlashCommandBuilder } = require('@discordjs/builders');

/** @type {import('../SwagridClient').SwagridCommand} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Répond par Pong !'),

	async execute(interaction, client) {
		const apiMessage = await interaction.reply({
			content: 'Pinging...',
			fetchReply: true
		});
		const interactionChannel = await client.channels.fetch(interaction.channelId);
		const message = await interactionChannel.messages.fetch(apiMessage.id);

		return interaction.editReply(`Pong ! (Application: ${message.createdTimestamp - interaction.createdTimestamp}ms. WebSocket: ${client.ws.ping}ms)`);
	}
};