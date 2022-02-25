const OngoingSpawnDTO = require('../dto/OngoingSpawnDTO');
const { findGuildConfigById, findRandomCardTemplate, deletePreviousCardAndReturnMessageId, saveOngoingSpawn } = require('../utils/database-utils');
const { generateSpawnMessageContent } = require('../utils/message-utils');
const cache = require('../cache');

/**
 * Supprime une éventuelle précédente carte toujours active du channel
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 */
async function deletePreviousCard(channel) {
	const messageId = await deletePreviousCardAndReturnMessageId(channel.id);
	if (messageId !== null) {
		const spawnMessage = await channel.messages.fetch(messageId);

		if (spawnMessage !== null) {
			await spawnMessage.edit({
				components: [{
					type: 'ACTION_ROW',
					components: [{
						type: 'BUTTON',
						customId: 'claim',
						label: 'Expiré',
						style: 'SECONDARY',
						emoji: '❌',
						disabled: true
					}]
				}]
			});
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
		await saveOngoingSpawn(new OngoingSpawnDTO(channel.id, cardTemplate.id, spawnMessage.id));
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
			message.client.lastMessageSent.push(data);
			pointsToAdd = await cache.get('MAX_POINTS_TO_ADD');
		} else {
			const timeDifference = message.createdTimestamp - data.createdTimestamp;
			data.createdTimestamp = message.createdTimestamp;

			if (timeDifference >= (await cache.get('MAX_TIME_BETWEEN_MESSAGE'))) {
				// Si le message date de plus de 5 minutes
				pointsToAdd = await cache.get('MAX_POINTS_TO_ADD');
			} else if (timeDifference <= (await cache.get('MIN_TIME_BETWEEN_MESSAGE'))) {
				// Si le message date de moins de 10 secondes
				pointsToAdd = await cache.get('MIN_POINTS_TO_ADD');
			} else {
				pointsToAdd = Math.round((timeDifference - (await cache.get('MIN_TIME_BETWEEN_MESSAGE'))) * (await cache.get('MAX_POINTS_TO_ADD') - (await cache.get('MIN_POINTS_TO_ADD'))) / ((await cache.get('MAX_TIME_BETWEEN_MESSAGE')) - (await cache.get('MIN_TIME_BETWEEN_MESSAGE')))) + (await cache.get('MIN_POINTS_TO_ADD'));
			}
		}

		let guildCounter = message.client.messageCounter.has(message.guildId) ? message.client.messageCounter.get(message.guildId) : 0;
		guildCounter += pointsToAdd;
		console.log(`points to add: ${pointsToAdd}`);
		console.log(`guild total: ${guildCounter} / ${await cache.get('SPAWN_THRESHOLD')}`);

		if (guildCounter >= (await cache.get('SPAWN_THRESHOLD'))) {
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