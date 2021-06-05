// eslint-disable-next-line no-unused-vars
const { Message } = require('discord.js');

class Command {
	/** @param {string} name Nom de la commande */
	constructor(name) {
		/**
		 * @type {string}
		 * @private
		 */
		this._name = name;
		/**
		 * @type {Map.<string, Literal>}
		 * @private
		 */
		this._literals = new Map();
		/**
		 * @type {?Argument}
		 * @private
		 */
		this._argument = null;
		/**
		 * @type {boolean}
		 * @private
		 */
		this._executable = false;
		/**
		 * @type {string}
		 * @private
		 */
		this._description = '(aucune description disponible)';
		/**
		 * @type {string}
		 * @private
		 */
		this._permission = 'basic';
	}

	/**
	 * @param {Command} command Le code à exécuter quand la commande est utilisée
	 * @returns {this}
	 */
	then(command) {
		if(command instanceof Literal) {
			this._literals.set(command._name, command);
		} else if(command instanceof Argument) {
			this._argument = command;
		}

		return this;
	}

	/**
	 * What appens when you execute the command
	 * @param {function({message: Message}, ...string): Promise<void>} command La commande à exécuter
	 * @returns {this}
	 */
	executes(command) {
		/**
		 * @param {{message: Message}} source
		 * @param {...string} args
		 * @private
		 */
		this.execute = (source, ...args) => {
			//console.log('execution of ' + command + ' with arguments [' + args + '] and permission ' + Permission[this.__permission__]);
			return new Promise((resolve, reject) => {
				if(Permission[this._permission].checkPermission(source)) {
					command(source, ...args)
						.then(resolve)
						.catch(reject);
				} else {
					reject(new CommandDispatcher.InsufficientPermissionError(command.name));
				}
			});
		};
		this._executable = true;

		return this;
	}

	/**
	 * Définit la permission nécessaire pour exécuter cette commande
	 * @param {string} perm
	 * @returns {this}
	 */
	permission(perm) {
		//console.log('command ' + this.name + ' changing permission to "' + perm + '"');
		this._permission = perm;

		return this;
	}

	/**
	 * Ajoute une description à la commande
	 * @param {string} text La description
	 * @returns {this}
	 */
	description(text) {
		this._description = text;

		return this;
	}

	/**
	 * Name of the command
	 * @returns {string}
	 */
	getName() {
		return this._name;
	}

	/**
	 * @returns {Map.<string, Command>}
	 */
	getLiterals() {
		return this._literals;
	}

	/**
	 * @param {string} name 
	 * @returns {boolean}
	 *
	 */
	hasLiteral(name) {
		return this._literals.has(name);
	}

	/**
	 * 
	 * @param {tring} name 
	 * @returns {Literal}
	 */
	getLiteral(name) {
		return this._literals.get(name);
	}

	/**
	 * @returns {boolean}
	 */
	hasArgument() {
		return this._argument !== null;
	}

	/**
	 * @returns {?Argument}
	 */
	getArgument() {
		return this._argument;
	}

	/**
	 * @returns {boolean}
	 */
	isExecutable() {
		return this._executable;
	}

	/**
	 * @returns {string}
	 */
	getDescription() {
		return this._description;
	}

	/**
	 * @returns {string}
	 */
	getPermission() {
		return this._permission;
	}

	/**
	 * @param {string} prefix 
	 * @returns {{command: Command, usage: string, description: string}[]]}
	 */
	getUsages(prefix) {
		let exploration = [{
			command: this,
			usage: this._name
		}];
		let result = [];

		while(exploration.length > 0) {
			let { command, usage } = exploration.shift();

			if(command._executable) {
				result.push({
					command,
					usage: `${prefix}${usage}`,
					description: command._description
				});
			}

			for(let [lname, lit] of command._literals) {
				exploration.push({
					command: lit,
					usage: `${usage} ${lname}`
				});
			}
			if(command._argument) {
				exploration.push({
					command: command._argument,
					usage: `${usage} <${command._argument._name}>`
				});
			}
		}

		return result.sort((u1, u2) => u1.usage < u2.usage ? -1 : (u1.usage > u2.usage ? 1 : 0));
	}
}

