const { bold, userMention, underscore, inlineCode } = require('@discordjs/builders');
const { MessageAttachment } = require('discord.js');
const { MAX_RARITY } = require('../constants');
const { localIdToAlias } = require('./cardUtils');

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
function generateRarityText(rarity) {
	// ⭐
	return '\u2b50'.repeat(rarity);
}

function generateRarityWithBlackSquaresText(rarity) {
	return '\u2b50'.repeat(rarity) + '\u2b1b'.repeat(MAX_RARITY - rarity);
}

/**
 * @param {number} votesRequired
 * @param {number} positiveVotes
 * @param {number} negativeVotes
 */
function generateVotesText(votesRequired, positiveVotes, negativeVotes) {
	// ⬛ ❌ ✅ ⬛
	return '|' + '\u2b1b'.repeat(votesRequired - negativeVotes) + '\u274c'.repeat(negativeVotes) + '|' + '\u2705'.repeat(positiveVotes) + '\u2b1b'.repeat(votesRequired - positiveVotes) + '|';
}

module.exports = {
	TEXT,

	/**
	 * @param {import('../dto/AbstractCardDTO')} abstractCard
	 * @returns {import('discord.js').MessageOptions}
	 */
	generateSpawnMessageContent(abstractCard) {
		return {
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
					value: generateRarityText(abstractCard.rarity)
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
	},

	/**
	 * @param {import('discord.js').User} user
	 * @param {import('../dto/InventoryCardDTO')[]} inventoryCards
	 * @param {Map<number, import('../dto/CardTemplateDTO')>} mapCardTemplates
	 * @param {number} page
	 * @param {number} maxPage
	 * @param {number} cardPerPage
	 * @returns {import('discord.js').MessageOptions}
	 */
	generateInventoryMessageContent(user, inventoryCards, mapCardTemplates, page, maxPage, cardPerPage) { // TODO: rajouter des boutons page précédent/suivante, première/dernière page
		const description = inventoryCards.map(inventoryCard =>
			`${inlineCode(localIdToAlias(inventoryCard.localId))} | ${generateRarityWithBlackSquaresText(mapCardTemplates.get(inventoryCard.cardTemplateId).rarity)} | ${mapCardTemplates.get(inventoryCard.cardTemplateId).name}`
		).join('\n');

		return {
			embeds: [{
				author: {
					name: `Liste de ${user.username}`,
					icon_url: user.displayAvatarURL({ dynamic: true, size: 32 })
				},
				description,
				footer: {
					text: `Page ${page + 1}/${maxPage + 1} ; Jusqu'à ${cardPerPage} résultats par page`
				}
			}]
		};
	},

	/**
	 * @param {import('discord.js').User} user
	 * @param {import('../dto/InventoryCardDTO')} inventoryCard
	 * @param {import('../dto/CardTemplateDTO')} cardTemplate
	 * @returns {import('discord.js').MessageOptions}
	 */
	generateViewMessageContent(user, inventoryCard, cardTemplate) {
		const generalInformations = [
			`${inlineCode('Id :     ')} ${bold(cardTemplate.id)}`,
			`${inlineCode('Rareté : ')} ${generateRarityText(cardTemplate.rarity)}`
		];

		const personalInformations = [
			`${inlineCode('Alias :     ')} ${inlineCode(localIdToAlias(inventoryCard.localId))}`,
			`${inlineCode('Détenteur : ')} ${userMention(user.id)}`
		];

		return {
			embeds: [{
				image: {
					url: cardTemplate.imageURL
				},
				author: {
					name: cardTemplate.name
				},
				fields: [{
					name: underscore('Informations générales'),
					value: generalInformations.join('\n')
				}, {
					name: underscore('Informations personnelles'),
					value: personalInformations.join('\n')
				}]
			}]
		};
	},

	/**
	 * @param {import('../dto/AbstractCardDTO')} card
	 * @param {import('discord.js').MessageAttachment} attachment
	 * @returns {import('discord.js').MessageOptions}
	 */
	generateSuggestionPreviewMessageContent(card) {
		const attachment = new MessageAttachment(Buffer.from(card.imageURL, 'base64'), `${card.name}.png`);

		return {
			content: `Aperçu de la carte, cliquez sur "${TEXT.SUGGESTION.VALIDATE}" pour lancer le processus de validation ou "${TEXT.SUGGESTION.CANCEL}" si cette carte ne vous convient pas`,
			embeds: [{
				image: {
					url: `attachment://${attachment.name}`
				},
				author: {
					name: 'Suggestion',
					icon_url: 'https://upload.wikimedia.org/wikipedia/en/9/96/Meme_Man_on_transparent_background.webp'
				},
				fields: [{
					name: 'Nom:',
					value: card.name
				}, {
					name: 'Rareté:',
					value: generateRarityText(card.rarity)
				}]
			}],
			components: [{
				type: 'ACTION_ROW',
				components: [{
					type: 'BUTTON',
					customId: 'validatesuggestion',
					label: TEXT.SUGGESTION.VALIDATE,
					style: 'SUCCESS'
				}, {
					type: 'BUTTON',
					customId: 'cancelsuggestion',
					label: TEXT.SUGGESTION.CANCEL,
					style: 'DANGER'
				}]
			}],
			files: [ attachment ]
		};
	},

	/**
	 * @param {import('../dto/AbstractCardDTO')} abstractCard
	 * @param {number} votesRequired
	 * @returns {import('discord.js').MessageOptions}
	 */
	generateSuggestionReviewMessageContent(abstractCard, votesRequired, positiveVotes = 0, negativeVotes = 0) {
		return {
			content: `Proposition de carte, cliquez sur "${TEXT.CARD.APPROVE}" si vous voulez l'ajouter au bot, ou "${TEXT.CARD.REJECT}" sinon`,
			embeds: [{
				image: {
					url: abstractCard.imageURL
				},
				author: {
					name: 'Suggestion',
					icon_url: 'https://upload.wikimedia.org/wikipedia/en/9/96/Meme_Man_on_transparent_background.webp'
				},
				fields: [{
					name: 'Nom:',
					value: abstractCard.name
				}, {
					name: 'Rareté:',
					value: generateRarityText(abstractCard.rarity)
				}, {
					name: 'Votes :',
					value: generateVotesText(votesRequired, positiveVotes, negativeVotes)
				}]
			}],
			components: [{
				type: 'ACTION_ROW',
				components: [{
					type: 'BUTTON',
					customId: 'approvecard',
					label: TEXT.CARD.APPROVE,
					style: 'SUCCESS'
				}, {
					type: 'BUTTON',
					customId: 'rejectcard',
					label: TEXT.CARD.REJECT,
					style: 'DANGER'
				}]
			}]
		};
	},

	/**
	 * @param {import('../dto/CardSuggestionDTO')} validatedSuggestion
	 * @param {number} votesRequired
	 * @param {number} positiveVotes
	 * @param {number} negativeVotes
	 */
	generateEditedApprovedMessageAfterVote(validatedSuggestion, votesRequired, positiveVotes, negativeVotes) {
		return {
			content: `Proposition de carte, cliquez sur "${TEXT.CARD.APPROVE}" si vous voulez l'ajouter au bot, ou "${TEXT.CARD.REJECT}" sinon`,
			embeds: [{
				image: {
					url: validatedSuggestion.imageURL
				},
				author: {
					name: 'Suggestion',
					icon_url: 'https://upload.wikimedia.org/wikipedia/en/9/96/Meme_Man_on_transparent_background.webp'
				},
				fields: [{
					name: 'Nom:',
					value: validatedSuggestion.name
				}, {
					name: 'Rareté:',
					value: generateRarityText(validatedSuggestion.rarity)
				}, {
					name: 'Votes :',
					value: generateVotesText(votesRequired, positiveVotes, negativeVotes)
				}, {
					name: 'Votes :',
					value: generateVotesText(votesRequired, positiveVotes, negativeVotes)
				}]
			}],
			components: [{
				type: 'ACTION_ROW',
				components: [{
					type: 'BUTTON',
					customId: 'approvecard',
					label: TEXT.CARD.APPROVE,
					style: 'SUCCESS'
				}, {
					type: 'BUTTON',
					customId: 'rejectcard',
					label: TEXT.CARD.REJECT,
					style: 'DANGER'
				}]
			}]
		};
	},

	/** @param {import('../dto/AbstractCardDTO')} abstractCard */
	generateApprovedMessage(abstractCard) {
		return {
			embeds: [{
				image: {
					url: abstractCard.imageURL
				},
				author: {
					name: 'Nouvelle carte approuvée !',
					icon_url: 'https://upload.wikimedia.org/wikipedia/en/9/96/Meme_Man_on_transparent_background.webp'
				},
				fields: [{
					name: 'Nom:',
					value: abstractCard.name
				}, {
					name: 'Rareté:',
					value: generateRarityText(abstractCard.rarity)
				}]
			}]
		};
	},

	/**
	 * @param {import('../dto/CardTemplateDTO')} cardTemplate
	 * @returns {import('discord.js').MessageOptions}
	 */
	generateInfoMessage(cardTemplate) {
		const generalInformations = [
			`${inlineCode('Nom :    ')} ${bold(cardTemplate.name)}`,
			`${inlineCode('Id :     ')} ${bold(cardTemplate.id)}`,
			`${inlineCode('Rareté : ')} ${generateRarityText(cardTemplate.rarity)}`
		];

		return {
			embeds: [{
				image: {
					url: cardTemplate.imageURL
				},
				fields: [{
					name: underscore('Informations générales'),
					value: generalInformations.join('\n')
				}]
			}]
		};
	},

	/**
	 * @param {string[]} files
	 * @returns {import('discord.js').MessageOptions}
	 */
	generateTemporaryImagesMessageContent(files) {
		return {
			embeds: [{
				author: {
					name: 'Liste de des images temporaires'
				},
				description: files.join('\n')
			}]
		};
	}
};