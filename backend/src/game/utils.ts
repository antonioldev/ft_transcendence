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
	cx: number;
	cy: number;
	w: number;
	h: number;
	constructor(cx: number, cy: number, w: number, h: number) {
		this.cx = cx
		this.cy = cy
		this.w = w
		this.h = h
	}

	// --- Getters & Setters ---
	get centerx(): number {
		return this.cx;
	}
	set centerx(value: number) {
		this.cx = value;
	}

	get centery(): number {
		return this.cy;
	}
	set centery(value: number) {
		this.cy = value;
	}

	get left(): number {
		return this.cx - this.w / 2;
	}
	set left(value: number) {
		this.cx = value + this.w / 2;
	}
	
	get right(): number {
		return this.cx + this.w / 2;
	}
	set right(value: number) {
		this.cx = value - this.w / 2;
	}

	get top(): number {
	return this.cy - this.h / 2;
	}
	set top(value: number) {
		this.cy = value + this.h / 2;
	}

	get bottom(): number {
		return this.cy + this.h / 2;
	}
	set bottom(value: number) {
		this.cy = value - this.h / 2;
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
		this.cx = other.cx;
		this.cy = other.cy;
		this.w = other.w;
		this.h = other.h;
	}

	// --- Return a new instance ---
	instance(): Rect {
		return new Rect(this.cx, this.cy, this.w, this.h);
	}
}