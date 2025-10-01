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
	z: number;
	width: number;
	depth: number;

	constructor(x: number, y: number, w: number, d: number) {
		// Initialize the rectangle with position (x, y) and dimensions (w, d).
		this.x = x;
		this.z = y;
		this.width = w;
		this.depth = d;
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
	get centerz(): number {
		return this.z;
	}
	set centerz(value: number) {
		this.z = value;
	}

	// Get or set the x-coordinate of the rectangle's left edge.
	get left(): number {
		return this.x - this.width / 2;
	}
	set left(value: number) {
		this.x = value + this.width / 2;
	}

	// Get or set the x-coordinate of the rectangle's right edge.
	get right(): number {
		return this.x + this.width / 2;
	}
	set right(value: number) {
		this.x = value - this.width / 2;
	}

	// Get or set the y-coordinate of the rectangle's top edge.
	get top(): number {
		return this.z - this.depth / 2;
	}
	set top(value: number) {
		this.z = value + this.depth / 2;
	}

	// Get or set the y-coordinate of the rectangle's bottom edge.
	get bottom(): number {
		return this.z + this.depth / 2;
	}
	set bottom(value: number) {
		this.z = value - this.depth / 2;
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
		this.z = other.z;
		this.width = other.width;
		this.depth = other.depth;
	}

	// --- Return a new instance ---
	// Create and return a new rectangle instance with the same properties.
	instance(): Rect {
		return new Rect(this.x, this.z, this.width, this.depth);
	}
}

export function remove_elem(list: any[], elem: any): boolean {
	const index = list.indexOf(elem);
	if (index === -1) return false;
	
	list.splice(index, 1);
	return true;
}

export function rotate(vec: [number, number], angleRad: number) {
	const cos = Math.cos(angleRad);
	const sin = Math.sin(angleRad);

	return [(vec[0] * cos - vec[1] * sin), (vec[0] * sin + vec[1] * cos)];

}