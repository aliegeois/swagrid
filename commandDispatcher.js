const Permission = require('./permission');

/**
 * Morte de rire
 * @class */
class Command {
	/** @param {string} name Nom de la commande */
	constructor(name) {
		/** @type {string} */
		this.name = name;
		/**
		 * @type {Map.<string, LiteralCommand>}
		 * @private
		 */
		this.__literals = new Map();
		/**
		 * @type {?ArgumentCommand}
		 * @private
		 */
		this.__argument = null;
		/**
		 * @type {function(...string): void}
		 */
		this.execute = null;
		/**
		 * @type {boolean}
		 * @private
		 */
		this.__canBeLast = false;
		/**
		 * @type {string}
		 * @private
		 */
		this.__description = '';
		/**
		 * @type {}
		 * @private
		 */
		this.__permission = Permission.basic;
	}

	/**
	 * @param {Command} command
	 * @returns {this}
	 */
	then(command) {
		if(command instanceof LiteralCommand) {
			this.__literals.set(command.name, command);
		} else if(command instanceof ArgumentCommand) {
			this.__argument = command;
		}
		this.__last = false;

		return this;
	}

	/**
	 * What appens when you execute the command
	 * @param {function(): Promise<void>} command La commande à exécuter
	 * @returns {this}
	 */
	executes(command) {
		/**
		 * @type {function(string[]): void}
		 * @private
		 */
		this.execute = command;
		this.__canBeLast = true;

		return this;
	}

	/**
	 * Ajoute une description à la commande
	 * @param {string} text La description
	 * @returns {this}
	 */
	description(text) {
		this.__description = text;

		return this;
	}

	/** @param {string} name */
	hasSubCommand(name) {
		return this.__literals.has(name);
	}

	/** @param {string} name */
	getSubCommand(name) {
		return this.__literals.get(name);
	}

	/** @returns {boolean} */
	hasArgument() {
		return this.__argument !== null;
	}

	/**
	 * Retourne l'argument suivant
	 * @return {ArgumentCommand}
	 */
	getArgument() {
		return this.__argument;
	}

	/**
	 * Indique si cette commande peut être exécutée toute seule
	 * @returns {boolean}
	 */
	canBeLast() {
		return this.__canBeLast;
	}
}

/** @class */
class LiteralCommand extends Command {
	/**
	 * @param {string} name
	 */
	constructor(name) {
		super(name);
	}
}

/** @class */
class ArgumentCommand extends Command {
	/**
	 * @param {string} name 
	 * @param {string} [type]
	 */
	constructor(name, restString) {
		super(name);
		/** @type {boolean} */
		this.__restString = typeof restString === 'undefined' ? false : restString;
	}

	/** @returns {boolean} */
	isRestString() {
		return this.__restString;
	}
}

//dispatcher.parse('dbar "de \\"rire\\"" 42');

class CommandDispatcher {
	constructor() {
		/**
		 * @type {Map.<string, Command>}
		 * @private
		 */
		this.__commands = new Map();
	}
	/**
	 * Enregistre une nouvelle commande
	 * @param {LiteralCommand} command Commande à ajouter
	 * @throws {Error} si la commande est déjà enregistrée
	 */
	register(command, permission) { // Rajouter la permission
		if(this.__commands.has(command.name))
			throw new Error('Command already registered');
		this.__commands.set(command.name, command);
	}

	/**
	 * 
	 * @param {string} cmd La chaîne de caractère à parser
	 * @param {any} source L'environnement dont à besoin la commande
	 */
	parse(cmd, source) {
		if(typeof cmd !== 'string')
			throw new TypeError();
		
		cmd = cmd.trim();
		let args = [],
			str = '',
			escaped = false,
			string = false;
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

		return this.dispatch(args, source);
	}

