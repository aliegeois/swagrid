const { MAX_POINTS, MAX_TIME_BETWEEN_MESSAGE, MIN_TIME_BETWEEN_MESSAGE, MIN_POINTS_TO_ADD, SPAWN_THRESHOLD } = require('../constants.js');
const OngoingSpawnDTO = require('../dto/OngoingSpawnDTO.js');
const { findGuildConfigById, findRandomCardTemplate, deletePreviousCardAndReturnMessageId, saveOngoingSpawn } = require('../utils/database-utils.js');
const { generateSpawnMessageContent } = require('../utils/message-utils.js');

/**
 * Supprime une éventuelle précédente carte toujours active du channel
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 */
async function deletePreviousCard(channel) {
	const messageId = await deletePreviousCardAndReturnMessageId(channel.id);
	if (messageId !== null) {
		try {
			const spawnMessage = await channel.messages.fetch(messageId);

			await spawnMessage.edit({
				components: [{
					type: 'ACTION_ROW',
					components: [{
						type: 'BUTTON',
						label: 'Expiré',
						disabled: true,
						emoji: '❌'
					}]
				}]
			});
		} catch (error) {
			// Le message a été supprimé donc fetch lève une erreur
			console.error(error);
		}
	}
}

/**
 * Envoie le message indiquant qu'une carte est apparue
 *
 * @param {import('../dto/CardTemplateDTO')} cardTemplate
 * @param {import('discord.js').GuildTextBasedChannel} channel
 */
function sendSpawnMessage(cardTemplate, channel) {
	return channel.send(generateSpawnMessageContent(cardTemplate));
}

/**
 * @param {import('discord.js').GuildTextBasedChannel} channel Le channel dans lequel la carte doit apparaître
 */
async function spawnCard(channel) {
	await deletePreviousCard(channel);
	const cardTemplate = await findRandomCardTemplate();
	if (cardTemplate !== null) {
		const spawnMessage = await sendSpawnMessage(cardTemplate, channel);
		const ongoingSpawn = new OngoingSpawnDTO(channel.id, cardTemplate.id, spawnMessage.id);
		await saveOngoingSpawn(ongoingSpawn);
	} else {
		console.warn('Aucun template dans la BDD !');
	}
}

module.exports = {
	name: 'messageCreate',

	/** @param {import('discord.js').Message} message */
	async execute(message) {
		if (message.author.bot) {
			return;
		}

		let data = message.client.lastMessageSent.find(lms => lms.userId === message.author.id && lms.guildId === message.guildId);
		let pointsToAdd;
		if (data === undefined) {
			data = {
				userId: message.author.id,
				guildId: message.guildId,
				createdTimestamp: message.createdTimestamp
			};
			pointsToAdd = MAX_POINTS;
			message.client.lastMessageSent.push(data);
		} else {
			const timeDifference = message.createdTimestamp - data.createdTimestamp;
			data.createdTimestamp = message.createdTimestamp;

			if (timeDifference >= MAX_TIME_BETWEEN_MESSAGE) {
				// Si le message date de plus de 5 minutes
				pointsToAdd = MAX_POINTS;
			} else if (timeDifference < MIN_TIME_BETWEEN_MESSAGE) {
				// Si le message date de moins de 10 secondes
				pointsToAdd = MIN_POINTS_TO_ADD;
			} else {
				pointsToAdd = Math.round((timeDifference - MIN_TIME_BETWEEN_MESSAGE) * MAX_POINTS / (MAX_TIME_BETWEEN_MESSAGE - MIN_TIME_BETWEEN_MESSAGE));
			}
		}

		let guildCounter = message.client.messageCounter.has(message.guildId) ? message.client.messageCounter.get(message.guildId) : 0;
		guildCounter += pointsToAdd;

		if (guildCounter >= SPAWN_THRESHOLD) {
			// On récupère la config de guilde pour savoir où faire apparaître la carte
			const guildConfig = await findGuildConfigById(message.guildId);

			if (guildConfig !== null && guildConfig.spawnChannelId !== null) {
				const channel = await message.client.channels.fetch(guildConfig.spawnChannelId);
				if (channel !== null) {
					// Si un channel de spawn est configuré, on fait apparaître une carte
					await spawnCard(channel);
				}
			}
			guildCounter = 0;
		}

		message.client.messageCounter.set(message.guildId, guildCounter);
	}
};