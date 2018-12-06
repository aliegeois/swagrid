class Command {
	constructor(name) {
		this.name = name;
		this.arguments = new Array();
	}

	then(argument) {
		this.arguments.push(argument);
		return this;
	}

	executes(fct) {
		this.execute = fct;
	}
}

class Argument {
	constructor(name) {
		this.name = name;
		this.arguments = new Array();
	}

	then(argument) {
		this.arguments.push(argument);
		return this;
	}

	executes(fct) {
		this.execute = fct;
	}
}

class CommandDispatcher {
	constructor() {
		this.commands = new Map();
	}
	
	register(cmdName) {
		if(this.commands.has(cmdName))
			throw new Error('command already registered');
		this.commands.set(cmdName, 1);
	}

	parse(cmd) {
		if(typeof cmd != 'string')
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

		if(args.length > 0) {
			let name = args.shift();
			if(this.commands.has(name)) {
				let command = this.commands.get(name),
				    canExecute = false;
				while(!canExecute) {
					if(typeof command == 'Command') {
						//
					} else if(typeof command == 'Argument') {
						//
					}
				}
			} else
				throw new Error('unknown command');
		} else {
			throw new Error('empty string');
		}
	}
}


let literal = name => {
	return new Command(name);
};

let argument = name => {
	return new Argument(name);
};

let dispatcher = new CommandDispatcher();

dispatcher.register(
	literal("foo")
		.then(
			argument("bar")
				.executes(c => {
					console.log(`foo ${c}`);
					return 1;
				})
		)
		.executes(() => {
			console.log('foo');
		})
);