	/**
	 * Vérifie que la commande est correcte
	 * @param {string[]} args 
	 * @private
	 */
	dispatch(args) {
		if(args.length > 0) {
			let name = args.shift(),
				totalArgs = [];
			if(this.__commands.has(name)) {
				let command = this.__commands.get(name);

				while(args.length) {
					if(command instanceof LiteralCommand) {
						let arg = args.shift();
						totalArgs = [arg];
						if(command.hasSubCommand(arg)) {
							command = command.getSubCommand(arg);
						} else if(command.hasArgument()) {
							command = command.getArgument();
						} else {
							throw new Error('Too many arguments');
						}
					} else if(command instanceof ArgumentCommand) {
						if(command.isRestString()) {
							//console.log(args);
							//console.log(totalArgs);
							totalArgs = totalArgs.concat(args.splice(0));
						} else if(command.hasArgument()) {
							command = command.getArgument();
							totalArgs.push(args.shift());
						} else {
							console.log('???');
						}
					}
				}
				if(!command.canBeLast()) {
					throw new Error('Missing arguments');
				}

				//console.log(`Exécution de ${command.name} avec ${cmdArgs.length} argument${cmdArgs.length == 1 ? '' : 's'}: ${cmdArgs}`);

				if(totalArgs.length)
					return command.execute(...totalArgs);
				else
					return command.execute();
			} else
				throw new Error(`Unknown command ${name}`);
		} else
			throw new Error('No command');
	}
}

/**
 * 
 * @param {string} name 
 */
function literal(name) {
	return new LiteralCommand(name);
}

/**
 * See {@link Command} for dbar as well as {@link Command#executes()} for more
 * @param {string} name 
 * @param {string} [restString=false]
 */
function argument(name, restString) {
	return new ArgumentCommand(name, restString);
}

let dispatcher = new CommandDispatcher();

dispatcher.register(
	literal('foo')
		.then(
			argument('bar')
				.then(
					argument('baz')
						.executes((bar, baz) => {
							console.log(`foo ${bar} ${baz}`);
							return `foo ${bar} ${baz}`;
						})
				)
				.executes(c => {
					console.log(`foo ${c}`);
					return `foo ${c}`;
				})
		)
		.then(
			literal('blyat')
				.then(
					argument('bite', true).executes((...bite) => {
						console.log(`foo blyat [${bite}]`);
						return `foo blyat [${bite}]`;
					})
				)
		)
		.executes(() => {
			console.log('foo');
			return 'foo';
		})
		.description('')
);

dispatcher.register(
	literal('say')
		.then(
			argument('message', true)
				.executes((message, content) => {
					return new Promise((resolve, reject) => {
						message.delete().catch(_=>{});
						message.channel.send(content);
						resolve();
					});
				})
		)
);

dispatcher.register(
	literal('tts')
		.then(
			argument('message', true)
				.executes((message, content) => {
					return new Promise((resolve, reject) => {
						message.delete().catch(_=>{});
						message.channel.send(content, {tts: true}).catch(_=>{});
						resolve();
					});
				})
		)
);

dispatcher.register(
	literal('join')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('leave')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('play')
		.then(
			argument('keywords')
				.executes((message, keywords) => {
					return new Promise((resolve, reject) => {
						resolve();
					});
				})
		)
);

dispatcher.register(
	literal('playing')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('playlist')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('cancel')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('skip')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('stop')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('r34')
		.then(
			argument('keywords', true)
				.executes((message, keywords) => {
					return new Promise((resolve, reject) => {
						resolve();
					});
				})
		)
);

dispatcher.register(
	literal('emojipopularity')
		.executes((message, keyword) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('eval')
		.then(
			argument('command', true)
				.executes((message, command) => {
					return new Promise((resolve, reject) => {
						resolve();
					});
				})
		)
);

dispatcher.register(
	literal('resetdb')
		.then(
			argument('databases', true)
				.executes((message, databases) => {
					return new Promise((resolve, reject) => {
						resolve();
					});
				})
		)
);

dispatcher.register(
	literal('help')
		.then(
			argument('keywords', true)
				.executes((message, keywords) => {
					return new Promise((resolve, reject) => {
						resolve();
					});
				})
		)
);

/*
console.info('foo' === dispatcher.parse('foo', {})); // OK
console.info('foo 123 456' === dispatcher.parse('foo 123 456', {})); // OK
console.info('foo blyat [a,b,c]' === dispatcher.parse('foo blyat a b c', {})); // OK
*/

module.exports = CommandDispatcher;
