/*
 * @module Permission
 */

/**
 * @callback permissionCallback
 * @param {...any} args
 * @returns {boolean}
 */

/** @class */
class Permission {
	/**
	 * @param {permissionCallback} check
	 */
	constructor(check) {
		/** @type {permissionCallback} */
		this.checkPermission = check;
	}
}

Permission.basic = new Permission(() => true);

module.exports = Permission;