class Literal extends Command {
	/** @param {string} name Nom de la commande */
	constructor(name) {
		super(name);
	}
}

class Argument extends Command {
	/**
	 * @param {string} name Nom de l'argument
	 * @param {boolean} [restString=false] Le reste de la commande est-il concatené ?
	 */
	constructor(name, restString = false) {
		super(name);
		/** @type {boolean} */
		this.__restString__ = restString;
	}

	/** @returns {boolean} */
	isRestString() {
		return this.__restString__;
	}
}

class CommandDispatcher {
	constructor() {
		/**
		 * @type {Map.<string, Literal>}
		 * @private
		 */
		this.__commands__ = new Map();
	}

	/** @returns {Map<string, Literal>} */
	/*getCommands() {
		let cmds = new Map();

		for(let [name, command] of this.__commands__)
			cmds.set(name, command);
		
		return cmds;
	}*/

	get commands() {
		return this.__commands__;
	}

	/**
	 * Enregistre une nouvelle commande
	 * @param {Literal} command Commande à ajouter
	 * @throws {Error} si la commande est déjà enregistrée
	 */
	register(command) { // Rajouter la permission
		if(command instanceof Argument)
			throw new Error('Can\'t register an argument as a command');
		
		if(this.__commands__.has(command.getName()))
			throw new CommandDispatcher.CommandAlreadyRegisteredError(command.getName());
		this.__commands__.set(command.getName(), command);
	}

	/**
	 * Analyse une commande et l'exécute si elle est bien formée
	 * @param {any} source L'environnement dont à besoin la commande
	 * @param {string} cmd La chaîne de caractères à parser
	 * @returns {Promise<void>}
	 */
	parse(source, cmd) {
		if(typeof cmd !== 'string')
			return Promise.reject(new TypeError(`Expected string, got ${typeof cmd}`));
		
		cmd = cmd.trim();
		/** @type {string[]} */
		let args = [];
		let str = '';
		let escaped = false;
		let string = false;
		for(let ch of cmd) {
			if(string) {
				if(escaped) {
					str += ch;
					escaped = false;
				} else if(ch == '\\') {
					escaped = true;
				} else if(ch == '"') {
					string = false;
				} else {
					str += ch;
				}
			} else if(ch == '"') {
				string = true;
			} else if(ch == ' ') {
				args.push(str);
				str = '';
			} else {
				str += ch;
			}
		}
		args.push(str);

		return this.__dispatch__(source, args);
	}

	/**
	 * Exécute une commande
	 * @param {string[]} args
	 * @returns {Promise<void>}
	 * @private
	 */
	__dispatch__(source, args) {
		if(args.length > 0) {
			/** @type {string} */
			let name = args.shift();
			/** @type {string[]} */
			let totalArgs = [];
			if(this.__commands__.has(name)) {
				let command = this.__commands__.get(name);

				while(args.length) {
					if(command instanceof Literal) {
						let arg = args.shift();
						totalArgs = [arg];
						if(command.hasLiteral(arg)) {
							command = command.getLiteral(arg);
						} else if(command.hasArgument()) {
							command = command.getArgument();
						} else {
							return Promise.reject(new CommandDispatcher.TooManyArgumentsError(name));
						}
					} else if(command instanceof Argument) {
						if(command.isRestString()) {
							totalArgs = totalArgs.concat(args.splice(0));
						} else if(command.hasArgument()) {
							command = command.getArgument();
							totalArgs.push(args.shift());
						} else {
							console.log('???');
						}
					} else {
						console.log('??????????????????????');
					}
				}

				if(!command.isExecutable()) {
					return Promise.reject(new CommandDispatcher.MissingArgumentError(name));
				}
				return command.execute(source, ...totalArgs);
			} else {
				return Promise.reject(new CommandDispatcher.UnknownCommandError(name));
			}
		} else {
			return Promise.reject(new CommandDispatcher.EmptyCommandError());
		}
	}
}

