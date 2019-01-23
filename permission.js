/**
 * @module Permission
 */

const Discord = require('discord.js');

/** @class */
class Permission {
	/**
	 * @callback permissionCallback
	 * @param {Discord.User} user
	 * @returns {boolean}
	 */

	/**
	 * @param {permissionCallback} check
	 */
	constructor(check) {
		/** @type {permissionCallback} */
		this.checkPermission = check;
	}
}

Permission.basic = new Permission(_ => true);

module.exports = Permission;