const { CARD_PER_PAGE, SCORE_REQUIRED } = require('../constants');
const { localIdToAlias } = require('./card-utils');

const TEXT = {
	SUGGESTION: {
		VALIDATE: 'Valider',
		VALIDATED: 'Validé',
		CANCEL: 'Annuler',
		CANCELLED: 'Annulé'
	},
	CARD: {
		APPROVE: 'Approuver',
		APPROVED: 'Approuvé',
		REJECT: 'Rejeter',
		REJECTED: 'Rejeté',
		CLAIM: 'Attraper',
		CLAIMED: 'Attrapé'
	}
};

/** @param {number} rarity */
function generateRarityStar(rarity) {
	let textRarity = '';

	for (let i = 0; i < rarity; i++) {
		textRarity += '\u2b50'; // Émoji étoile
	}

	return textRarity;
}

module.exports = {
	TEXT,

	/** @param {import('../dto/AbstractCardDTO')} abstractCard */
	generateSpawnMessageContent(abstractCard) {
		/** @type {import('discord.js').MessageOptions} */
		const reply = {
			embeds: [{
				image: {
					url: abstractCard.imageURL
				},
				author: {
					name: 'Spawn !',
					icon_url: 'https://upload.wikimedia.org/wikipedia/en/9/96/Meme_Man_on_transparent_background.webp'
				},
				fields: [{
					name: 'Nom:',
					value: abstractCard.name
				}, {
					name: 'Rareté:',
					value: generateRarityStar(abstractCard.rarity)
				}]
			}],
			components: [{
				type: 'ACTION_ROW',
				components: [{
					type: 'BUTTON',
					customId: 'claim',
					label: TEXT.CARD.CLAIM,
					style: 'PRIMARY'
				}]
			}]
		};

		return reply;
	},

	/**
	 * @param {import('discord.js').User} user
	 * @param {import('../dto/InventoryCardDTO')[]} inventoryCards
	 * @param {Map<number, import('../dto/CardTemplateDTO')>} mapCardTemplates
	 * @param {number} page
	 * @param {number} maxPage
	 */
	generateInventoryMessageContent(user, inventoryCards, mapCardTemplates, page, maxPage) {
		const description = inventoryCards.map(inventoryCard =>
			`\`${localIdToAlias(inventoryCard.localId)}\` | ${mapCardTemplates.get(inventoryCard.cardTemplateId).name}`
		).join('\n');

		/** @type {import('discord.js').MessageOptions} */
		const reply = {
			embeds: [{
				author: {
					name: `Liste de ${user.username}`,
					icon_url: user.displayAvatarURL({ dynamic: true, size: 32 })
				},
				description,
				footer: {
					text: `Page ${page + 1}/${maxPage + 1} ; Jusqu'à ${CARD_PER_PAGE} résultats par page`
				}
			}]
		};

		return reply;
	},

	/**
	 * @param {import('discord.js').User} user
	 * @param {import('../dto/InventoryCardDTO')} inventoryCard
	 * @param {import('../dto/CardTemplateDTO')} cardTemplate
	 */
	generateViewMessageContent(user, inventoryCard, cardTemplate) {
		const generalInformations = [
			`\`ID    :\` **${cardTemplate.id}**`,
			`\`Rareté:\` ${generateRarityStar(cardTemplate.rarity)}`
		];

		const personalInformations = [
			`\`Alias:    \` \`${localIdToAlias(inventoryCard.localId)}\``,
			`\`Détenteur:\` <@${user.id}>`
		];

		/** @type {import('discord.js').MessageOptions} */
		const reply = {
			embeds: [{
				image: {
					url: cardTemplate.imageURL
				},
				author: {
					name: cardTemplate.name
				},
				fields: [{
					name: '__Informations générales__',
					value: generalInformations.join('\n')
				}, {
					name: '__Informations personnelles__',
					value: personalInformations.join('\n')
				}]
			}]
		};

		return reply;
	},

	/** @param {import('../dto/TemporaryCardSuggestionDTO')} suggestedCard */
	generateSuggestionPrevisualisationMessageContent(suggestedCard) {
		const realSpawn = module.exports.generateSpawnMessageContent(suggestedCard);
		/** @type {import('discord.js').MessageOptions} */
		const reply = {
			content: `Aperçu de la carte, cliquez sur "${TEXT.SUGGESTION.VALIDATE}" pour lancer le processus de validation ou "${TEXT.SUGGESTION.CANCEL}" si cette carte ne vous convient pas`,
			embeds: realSpawn.embeds,
			components: [{
				type: 'ACTION_ROW',
				components: [{
					type: 'BUTTON',
					customId: 'validateSuggestion',
					label: TEXT.SUGGESTION.VALIDATE,
					style: 'SUCCESS'
				}, {
					type: 'BUTTON',
					customId: 'cancelSuggestion',
					label: TEXT.SUGGESTION.CANCEL,
					style: 'DANGER'
				}]
			}]
		};

		return reply;
	},

	/** @param {import('../dto/AbstractCardDTO')} abstractCard */
	generateSuggestionReviewMessageContent(abstractCard, score = 0) {
		const realSpawn = module.exports.generateSpawnMessageContent(abstractCard);
		realSpawn.embeds[0].fields.push({
			name: 'Score :',
			value: `${score} / ${SCORE_REQUIRED}`
		});

		/** @type {import('discord.js').MessageOptions} */
		const reply = {
			content: `Proposition de carte, cliquez sur "${TEXT.CARD.APPROVE}" si vous voulez l'ajouter au bot, ou "${TEXT.CARD.REJECT}" sinon`,
			embeds: realSpawn.embeds,
			components: [{
				type: 'ACTION_ROW',
				components: [{
					type: 'BUTTON',
					customId: 'approveCard',
					label: TEXT.CARD.APPROVE,
					style: 'SUCCESS'
				}, {
					type: 'BUTTON',
					customId: 'rejectCard',
					label: TEXT.CARD.REJECT,
					style: 'DANGER'
				}]
			}]
		};

		return reply;
	},

	/**
	 * @param {import('../dto/ValidatedSuggestionDTO') validatedSuggestion}
	 * @param {number} score
	 */
	generateEditedApprovedMessageAfterVote(validatedSuggestion, score) {
		const realSpawn = module.exports.generateSuggestionReviewMessageContent(validatedSuggestion);
		realSpawn.embeds[0].fields.push({
			name: 'Score :',
			value: `${score} / ${SCORE_REQUIRED}`
		});

		return realSpawn;
	}
};