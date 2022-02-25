const { SlashCommandBuilder } = require('@discordjs/builders');
const AbstractCardDTO = require('../dto/AbstractCardDTO');
const CardSuggestionDTO = require('../dto/CardSuggestionDTO');
const { generateSuggestionPrevisualisationMessageContent } = require('../utils/message-utils');

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
		} else if (suggestedRarity < 1 || suggestedRarity > 5) {
			return await interaction.reply('La rareté doit être comprise entre 1 et 5');
		}

		const temporaryCardSuggestion = new AbstractCardDTO(suggestedName, suggestedImageURL, suggestedRarity);
		const previewMessage = await interaction.reply({
			...generateSuggestionPrevisualisationMessageContent(temporaryCardSuggestion),
			fetchReply: true
		});

		interaction.client.temporaryCardSuggestions.set(previewMessage.id, new CardSuggestionDTO(previewMessage.id, interaction.user.id, suggestedName, suggestedImageURL, suggestedRarity));
	}
};