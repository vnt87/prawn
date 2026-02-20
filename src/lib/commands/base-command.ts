export abstract class Command {
	abstract execute(): void | Promise<void>;

	undo(): void | Promise<void> {
		throw new Error(`[${this.constructor.name}] undo() is not implemented`);
	}

	redo(): void | Promise<void> {
		return this.execute();
	}
}
