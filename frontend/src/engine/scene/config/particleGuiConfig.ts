import { ParticleTexturePath } from "./effectSceneConfig";

export interface SparkleDetails {
	asset: string;
	count: number;
	duration: number;
	size: { min: number; max: number };
	colors: string[];
	spread: { x: number; y: number };
	zIndex?: number;
}

export const PARTIAL_GUI_SPARKLES: SparkleDetails = {
	asset: ParticleTexturePath.FLARE_TRANSPARENT,
	count: 100,
	duration: 4000,
	size: { min: 5, max: 40 },
	colors: [
		"#FFD700", // Gold
		"#FFF8DC", // Cornsilk  
		"#FFFFE0", // Light yellow
		"#F0E68C", // Khaki
		"#FFFFFF"  // White
	],
	spread: { x: 80, y: 60 }
};


export const PARTIAL_GUI_SPARKLES_LOSER: SparkleDetails = {
	asset: ParticleTexturePath.FLARE,
	count: 80,
	duration: 2000,
	size: { min: 3, max: 25 },
	colors: [
		"#CD5C5C", // Indian red
		"#A0522D", // Sienna  
		"#B22222", // Fire brick
		"#8B4513", // Saddle brown
		"#DC143C", // Crimson
		"#800000", // Maroon
		"#9B111E"  // Ruby red
	],
	spread: { x: 60, y: 50 }
};