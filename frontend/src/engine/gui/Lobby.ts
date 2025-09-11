import { AdvancedDynamicTexture, Rectangle, TextBlock, Grid, StackPanel} from "@babylonjs/gui";
import { getCurrentTranslation } from '../../translations/translations.js';
import { AnimationManager } from "../AnimationManager.js";
import { H_LEFT, LOBBY_STYLES, createRect, createTextBlock, createStackPanel,} from "./GuiStyle.js";

export class Lobby {
	private overlay!: Rectangle;
	private listPanel!: StackPanel;
	private countText!: TextBlock;
	private subtitle!: TextBlock;
	private dotsTimer?: number;
	

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {
		const t = getCurrentTranslation();
		this.overlay = createRect("lobbyOverlay", LOBBY_STYLES.overlay);
		this.adt.addControl(this.overlay);

		const mainGrid = new Grid("lobbyMainGrid");
		mainGrid.addRowDefinition(0.15, false); // Title row
		mainGrid.addRowDefinition(0.15, false);  // Subtitle row
		mainGrid.addRowDefinition(0.1, false); // Count row
		mainGrid.addRowDefinition(0.6, false);  // Scroll row
		mainGrid.width = "100%";
		mainGrid.height = "100%";
		this.overlay.addControl(mainGrid);

		const title = createTextBlock("lobbyTitle", LOBBY_STYLES.title, t.tournamentOnline);
		mainGrid.addControl(title, 0, 0);

		this.subtitle = createTextBlock("lobbySubtitle", LOBBY_STYLES.subtitle, t.waiting);
		mainGrid.addControl(this.subtitle, 1, 0);

		this.countText = createTextBlock("lobbyCount", LOBBY_STYLES.count, "");
		mainGrid.addControl(this.countText, 2, 0);

		this.listPanel = createStackPanel("lobbyList", LOBBY_STYLES.lobbyList);
		mainGrid.addControl(this.listPanel, 3, 0);
	}

	show(players: string[]): void {
		if (!this.adt) return;
		const t = getCurrentTranslation();
		if (this.overlay && this.overlay.isVisible === false) {
			this.overlay!.isVisible = true;
			this.animationManager?.fadeIn(this.overlay!);
		}

		if (!this.subtitle) return;
			this.startDots();

		if (!this.listPanel || !this.countText) return;
		const children = [...this.listPanel.children];
		children.forEach(c => this.listPanel!.removeControl(c));

		for (let i = 0; i < players.length; i += 2) {
			const rowContainer = new Grid();
			rowContainer.addColumnDefinition(0.5, false);
			rowContainer.addColumnDefinition(0.5, false);
			rowContainer.width = "100%";
			rowContainer.height = "34px";
			
			const leftRow = createRect(`lobbyRow_${i}`, LOBBY_STYLES.rowRect);
			const leftTb = createTextBlock(`lobbyRowText_${i}`, LOBBY_STYLES.rowText, players[i]);
			leftRow.addControl(leftTb);
			rowContainer.addControl(leftRow, 0, 0);
			setTimeout(() => this.animationManager.fadeIn(leftTb), (i * 120));

			if (players[i + 1] !== undefined) {
				const rightRow = createRect(`lobbyRow_${i+1}`, LOBBY_STYLES.rowRect);
				const rightTb = createTextBlock(`lobbyRowText_${i+1}`, LOBBY_STYLES.rowText, players[i + 1]);
				rightTb.textHorizontalAlignment = H_LEFT;
				rightRow.addControl(rightTb);
				rowContainer.addControl(rightRow, 0, 1);
				setTimeout(() => this.animationManager.fadeIn(rightTb), ((i + 1) * 120));
			}
			
			this.listPanel!.addControl(rowContainer);
		}
		this.countText.text = `${t.countPlayer}: ${players.length}`;
	}

	private startDots(): void {
		if (!this.subtitle) return;
		this.stopDots();
		const base = this.subtitle.text?.replace(/\.*$/, "") || ""; // strip trailing dots once
		let step = 0;
		this.dotsTimer = window.setInterval(() => {
			step = (step + 1) % 4; // 0..3
			this.subtitle!.text = base + ".".repeat(step);
		}, 500);
		}

	private stopDots(): void {
		if (this.dotsTimer) {
			clearInterval(this.dotsTimer);
			this.dotsTimer = undefined;
		}
	}

	hide(): void {
		if (!this.overlay) return;
		this.animationManager?.fadeOut(this.overlay!);
		this.overlay!.isVisible = false;
		this.stopDots();
	}

	dispose(): void {
		this.stopDots();
		this.subtitle?.dispose();
		this.countText.dispose();
		this.listPanel.dispose();
		this.overlay.dispose();
	}

}