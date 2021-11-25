/** @param {import('discord.js').CommandInteraction} interaction */
async function executeCommand(client, interaction) {
	/** @type {command} */
	const command = client.commands.get(interaction.commandName);

	if (!command) {
		interaction.reply({
			content: `La commande n'a pas été trouvée (\`${interaction.commandName}\`)`,
			ephemeral: true }
		);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (exception) {
		console.error(exception);
		await interaction.reply({
			content: `Erreur lors de l'exécution de cette commande : (\`${exception.name}\`)`,
			ephemeral: true
		});
	}
}

/** @param {import('discord.js').ButtonInteraction} interaction */
async function executeButton(client, interaction) {
	const button = client.buttons.get(interaction.customId);

	if (!button) {
		return interaction.reply(`le bouton n'a pas été trouvé (\`${interaction.customId}\`)`);
	}

	try {
		await button.execute(interaction);
	} catch (exception) {
		console.error(exception);
		await interaction.reply({
			content: `Erreur lors de l'activation de ce bouton (\`${exception.name}\`)`,
			ephemeral: true
		});
	}
}

module.exports = {
	name: 'interactionCreate',

	/** @param {import('discord.js').Interaction} interaction */
	async execute(interaction) {
		if (interaction.isCommand()) {
			await executeCommand(interaction.client, interaction);
		} else if (interaction.isButton()) {
			await executeButton(interaction.client, interaction);
		} else {
			console.warn(`Type d'interaction inconnu (${interaction.type})`);
		}
	}
};