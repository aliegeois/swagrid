const { SlashCommandBuilder } = require('@discordjs/builders');
const { MAX_RARITY } = require('../constants');
const AbstractCardDTO = require('../dto/AbstractCardDTO');
const CardSuggestionDTO = require('../dto/CardSuggestionDTO');
const { generateSuggestionPrevisualisationMessageContent } = require('../utils/message-utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('suggest')
		.setDescription('Suggère une carte au gacha')
		.addStringOption(option =>
			option
				.setName('nom')
				.setDescription('Le nom de la carte')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('url')
				.setDescription('L\'URL vers l\'image de la carte')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('rareté')
				.setDescription(`La rareté de la carte (1-${MAX_RARITY})`)
				.setRequired(true)),

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

		const suggestedRarity = interaction.options.getInteger('rarity');
		if (suggestedRarity < 1 || suggestedRarity > MAX_RARITY) {
			return interaction.reply(`La rareté doit être comprise entre 1 et ${MAX_RARITY}`);
		}

		const temporaryCardSuggestion = new AbstractCardDTO(suggestedName, suggestedImageURL, suggestedRarity);
		const previewMessage = await interaction.reply({
			...generateSuggestionPrevisualisationMessageContent(temporaryCardSuggestion),
			fetchReply: true
		});

		interaction.client.temporaryCardSuggestions.set(previewMessage.id, new CardSuggestionDTO(previewMessage.id, interaction.user.id, suggestedName, suggestedImageURL, suggestedRarity));
	}
};