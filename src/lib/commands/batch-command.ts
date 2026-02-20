import { Command } from "./base-command";

export class BatchCommand extends Command {
	constructor(private commands: Command[]) {
		super();
	}

	execute(): void {
		for (const command of this.commands) {
			command.execute();
		}
	}

	async undo(): Promise<void> {
		for (const command of [...this.commands].reverse()) {
			await command.undo();
		}
	}

	async redo(): Promise<void> {
		for (const command of this.commands) {
			await command.execute();
		}
	}
}
