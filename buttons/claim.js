const { userMention, bold } = require('@discordjs/builders');
const { localIdToAlias } = require('../utils/cardUtils');
const { findOngoingSpawnById, claimCardAndAddItToInventory, findCardTemplateById } = require('../utils/databaseUtils');
const { generateSpawnMessageContent } = require('../utils/messageUtils');

/**
 * Revendique la carte et l'ajoute à l'inventaire de l'utilisateur
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @param {import('discord.js').User} user
 */
async function retrieveAndClaimCard(channel, user) {
	const ongoingSpawn = await findOngoingSpawnById(channel.id);

	if (ongoingSpawn === null) {
		// Si la carte n'existe plus en base, on annule tout
		return null;
	}

	return claimCardAndAddItToInventory(ongoingSpawn, user.id);
}

/**
 * Prévient un utilisateur que la carte qu'il a tenté d'attraper appartient déjà à quelqu'un d'autre
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {import('discord.js').User} poorUser
 */
async function notifyUserCardAlreadyClaimed(interaction, poorUser) {
	await interaction.reply(`Désolé ${userMention(poorUser.id)}, cette carte a déjà été attrapée !`);
}

/**
 * Édite le message d'apparition pour dire que la carte a été attrapée
 *
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').User} claimingUser
 * @param {import('../dto/InventoryCardDTO')} createdCard
 * @param {import('../dto/CardTemplateDTO')} createdCardTemplate
 */
async function editSpawnMessageAfterClaim(message, claimingUser, createdCard, createdCardTemplate) {
	const originalMessage = generateSpawnMessageContent(createdCardTemplate);
	originalMessage.embeds[0].author = {
		name: `Attrapé par : ${claimingUser.username}`,
		icon_url: claimingUser.displayAvatarURL({ dynamic: true, size: 32 })
	};
	originalMessage.embeds[0].fields[0].value = `\`${localIdToAlias(createdCard.localId)}\` | ${createdCardTemplate.name}`;
	await message.edit({
		...originalMessage,
		components: []
	});
}

/**
 * Envoie un message mentionnant l'utilisateur qui vient d'attraper une carte
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {import('discord.js').User} claimingUser
 * @param {import('../dto/CardTemplateDTO')} createdCardTemplate
 */
async function notifyUserAfterClaim(interaction, claimingUser, createdCardTemplate) {
	await interaction.reply(`Bien joué ! ${userMention(claimingUser.id)} a attrapé ${bold(createdCardTemplate.name)} !`);
}

/** @type {import('../SwagridClient').SwagridButton} */
module.exports = {
	name: 'claim',

	async execute(interaction) {
		const createdCard = await retrieveAndClaimCard(interaction.channel, interaction.user);
		if (createdCard === null) {
			// Envoyer un message disant que cette carte a déjà été attrapée entre temps
			await notifyUserCardAlreadyClaimed(interaction, interaction.user);
		} else {
			// Récupère le template de la carte créée
			const createdCardTemplate = await findCardTemplateById(createdCard.cardTemplateId);
			// Si la carte existe, on édite le message prévenant de l'apparition ...
			await editSpawnMessageAfterClaim(interaction.message, interaction.user, createdCard, createdCardTemplate);
			// ... et on notifie l'utilisateur qu'il a attrapé une nouvelle carte
			await notifyUserAfterClaim(interaction, interaction.user, createdCardTemplate);
		}
	}
};