import { AdvancedDynamicTexture, Rectangle, Image, Grid } from "@babylonjs/gui";
import { AnimationManager } from "../services/AnimationManager";
import { CARD_GAME_STYLES, COLORS, createRect, createTextBlock, createGrid, createImage } from "./GuiStyle";
import { getCurrentTranslation } from "../../translations/translations";
import { AudioManager } from "../services/AudioManager";

interface CardData {
	value: number;
	isFlipped: boolean;
	isMatched: boolean;
	index: number;
}

interface CardElement extends Rectangle {
	cardData: CardData;
	cardImage?: Image;
	cardBack?: Image;
}

export class CardGame {
	private matchGameOverlay!: Rectangle;
	private cardsGrid!: Grid;
	private cards: CardElement[] = [];
	private flippedCards: CardElement[] = [];
	private matchedPairs: number = 0;
	private totalPairs: number = 4;
	private isProcessing: boolean = false;

	private readonly iconPaths: string[] = [
		"assets/icons/powerup/ballMultiplier.png",
		"assets/icons/powerup/curve.png",
		"assets/icons/powerup/fast.png",
		"assets/icons/powerup/ghost.png",
		"assets/icons/powerup/invert.png",
		"assets/icons/powerup/larger.png",
		"assets/icons/powerup/rallyMultiplier.png",
		"assets/icons/powerup/rallyReset.png",
		"assets/icons/powerup/shot.png",
		"assets/icons/powerup/slow.png",
		"assets/icons/powerup/smaller.png",
		"assets/icons/powerup/stop.png",
	];

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager, private audioManager: AudioManager) {
		const t = getCurrentTranslation();
		this.matchGameOverlay = createRect("cardGameContainer", CARD_GAME_STYLES.mainContainer);
		this.adt.addControl(this.matchGameOverlay);

		const title = createTextBlock("cardGameTitle", CARD_GAME_STYLES.title, "MEMORY MATCH");
		this.matchGameOverlay.addControl(title);

		const instructions = createTextBlock("instructions", CARD_GAME_STYLES.instructions, t.miniGameRules);
		this.matchGameOverlay.addControl(instructions);

		this.cardsGrid = createGrid("cardsGrid", CARD_GAME_STYLES.cardsGrid);
		this.matchGameOverlay.addControl(this.cardsGrid);

		this.startGame();
	}

	private shuffleArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	private setupGrid(): void {
		for (let i = 0; i < 4; i++)
			this.cardsGrid.addRowDefinition(1 / 4);

		for (let i = 0; i < 6; i++)
			this.cardsGrid.addColumnDefinition(1 / 6);
	}

	private resetGame(): void {
		this.totalPairs = 12;
		this.matchedPairs = 0;
		this.flippedCards = [];
		this.cards = [];

		while (this.cardsGrid.children.length > 0)
			this.cardsGrid.removeControl(this.cardsGrid.children[0]);

		const cardValues = [...this.iconPaths, ...this.iconPaths];
		const shuffledCards = this.shuffleArray(cardValues);

		for (let i = 0; i < shuffledCards.length; i++) {
			const card = this.createCard(shuffledCards[i], i);
			const row = Math.floor(i / 6);
			const col = i % 6;
			this.cardsGrid.addControl(card, row, col);
			this.cards.push(card);
		}
	}

	private startGame(): void {
		this.setupGrid();
		this.resetGame();
	}

	private createCard(iconPath: string, index: number): CardElement {
		const card = createRect(`card${index}`, CARD_GAME_STYLES.cardRect) as CardElement;

		const cardBack = createImage(`cardBack${index}`, CARD_GAME_STYLES.cardBack, "assets/icons/powerup/card_back.png");
		card.addControl(cardBack);

		const cardFront = createImage(`cardFront${index}`, CARD_GAME_STYLES.cardFront, iconPath);
		card.addControl(cardFront);

		card.cardBack = cardBack;
		card.cardImage = cardFront;
		card.cardData = {
			value: this.iconPaths.indexOf(iconPath),
			isFlipped: false,
			isMatched: false,
			index
		};

		card.onPointerClickObservable.add(() => this.handleCardClick(card));

		return card;
	}

	private async handleCardClick(card: CardElement): Promise<void> {
		if (this.isProcessing || card.cardData.isFlipped || 
			card.cardData.isMatched || this.flippedCards.length >= 2) {
			return;
		}

		await this.flipCard(card, true);
		this.flippedCards.push(card);

		if (this.flippedCards.length === 2) {
			this.isProcessing = true;

			await new Promise(resolve => setTimeout(resolve, 800));
			await this.checkForMatch();
			this.isProcessing = false;
		}
	}

	private async flipCard(card: CardElement, toFront: boolean): Promise<void> {
		card.cardData.isFlipped = toFront;
		
		if (card.cardBack && card.cardImage) {
			card.cardBack.isVisible = !toFront;
			card.cardImage.isVisible = toFront;
		}
		if (toFront && card.cardImage)
			await this.animationManager.zoomIn(card.cardImage);
	}

	private async checkForMatch(): Promise<void> {
		const [card1, card2] = this.flippedCards;

		if (card1.cardData.value === card2.cardData.value) {
			this.audioManager.playMiniGame(true);
			card1.cardData.isMatched = true;
			card2.cardData.isMatched = true;
			this.matchedPairs++;

			card1.thickness = 4;
			card1.color = COLORS.GREEN;
			card2.thickness = 4;
			card2.color = COLORS.GREEN;

			this.animationManager.glow(card1);
			this.animationManager.glow(card2);

			if (this.matchedPairs === this.totalPairs) {
				await new Promise(resolve => setTimeout(resolve, 500));
				this.showWin();
			}
		} else {
			this.audioManager.playMiniGame(false);
			await this.flipCard(card1, false);
			await this.flipCard(card2, false);
		}

		this.flippedCards = [];
	}

	private showWin(): void {
		setTimeout(() => {
			this.resetGame();
		}, 3000);
	}

	show(): void {
		this.matchGameOverlay.isVisible = true;
	}

	hide(): void {
		this.matchGameOverlay.isVisible = false;
	}
}