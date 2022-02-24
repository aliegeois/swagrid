const { inlineCode } = require('@discordjs/builders');

/** @param {import('discord.js').CommandInteraction} interaction */
async function executeCommand(client, interaction) {
	/** @type {command} */
	const command = client.commands.get(interaction.commandName);

	if (command === undefined) {
		interaction.reply({
			content: `La commande n'a pas été trouvée (${inlineCode(interaction.commandName)})`,
			ephemeral: true }
		);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (exception) {
		console.error(exception);
		await interaction.member.send({
			content: `Erreur lors de l'exécution de cette commande : (${inlineCode(exception.name)})`
		});
	}
}

/**
 * @param {import('discord.js').ButtonInteraction} button
 * @param {import('discord.js').GuildMember} member
 */
function hasButttonPermission(button, member) {
	if (button.permission === undefined) {
		// Aucune permission particulière définie
		return true;
	} else {
		switch (button.permission.type) {
		case 'USER':
			return member.id === button.permission.id;
		case 'ROLE':
			return member.roles.resolve(button.permission.id) !== null;
		}
	}
}

/** @param {import('discord.js').ButtonInteraction} interaction */
async function executeButton(client, interaction) {
	const button = client.buttons.get(interaction.customId);

	if (!button) {
		return interaction.reply(`Le bouton n'a pas été trouvé (${inlineCode(interaction.customId)})`);
	}
	if (!hasButttonPermission(button, interaction.member)) {
		return interaction.reply('Vous n\'avez pas la permission pour utiliser ce bouton');
	}

	try {
		await button.execute(interaction);
	} catch (exception) {
		console.error(exception);
		await interaction.member.send({
			content: `Erreur lors de l'activation de ce bouton (${inlineCode(exception.name)})`
		});
	}
}

/** @param {import('discord.js').ContextMenuInteraction} interaction */
async function executeContextMenu(client, interaction) {
	const contextMenu = client.contextMenus.get(interaction.commandName);

	if (!contextMenu) {
		return interaction.reply(`Le menu contextuel n'a pas été trouvé (${inlineCode(interaction.commandName)})`);
	}

	try {
		await contextMenu.execute(interaction);
	} catch (exception) {
		console.error(exception);
		await interaction.member.send({
			content: `Erreur lors de l'activation de ce menu contextuel (${inlineCode(exception.name)})`
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
		} else if (interaction.isContextMenu()) {
			await executeContextMenu(interaction.client, interaction);
		} else {
			console.warn(`Type d'interaction inconnu (${interaction.type})`);
		}
	}
};