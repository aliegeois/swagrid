/* jshint -W083 */

//const Permission = require('./permission');

/**
 * @class
 */
class Command {
	/** @param {string} name Nom de la commande */
	constructor(name) {
		/** @type {string} */
		this.name = name;
		/**
		 * @type {Map.<string, Command>}
		 * @private
		 */
		this.__literals__ = new Map();
		/**
		 * @type {?Argument}
		 * @private
		 */
		this.__argument__ = null;
		/**
		 * @type {boolean}
		 * @private
		 */
		this.__executable__ = false;
		/**
		 * @type {string}
		 * @private
		 */
		this.__description__ = '(aucune description disponible)';
		/**
		 * @type {Permission}
		 * @private
		 */
		this.__permission__ = 'basic';
	}

	/**
	 * @param {Command} command
	 * @returns {this}
	 */
	then(command) {
		if(command instanceof Literal) {
			this.__literals__.set(command.name, command);
		} else if(command instanceof Argument) {
			this.__argument__ = command;
		}

		return this;
	}

	/**
	 * What appens when you execute the command
	 * @param {function(any, ...string): Promise<void>} command La commande à exécuter
	 * @returns {this}
	 */
	executes(command) {
		/**
		 * @param {...string} args
		 */
		this.execute = (source, ...args) => {
			//console.log('execution of ' + command + ' with arguments [' + args + '] and permission ' + Permission[this.__permission__]);
			return new Promise((resolve, reject) => {
				if(Permission[this.__permission__].checkPermission(source.message.member)) {
					command(source, ...args)
						.then(resolve)
						.catch(reject);
				} else {
					reject(new Command.InsufficientPermissionError(command.name));
				}
			});
		};
		this.__executable__ = true;

		return this;
	}

	/**
	 * Définit la permission nécessaire pour exécuter cette commande
	 * @param {Permission} perm
	 * @returns {this}
	 */
	permission(perm) {
		this.__permission__ = perm;

		return this;
	}

	/**
	 * Ajoute une description à la commande
	 * @param {string} text La description
	 * @returns {this}
	 */
	description(text) {
		this.__description__ = text;

		return this;
	}

	/**
	 * @returns {Map.<string, Command>}
	 */
	get literals() {
		return this.__literals__;
	}

	/**
	 * @returns {Argument}
	 */
	get argument() {
		return this.__argument__;
	}

	/** @param {string} name */
	hasSubCommand(name) {
		return this.__literals__.has(name);
	}

	/** @param {string} name */
	getSubCommand(name) {
		return this.__literals__.get(name);
	}

	/** @returns {boolean} */
	hasArgument() {
		return this.__argument__ !== null;
	}

	/**
	 * Retourne l'argument suivant
	 * @return {Argument}
	 */
	getArgument() {
		return this.__argument__;
	}

	/**
	 * Indique si cette commande peut être exécutée toute seule
	 * @returns {boolean}
	 */
	isExecutable() {
		return this.__executable__;
	}

	get infos() {
		return {
			name: this.name,
			executable: this.__executable__,
			description: this.__description__,
			literals: this.__literals__,
			argument: this.__argument__,
			permission: Permission[this.__permission__]
		};
	}
}

Command.InsufficientPermissionError = class InsufficientPermissionError extends Error {
	constructor(name) {
		super(`Insufficient permission for command ${name}`);
	}
};

/** @class */
class Literal extends Command {
	/**
	 * @param {string} name
	 */
	constructor(name) {
		super(name);
	}
}

/** @class */
class Argument extends Command {
	/**
	 * @param {string} name 
	 * @param {boolean} [restString=false]
	 */
	constructor(name, restString = false) {
		super(name);
		/** @type {boolean} */
		this.__restString__ = restString;
		//this.__restString = restString = restString === undefined ? false : restString;
	}

	/** @returns {boolean} */
	isRestString() {
		return this.__restString__;
	}
}

class CommandDispatcher {
	constructor() {
		/**
		 * @type {Map.<string, Command>}
		 * @private
		 */
		this.__commands__ = new Map();
	}

	/** @returns {Map<string, Command>} */
	get commands() {
		let cmds = new Map();
		for(let [name, command] of this.__commands__)
			cmds.set(name, command.infos);
		return cmds;
	}

	/**
	 * Enregistre une nouvelle commande
	 * @param {Command} command Commande à ajouter
	 * @throws {Error} si la commande est déjà enregistrée
	 */
	register(command) { // Rajouter la permission
		if(command instanceof Argument)
			throw new Error('Can\'t register an argument as a command');
		
		if(this.__commands__.has(command.name))
			throw new CommandDispatcher.CommandAlreadyRegisteredError(command.name);
		this.__commands__.set(command.name, command);

		/*console.log(command);

		console.log(`ajout commande ${command.name}, executable: ${command.isExecutable()}`);

		let usages = [];
		if(command.literals.size) {
			console.log(command.name + ' has ' + command.literals.size + ' sub command(s): [' + Array.from(command.literals).map(([n, c]) => n + ': ' + (c instanceof Argument ? 'argument' : 'literal')) + ']');
			let sub = Array.from(command.literals);
			let depth = Array.from(command.literals).map(() => 0);
			let usg = Array.from(command.literals).map(([n]) => command.name + ' {literal:' + n + ',executable:' + command.isExecutable() + '}');
			
			while(sub.length) {
				let [n, c] = sub.shift();
				let d = depth.shift();
				let u = usg.shift();
				console.log('sub command ' + n + ', executable: ' + c.isExecutable());
				if(c.literals.size) {
					sub = sub.concat(Array.from(c.literals));
					depth = depth.concat(Array.from(c.literals).map(() => d+1));
					usages = usages.concat(Array.from(c.literals).map(([n]) => u + ' {literal:' + n + ',executable:' + c.isExecutable() + '}'));
				}
				if(c.argument) {
					sub.push(c.argument);
					depth.push(d+1);
					usages.push(u + ' {argument:' + n + ',executable:' + c.isExecutable() + '}');
				}
			}
		}
		if(command.argument) {
			let cmd = command.argument;
			let usg = [command.name + ' {argument:' + cmd.name + '}'];
			while(cmd) {
				if(cmd.argument) {
					usages.push(usg.shift() + ' {argument:' + cmd.name + ',executable:' + cmd.isExecutable() + '}');
					console.log(cmd.name + 'has argument: ' + cmd.argument + ', executable: ' + cmd.isExecutable());
					cmd = cmd.argument;
				}
			}
		}
		console.log('register [' + usages + ']');*/
	}