CommandDispatcher.InsufficientPermissionError = class InsufficientPermissionError extends Error {
	/** @param {*} name Nom de la commande */
	constructor(name) {
		super(`Insufficient permission for command ${name}`);
	}
};

CommandDispatcher.EmptyCommandError = class EmptyCommandError extends Error {
	/** @param {*} name Nom de la commande */
	constructor() {
		super('Empty command');
	}
};

CommandDispatcher.UnknownCommandError = class UnknownCommandError extends Error {
	/** @param {*} name Nom de la commande */
	constructor(name) {
		super(`Unknown command ${name}`);
	}
};

CommandDispatcher.MissingArgumentError = class MissingArgumentError extends Error {
	/** @param {*} name Nom de la commande */
	constructor(name) {
		super(`Missing argument(s) for command ${name}`);
	}
};

CommandDispatcher.TooManyArgumentsError = class TooManyArgumentsError extends Error {
	/** @param {*} name Nom de la commande */
	constructor(name) {
		super(`Too many argument(s) for command ${name}`);
	}
};

CommandDispatcher.CommandAlreadyRegisteredError = class CommandAlreadyRegisteredError extends Error {
	/** @param {*} name Nom de la commande */
	constructor(name) {
		super(`Command ${name} already registered`);
	}
};

/**
 * @param {string} name Nom de la commande
 */
function literal(name) {
	return new Literal(name);
}

/**
 * @param {string} name Nom de l'argument
 * @param {string} [restString=false] Le reste de la commande est-il concatené ?
 */
function argument(name, restString = false) {
	return new Argument(name, restString);
}

class Permission {
	/** @param {function({message: Message)} check */
	constructor(check) {
		this.checkPermission = check;
	}
}

Permission.basic = new Permission(() => true);

/*
// Tests
let dispatcher = new CommandDispatcher();

dispatcher.register(
	literal('foo')
		.then(
			argument('bar')
				.then(
					argument('baz')
						.executes((_, bar, baz) => {
							return new Promise((resolve, reject) => {
								//console.log(`ouioui la fonction: foo "${bar}" "${baz}"`);
								resolve(`"foo ${bar} ${baz}"`);
							});
						})
						.description('le trio fbb')
				)
				.executes((_, bar) => {
					return new Promise((resolve, reject) => {
						//console.log(`ouioui la fonction: foo ${bar}`);
						resolve(`"foo ${bar}"`);
					});
				})
				.description('foo et du bar')
		)
		.then(
			literal('blyat')
				.then(
					argument('bite', true)
						.executes((_, ...bite) => {
							return new Promise((resolve, reject) => {
								//console.log(`ouioui la fonction: foo blyat [${bite}]`);
								resolve(`"foo blyat [${bite}]"`);
							});
						})
						.description('foo puis blyat et des trucs')
				)
		)
		.executes(_ => {
			return new Promise((resolve, reject) => {
				//console.log('ouioui la fonction: foo');
				resolve('"foo"');
			});
		})
		.description('foo tout seul')
);

let source = {
	message: {
		member: null
	}
};
dispatcher.parse(source, 'foo').then(console.log).catch(console.error);
dispatcher.parse(source, 'foo aya').then(console.log).catch(console.error);
dispatcher.parse(source, 'foo 123 456').then(console.log).catch(console.error);
dispatcher.parse(source, 'foo blyat a b c').then(console.log).catch(console.error);
for(let l of dispatcher.__commands__.values())
	console.log(l.getUsages('+'));

	*/
module.exports = { Permission, CommandDispatcher, literal, argument };
