// The Clock class provides utility methods for managing time and frame updates.
export class Clock {
	private lastTime: number;

	constructor() {
		// Initialize the clock with the current time.
		this.lastTime = performance.now();
	}

	// Pause execution for a specified number of milliseconds.
	sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	getDeltaTime() {
		
	}

	getTimeout() {

	}

	// Calculate the time elapsed since the last tick and optionally enforce a frame rate.
	async tick(fps: number = 0): Promise<number> {
		const currentTime = performance.now();
		let deltaTime = currentTime - this.lastTime;
		this.lastTime = currentTime;

		if (fps > 0) {
			// Calculate the sleep time needed to maintain the desired frame rate.
			const sleepTime = Math.max(0, (1000 / fps) - deltaTime);
			if (sleepTime > 0) {
				await this.sleep(sleepTime);
				deltaTime += sleepTime;
			}
		}
		return deltaTime;
	}
}

// The Rect class represents a rectangle and provides utilities for geometry calculations.
export class Rect {
	x: number;
	y: number;
	w: number;
	h: number;

	constructor(x: number, y: number, w: number, h: number) {
		// Initialize the rectangle with position (x, y) and dimensions (w, h).
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	// --- Getters & Setters ---
	// Get or set the x-coordinate of the rectangle's center.
	get centerx(): number {
		return this.x;
	}
	set centerx(value: number) {
		this.x = value;
	}

	// Get or set the y-coordinate of the rectangle's center.
	get centery(): number {
		return this.y;
	}
	set centery(value: number) {
		this.y = value;
	}

	// Get or set the x-coordinate of the rectangle's left edge.
	get left(): number {
		return this.x - this.w / 2;
	}
	set left(value: number) {
		this.x = value + this.w / 2;
	}

	// Get or set the x-coordinate of the rectangle's right edge.
	get right(): number {
		return this.x + this.w / 2;
	}
	set right(value: number) {
		this.x = value - this.w / 2;
	}

	// Get or set the y-coordinate of the rectangle's top edge.
	get top(): number {
		return this.y - this.h / 2;
	}
	set top(value: number) {
		this.y = value + this.h / 2;
	}

	// Get or set the y-coordinate of the rectangle's bottom edge.
	get bottom(): number {
		return this.y + this.h / 2;
	}
	set bottom(value: number) {
		this.y = value - this.h / 2;
	}

	// --- Collision detection ---
	// Check if this rectangle collides with another rectangle.
	colliderect(other: Rect): boolean {
		return (
			this.left < other.right &&
			this.right > other.left &&
			this.top < other.bottom &&
			this.bottom > other.top
		);
	}

	// --- Copy values from another Rect ---
	// Copy the properties of another rectangle into this one.
	copy(other: Rect): void {
		this.x = other.x;
		this.y = other.y;
		this.w = other.w;
		this.h = other.h;
	}

	// --- Return a new instance ---
	// Create and return a new rectangle instance with the same properties.
	instance(): Rect {
		return new Rect(this.x, this.y, this.w, this.h);
	}
}