	/**
	 * Analyse une commande et l'exécute si elle est bien formée
	 * @param {any} source L'environnement dont à besoin la commande
	 * @param {string} cmd La chaîne de caractères à parser
	 */
	parse(source, cmd) {
		if(typeof cmd !== 'string')
			throw new TypeError(`Expected string, got ${typeof cmd}`);
		
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
	 * Vérifie que la commande est correcte
	 * @param {string[]} args 
	 * @private
	 */
	__dispatch__(source, args) {
		if(args.length > 0) {
			/** @type {string} */
			let name = args.shift();
			//console.log('name: ' + name);
			/** @type {string[]} */
			let totalArgs = [];
			if(this.__commands__.has(name)) {
				//console.log('command ' + name + ' exists');
				let command = this.__commands__.get(name);

				while(args.length) {
					//console.log('next arg: ' + args[0]);
					if(command instanceof Literal) {
						//console.log('literal: ' + command.name);
						let arg = args.shift();
						totalArgs = [arg];
						if(command.hasSubCommand(arg)) {
							//console.log('sub command ' + arg + ' exists');
							command = command.getSubCommand(arg);
						} else if(command.hasArgument()) {
							//console.log('has argument');
							command = command.getArgument();
						} else {
							throw new CommandDispatcher.TooManyArgumentsError(name);
						}
					} else if(command instanceof Argument) {
						//console.log('argument: ' + command.name);
						if(command.isRestString()) {
							totalArgs = totalArgs.concat(args.splice(0));
						} else if(command.hasArgument()) {
							//console.log('it has an argument');
							command = command.getArgument();
							totalArgs.push(args.shift());
						} else {
							console.log('???');
						}
					} else {
						console.log('??????????????????????');
					}
					//console.log('remaining args: [' + args + ']');
				}
				if(!command.isExecutable()) {
					throw new CommandDispatcher.MissingArgumentError(name);
				}

				//console.log(`Exécution de ${command.name} avec ${totalArgs.length} argument${totalArgs.length == 1 ? '' : 's'}: [${totalArgs}]`);

				if(totalArgs.length)
					return command.execute(source, ...totalArgs);
				else
					return command.execute(source);
			} else
				throw new CommandDispatcher.UnknownCommandError(name);
		} else
			throw new CommandDispatcher.EmptyCommandError();
	}
}

CommandDispatcher.EmptyCommandError = class EmptyCommandError extends Error {
	constructor() {
		super('Empty command');
	}
};

CommandDispatcher.UnknownCommandError = class UnknownCommandError extends Error {
	constructor(name) {
		super(`Unknown command ${name}`);
	}
};

CommandDispatcher.MissingArgumentError = class MissingArgumentError extends Error {
	constructor(name) {
		super(`Missing argument(s) for command ${name}`);
	}
};

CommandDispatcher.TooManyArgumentsError = class TooManyArgumentsError extends Error {
	constructor(name) {
		super(`Too many argument(s) for command ${name}`);
	}
};

CommandDispatcher.CommandAlreadyRegisteredError = class CommandAlreadyRegisteredError extends Error {
	constructor(name) {
		super(`Command ${name} already registered`);
	}
};

/**
 * @param {string} name
 */
function literal(name) {
	return new Literal(name);
}

/**
 * @param {string} name
 * @param {string} [restString=false]
 */
function argument(name, restString = false) {
	return new Argument(name, restString);
}

/** @class */
class Permission {
	constructor(check) {
		/** @type {function(any): boolean} */
		this.checkPermission = check;
	}
}

Permission.basic = new Permission(() => true);

/*
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
				)
				.executes((_, bar) => {
					return new Promise((resolve, reject) => {
						//console.log(`ouioui la fonction: foo ${bar}`);
						resolve(`"foo ${bar}"`);
					});
				})
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
				)
		)
		.executes(_ => {
			return new Promise((resolve, reject) => {
				//console.log('ouioui la fonction: foo');
				resolve('"foo"');
			});
		})
		.description('')
);

// Tests
let source = {
	message: {
		member: null
	}
};
dispatcher.parse(source, 'foo').then(console.log).catch(console.error);
dispatcher.parse(source, 'foo aya').then(console.log).catch(console.error);
dispatcher.parse(source, 'foo 123 456').then(console.log).catch(console.error);
dispatcher.parse(source, 'foo blyat a b c').then(console.log).catch(console.error);
*/

module.exports = { Permission, CommandDispatcher, literal, argument };
