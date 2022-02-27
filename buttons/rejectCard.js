const SuggestionVoteDTO = require('../dto/SuggestionVoteDTO');
const { bold } = require('@discordjs/builders');
const { saveSuggestionVote, countVotesAndValidateSuggestion } = require('../utils/database-utils');
const { generateSuggestionReviewMessageContent, TEXT } = require('../utils/message-utils');
const { getValueInt: getGlobalConfigValueInt } = require('../utils/global-config-cache');

module.exports = {
	name: 'rejectcard',

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async execute(interaction) {
		const suggestionVote = new SuggestionVoteDTO(interaction.user.id, interaction.message.id, false);
		await saveSuggestionVote(suggestionVote);

		const VOTES_REQUIRED = await getGlobalConfigValueInt('VOTES_REQUIRED');
		const { positiveVotes, negativeVotes, cardSuggestion } = await countVotesAndValidateSuggestion(suggestionVote, VOTES_REQUIRED);
		const originalMessage = await interaction.channel.messages.fetch(interaction.message.id);

		await interaction.reply({
			content: `Votre vote a été pris en compte, vous avez \u274c ${bold('rejeté')} cette carte`,
			ephemeral: true
		});

		const editedMessage = generateSuggestionReviewMessageContent(cardSuggestion, VOTES_REQUIRED, positiveVotes, negativeVotes);

		if (negativeVotes >= VOTES_REQUIRED) {
			await originalMessage.edit({
				content: 'Carte rejetée !',
				embeds: editedMessage.embeds,
				components: [{
					type: 'ACTION_ROW',
					components: [{
						type: 'BUTTON',
						customId: 'rejectcard',
						label: TEXT.CARD.REJECTED,
						style: 'DANGER',
						disabled: true
					}]
				}]
			});
		} else {
			await originalMessage.edit(editedMessage);
		}
	}
};