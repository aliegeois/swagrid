const { SlashCommandBuilder } = require('@discordjs/builders');
const TemporaryCardSuggestionDTO = require('../dto/TemporaryCardSuggestionDTO');
const { createTemporaryCardSuggestion } = require('../utils/database-utils');
const { generateSuggestionPrevisualisationMessageContent } = require('../utils/message-utils');

class FakeTemporaryCard extends TemporaryCardSuggestionDTO {
	/**
	 * @param {string} name
	 * @param {string} imageURL
	 * @param {number} rarity
	 */
	constructor(name, imageURL, rarity) {
		super(null, name, imageURL, rarity);
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('suggest')
		.setDescription('Suggère une carte au gacha')
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('Le nom de la carte')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('url')
				.setDescription('L\'URL vers l\'image de la carte')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('rarity')
				.setDescription('La rareté de la carte (1-5)')
				.setRequired(false)),

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		const suggestedName = interaction.options.getString('name');
		if (suggestedName.length >= 256) {
			return interaction.reply('Le nom de la carte doit faire moins de 256 caractères !');
		}

		const suggestedImageURL = interaction.options.getString('url');
		if (suggestedImageURL.length >= 256) {
			return interaction.reply('L\'URL doit faire moins de 256 caractères !');
		}

		let suggestedRarity = interaction.options.getInteger('rarity');
		if (suggestedRarity === null) {
			suggestedRarity = Math.floor(Math.random() * 3) + 2; // [2 - 4]
		}

		const temporaryCardSuggestion = new FakeTemporaryCard(suggestedName, suggestedImageURL, suggestedRarity);
		const previewMessage = await interaction.reply({
			...generateSuggestionPrevisualisationMessageContent(temporaryCardSuggestion),
			fetchReply: true
		});

		await createTemporaryCardSuggestion(previewMessage.id, suggestedName, suggestedImageURL, suggestedRarity);
	}
};