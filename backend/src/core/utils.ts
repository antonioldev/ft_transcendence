export class Clock {
	private lastTime: number;

	constructor() {
		this.lastTime = performance.now();
	}

	sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async tick(fps: number = 0): Promise<number> {
		const currentTime = performance.now();
		let deltaTime = currentTime - this.lastTime;
		this.lastTime = currentTime;

		if (fps > 0) {
			const sleepTime = Math.max(0, (1000 / fps) - deltaTime);
			if (sleepTime > 0) {
				await this.sleep(sleepTime);
				deltaTime += sleepTime;
			}
		}
		return deltaTime;
	}
}

export class Rect {
	x: number;
	y: number;
	w: number;
	h: number;
	constructor(x: number, y: number, w: number, h: number) {
		this.x = x
		this.y = y
		this.w = w
		this.h = h
	}

	// --- Getters & Setters ---
	get centerx(): number {
		return this.x;
	}
	set centerx(value: number) {
		this.x = value;
	}

	get centery(): number {
		return this.y;
	}
	set centery(value: number) {
		this.y = value;
	}

	get left(): number {
		return this.x - this.w / 2;
	}
	set left(value: number) {
		this.x = value + this.w / 2;
	}
	
	get right(): number {
		return this.x + this.w / 2;
	}
	set right(value: number) {
		this.x = value - this.w / 2;
	}

	get top(): number {
	return this.y - this.h / 2;
	}
	set top(value: number) {
		this.y = value + this.h / 2;
	}

	get bottom(): number {
		return this.y + this.h / 2;
	}
	set bottom(value: number) {
		this.y = value - this.h / 2;
	}

	// --- Collision detection ---
	colliderect(other: Rect): boolean {
	return (
		this.left < other.right &&
		this.right > other.left &&
		this.top < other.bottom &&
		this.bottom > other.top
	);
	}

	// --- Copy values from another Rect ---
	copy(other: Rect): void {
		this.x = other.x;
		this.y = other.y;
		this.w = other.w;
		this.h = other.h;
	}

	// --- Return a new instance ---
	instance(): Rect {
		return new Rect(this.x, this.y, this.w, this.h);
	}
}