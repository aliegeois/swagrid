const SuggestionVoteDTO = require('../dto/SuggestionVoteDTO');
const { bold } = require('@discordjs/builders');
const { saveSuggestionVote, countVotesAndValidateSuggestion, findGuildConfigById } = require('../utils/database-utils');
const { generateSuggestionReviewMessageContent, TEXT, generateApprovedMessage } = require('../utils/message-utils');
const cache = require('../cache');

module.exports = {
	name: 'approvecard',

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async execute(interaction) {
		const suggestionVote = new SuggestionVoteDTO(interaction.user.id, interaction.message.id, true);
		await saveSuggestionVote(suggestionVote);

		const votesRequired = await cache.get('VOTES_REQUIRED');
		const { positiveVotes, negativeVotes, cardSuggestion } = await countVotesAndValidateSuggestion(suggestionVote, votesRequired);
		const originalMessage = await interaction.channel.messages.fetch(interaction.message.id);

		await interaction.reply({
			content: `Votre vote a été pris en compte, vous avez \u2705 ${bold('approuvé')} cette carte`,
			ephemeral: true
		});

		const editedMessage = generateSuggestionReviewMessageContent(cardSuggestion, votesRequired, positiveVotes, negativeVotes);

		if (positiveVotes >= votesRequired) {
			await originalMessage.edit({
				content: 'Carte approuvée !',
				embeds: editedMessage.embeds,
				components: [{
					type: 'ACTION_ROW',
					components: [{
						type: 'BUTTON',
						customId: 'approvecard',
						label: TEXT.CARD.APPROVED,
						style: 'SUCCESS',
						disabled: true
					}]
				}]
			});

			const guildConfig = await findGuildConfigById(interaction.guildId);
			if (guildConfig !== null && guildConfig.approvedCardsChannelId !== null) {
				const approvedCardsChannel = await interaction.guild.channels.fetch(guildConfig.approvedCardsChannelId);

				if (approvedCardsChannel !== undefined) {
					await approvedCardsChannel.send(generateApprovedMessage(cardSuggestion));
				}
			} else {
				await interaction.channel.send('La carte a été validée, mais il n\'existe pas de channel dans lequel la montrer');
			}
		} else {
			await originalMessage.edit(editedMessage);
		}
	}
};