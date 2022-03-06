const { SlashCommandBuilder, codeBlock } = require('@discordjs/builders');

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').ApplicationCommandPermissionData[]} permissions
 */
function hasPermission(member, permissions) {
	if (permissions === undefined) {
		return true;
	}

	for (const permission of permissions) {
		if (permission.type === 'ROLE') {
			if (member.roles.cache.has(permission.id)) {
				if (!permission.permission) {
					return false;
				}
			} else if (permission.permission) {
				return false;
			}
		} else if (permission.type === 'USER') {
			if (member.id === permission.id) {
				if (!permission.permission) {
					return false;
				}
			} else if (permission.permission) {
				return false;
			}
		}
	}

	return true;
}

/** @type {import('../SwagridClient').SwagridCommand} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Liste les commandes et leurs usages'),

	async execute(interaction, client) {
		const commands = client.commands;

		const descriptions = commands
			.filter(command => hasPermission(interaction.member, command.permissions))
			.map(command => `${command.data.name}: ${command.data.description}`)
			.join('\n');

		return interaction.reply(`Liste des commandes :${codeBlock(descriptions)}`);
	}
};