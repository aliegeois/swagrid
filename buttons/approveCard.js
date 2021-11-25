const { SCORE_REQUIRED } = require('../constants');
const SuggestionVoteDTO = require('../dto/SuggestionVoteDTO');
const { saveSuggestionVoteAndCalculateScore } = require('../utils/database-utils');
const { generateSpawnMessageContent } = require('../utils/message-utils');

/**
 * @param {import('discord.js').Message} message
 * @param {import('../dto/ValidatedSuggestionDTO') validatedSuggestion}
 * @param {number} score
 */
async function editApprovedMessageAfterVote(message, validatedSuggestion, score) {
	const realSpawn = generateSpawnMessageContent(validatedSuggestion);
	realSpawn.embeds[0].fields.push({
		name: 'Score :',
		value: `${score} / ${SCORE_REQUIRED}`
	});

	await message.edit({
		content: 'Nouvelle carte approuvée !',
		embeds: realSpawn.embeds
	});
}

module.exports = {
	name: 'approveCard',

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async execute(interaction) {
		const { score, validatedSuggestion } = await saveSuggestionVoteAndCalculateScore(new SuggestionVoteDTO(interaction.user.id, interaction.message.id, true));

		if (score === null) {
			// Le calcul a échoué
			await interaction.reply('Échec du calcul du score :\'(');
			return;
		} else {
			await interaction.reply({
				content: 'Votre vote a été validé (vous avez **approuvé** cette carte)',
				ephemeral: true
			});

			if (score >= SCORE_REQUIRED) {
				// Approuver la carte
				interaction.reply('[approuvé]');
			} else {
				await editApprovedMessageAfterVote(interaction.message, validatedSuggestion, score);
			}
		}
	}
};