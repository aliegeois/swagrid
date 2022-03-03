const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment } = require('discord.js');
const { MAX_RARITY } = require('../constants');
const AbstractCardDTO = require('../dto/AbstractCardDTO');
const CardSuggestionDTO = require('../dto/CardSuggestionDTO');
const { createImage } = require('../utils/imageUtils');
const { generateSuggestionPrevisualisationMessageContent } = require('../utils/messageUtils');

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

	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 * @param {import('../SwagridClient')} client
	 */
	async execute(interaction, client) {
		const suggestedName = interaction.options.getString('nom');
		if (suggestedName.length >= 256) {
			return interaction.reply('Le nom de la carte doit faire moins de 256 caractères !');
		}

		const suggestedImageURL = interaction.options.getString('url');
		if (suggestedImageURL.length >= 256) {
			return interaction.reply('L\'URL doit faire moins de 256 caractères !');
		}

		const suggestedRarity = interaction.options.getInteger('rareté');
		if (suggestedRarity < 1 || suggestedRarity > MAX_RARITY) {
			return interaction.reply(`La rareté doit être comprise entre 1 et ${MAX_RARITY}`);
		}

		await interaction.deferReply();

		const { imageURL, imageName } = await createImage(suggestedImageURL, suggestedRarity);
		const attachment = new MessageAttachment(imageURL, imageName);
		const temporaryCardSuggestion = new AbstractCardDTO(suggestedName, imageURL, suggestedRarity);
		const previewMessage = await interaction.editReply({
			...generateSuggestionPrevisualisationMessageContent(temporaryCardSuggestion, attachment),
			fetchReply: true
		});

		const cardSuggestion = new CardSuggestionDTO(previewMessage.id, interaction.user.id, suggestedName, imageURL, suggestedRarity);
		client.temporaryCardSuggestions.set(previewMessage.id, { cardSuggestion, attachment });
	}
};