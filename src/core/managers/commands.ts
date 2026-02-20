import type { Command } from "@/lib/commands";

const MAX_HISTORY_SIZE = 150;

export class CommandManager {
	private history: Command[] = [];
	private redoStack: Command[] = [];

	execute({ command }: { command: Command }): Command {
		command.execute();
		this.history.push(command);
		// Trim oldest entries to prevent unbounded memory growth in long sessions
		if (this.history.length > MAX_HISTORY_SIZE) {
			this.history.shift();
		}
		this.redoStack = [];
		return command;
	}

	async undo(): Promise<void> {
		if (this.history.length === 0) return;
		const command = this.history.pop();
		await command?.undo();
		if (command) {
			this.redoStack.push(command);
		}
	}

	async redo(): Promise<void> {
		if (this.redoStack.length === 0) return;
		const command = this.redoStack.pop();
		await command?.redo();
		if (command) {
			this.history.push(command);
		}
	}

	canUndo(): boolean {
		return this.history.length > 0;
	}

	canRedo(): boolean {
		return this.redoStack.length > 0;
	}

	clear(): void {
		this.history = [];
		this.redoStack = [];
	}
}
