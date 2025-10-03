import { EventEmitter } from 'events';

export function randomize(array: any[]) {
	for (let i = array.length - 1; i > 0; i--) { 
		const j = Math.floor(Math.random() * (i + 1)); 
		[array[i], array[j]] = [array[j], array[i]]; 
	} 
}

export const eventManager = new EventEmitter();