import { AdvancedDynamicTexture, Control, Rectangle, TextBlock, Grid, ScrollViewer, StackPanel, MultiLine} from "@babylonjs/gui";
import { getCurrentTranslation } from '../../translations/translations.js';
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { H_RIGHT, BRACKET_STYLES, applyStyles, createRect, createTextBlock, createGrid, createImage, createStackPanel} from "./GuiStyle.js";

export class MatchTree {
	private playerTotal: number = 0;
	private bracketOverlay!: Rectangle;
	private bracketScroll!: ScrollViewer;
	private bracketGrid!: Grid;
	private isCreated: boolean = false;
	

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {

		const t = getCurrentTranslation();

		this.bracketOverlay = createRect("bracketOverlay", BRACKET_STYLES.bracketOverlay);
		this.bracketOverlay.paddingRight = `${this.bracketOverlay.thickness + 8}px`;
		this.adt.addControl(this.bracketOverlay);

		const container = createGrid("bracketContainer", BRACKET_STYLES.bracketContainer);
		container.addRowDefinition(BRACKET_STYLES.containerRows.header, false);
		container.addRowDefinition(BRACKET_STYLES.containerRows.content, false);
		container.addColumnDefinition(1, false);
		this.bracketOverlay.addControl(container);

		const headerGrid = createGrid("headerGrid", BRACKET_STYLES.headerGrid);
		headerGrid.addColumnDefinition(BRACKET_STYLES.gridColumns.icon, true);
		headerGrid.addColumnDefinition(BRACKET_STYLES.gridColumns.title, false);

		const bracketIcon = createImage("bracketIcon", BRACKET_STYLES.bracketIcon, "assets/icons/tournament.png");
		headerGrid.addControl(bracketIcon, 0, 0);

		const bracketTitle = createTextBlock("bracketTitle", BRACKET_STYLES.bracketTitle, t.tournamentTitle);
		headerGrid.addControl(bracketTitle, 0, 1);

		container.addControl(headerGrid, 0, 0);

		this.bracketScroll = new ScrollViewer("bracketScroll");
		applyStyles(this.bracketScroll, BRACKET_STYLES.bracketScroll);
		this.bracketScroll.verticalBar.isVisible = false;
		this.bracketScroll.horizontalBar.isVisible = true;
		container.addControl(this.bracketScroll, 1, 0);

		const contentWrap = createStackPanel("bracketContentWrap", BRACKET_STYLES.contentWrap);
		this.bracketScroll.addControl(contentWrap);

		this.bracketGrid = createGrid("bracketGrid", BRACKET_STYLES.bracketGrid);
		this.bracketGrid.addRowDefinition(1, false);
		contentWrap.addControl(this.bracketGrid);

	}

	update(winner: string, round_index: number, match_index: number): void {
		if (!this.adt) return;
		if (!this.bracketGrid) return;

		const leftSlot = match_index * 2;
		const rightSlot = match_index * 2 + 1;

		const leftId = `bracketCell_${round_index}_${leftSlot}`;
		const rightId = `bracketCell_${round_index}_${rightSlot}`;
		const nextId = `bracketCell_${round_index + 1}_${match_index}`;

		const leftTb = this.adt.getControlByName(leftId) as TextBlock;
		const rightTb = this.adt.getControlByName(rightId) as TextBlock;
		const leftRect = this.adt.getControlByName(`${leftId}_rect`) as Rectangle;
		const rightRect = this.adt.getControlByName(`${rightId}_rect`) as Rectangle;
		const nextTb   = this.adt.getControlByName(nextId) as TextBlock;

		if (!leftTb || !rightTb || !leftRect || !rightRect) return;

		const isLeftWinner  = leftTb.text  === winner;
		const isRightWinner = rightTb.text === winner;


		if (isLeftWinner) {
			rightTb.text = "❌ " + rightTb.text;
			applyStyles(leftRect, BRACKET_STYLES.winnerCell);
			applyStyles(leftTb, BRACKET_STYLES.winnerText);
			applyStyles(rightRect, BRACKET_STYLES.loserCell);
			applyStyles(rightTb, BRACKET_STYLES.loserText);
			
		} else if (isRightWinner) {
			leftTb.text = "❌ " + leftTb.text;
			applyStyles(rightRect, BRACKET_STYLES.winnerCell);
			applyStyles(rightTb, BRACKET_STYLES.winnerText);
			applyStyles(leftRect, BRACKET_STYLES.loserCell);
			applyStyles(leftTb, BRACKET_STYLES.loserText);
		}
		if (nextTb)
			nextTb.text = winner;
	}

	insert(
		roundIndex: number,
		matchIndex: number,
		left: string | null,
		right: string | null,
		matchTotal?: number
	): void {
		if (!this.bracketGrid) return;
		if (!this.isCreated && matchTotal !== undefined)
			this.initializeGrid(matchTotal);

		const colPanel = this.bracketGrid.getChildByName(`bracketCol_${roundIndex - 1}`) as StackPanel;
		if (!colPanel) return;

		const leftSlot = matchIndex * 2;
		const rightSlot = matchIndex * 2 + 1;

		const leftId  = `bracketCell_${roundIndex}_${leftSlot}`;
		const rightId = `bracketCell_${roundIndex}_${rightSlot}`;

		const leftTb  = this.adt?.getControlByName(leftId)  as TextBlock;
		const rightTb = this.adt?.getControlByName(rightId) as TextBlock;

		if (left !== null && leftTb !== null)
			leftTb.text = left;
		if (right !== null && rightTb !== null)
			rightTb.text = right;
	}

	show(show: boolean): void {
		if (!this.bracketOverlay || !this.animationManager) return;
		if (show) {
			this.bracketOverlay.isVisible = true;

			this.bracketOverlay.horizontalAlignment = H_RIGHT;
			this.bracketOverlay.paddingRight = "5px"
			this.bracketOverlay.leftInPixels = 400;


			this.animationManager.slideInX(this.bracketOverlay, 400, Motion.F.base);
		} else {
			this.animationManager.slideOutX(this.bracketOverlay, 400, Motion.F.xFast).then(() => {
			this.bracketOverlay!.isVisible = false;
		});
		}
	}

	private initializeGrid(matchTotal: number): void {
		this.playerTotal = matchTotal * 2;
		const rounds = Math.ceil(Math.log2(this.playerTotal));
		const totalColumns = rounds + 1;

		for (let col = 0; col < totalColumns; col++) {
			this.bracketGrid?.addColumnDefinition(220, true);

			const colPanel = createStackPanel(`bracketCol_${col}`, BRACKET_STYLES.bracketColPanel);
			this.bracketGrid?.addControl(colPanel, 1, col);

			const slots = this.playerTotal / Math.pow(2, col);
			for (let i = 0; i < slots; i++) {
				const cellName = `bracketCell_${col + 1}_${i}`;
				const cellHeight = 50 * Math.pow(2, col);
				const cellRect = createRect(`${cellName}_rect`, BRACKET_STYLES.bracketCellRect);
				cellRect.height = `${cellHeight}px`;
				colPanel.addControl(cellRect);
				const tb = createTextBlock( cellName, BRACKET_STYLES.bracketCellText, "");
				tb.fontSize = col === rounds ? 48 : 16;
				tb.text = col === rounds ? "🏆" : "tbd";
				cellRect.addControl(tb);
			}
			this.wireRound(col);
		}
		this.isCreated = true;
	}

	private createAnchorPoint(parentControl: Control, position: 'left' | 'right'): Control {
		const anchor = new Control(`anchor_${parentControl.name}_${position}`);
		anchor.widthInPixels = 1;
		anchor.heightInPixels = 1;
		anchor.isVisible = false;
		anchor.isPointerBlocker = false;
		
		// Position the anchor at the edge of the parent control
		if (position === 'right') {
			anchor.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		} else {
			anchor.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		}
		anchor.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		
		// Add the anchor to the same parent as the control
		parentControl.parent?.addControl(anchor);
		
		return anchor;
	}

	private addConnector(src: Control, dst: Control, color = "#BBB", width = 2): MultiLine {
		const line = new MultiLine(`conn_${src.name}_${dst.name}`);
		line.lineWidth = width;
		line.color = color;
		line.alpha = 0.9;
		line.isPointerBlocker = false;
		
		const srcRightAnchor = this.createAnchorPoint(src, 'right');
		const dstLeftAnchor = this.createAnchorPoint(dst, 'left');
		
		line.add(srcRightAnchor);
		line.add(dstLeftAnchor);
		
		this.bracketOverlay?.addControl(line);
		line.zIndex = 5;
		return line;
	}

	
	private wireRound(roundIndex: number): void {
		const slotsInThisRound = this.playerTotal / Math.pow(2, roundIndex - 1);
		const nextRoundMatches = Math.ceil(slotsInThisRound / 2);

		for (let match = 0; match < nextRoundMatches; match++) {
			const leftIdx  = match * 2;
			const rightIdx = match * 2 + 1;

			const left  = this.adt?.getControlByName(`bracketCell_${roundIndex}_${leftIdx}`)  as Control | null;
			const right = this.adt?.getControlByName(`bracketCell_${roundIndex}_${rightIdx}`) as Control | null;
			const next  = this.adt?.getControlByName(`bracketCell_${roundIndex + 1}_${match}`) as Control | null;

			if (!left || !right || !next) continue;

			this.addConnector(left,  next);
			this.addConnector(right, next);
		}
	}

	dispose():void {
		this.bracketGrid.dispose();
		this.bracketScroll.dispose()
		this.bracketOverlay.dispose()

	}

}

// import { AdvancedDynamicTexture, Control, Rectangle, TextBlock, Grid, ScrollViewer, StackPanel, MultiLine} from "@babylonjs/gui";
// import { getCurrentTranslation } from '../../translations/translations.js';
// import { AnimationManager, Motion } from "../services/AnimationManager.js";
// import { H_RIGHT, BRACKET_STYLES, applyStyles, createRect, createTextBlock, createGrid, createImage, createStackPanel} from "./GuiStyle.js";

// export class MatchTree {
// 	private playerTotal: number = 0;
// 	private bracketOverlay!: Rectangle;
// 	private bracketScroll!: ScrollViewer;
// 	private bracketGrid!: Grid;
// 	private isCreated: boolean = false;
// 	private rounds: number = 0;
	

// 	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {

// 		const t = getCurrentTranslation();

// 		this.bracketOverlay = createRect("bracketOverlay", BRACKET_STYLES.bracketOverlay);
// 		this.bracketOverlay.paddingRight = `${this.bracketOverlay.thickness + 8}px`;
// 		this.adt.addControl(this.bracketOverlay);

// 		const container = createGrid("bracketContainer", BRACKET_STYLES.bracketContainer);
// 		container.addRowDefinition(BRACKET_STYLES.containerRows.header, false);
// 		container.addRowDefinition(BRACKET_STYLES.containerRows.content, false);
// 		container.addColumnDefinition(1, false);
// 		this.bracketOverlay.addControl(container);

// 		const headerGrid = createGrid("headerGrid", BRACKET_STYLES.headerGrid);
// 		headerGrid.addColumnDefinition(BRACKET_STYLES.gridColumns.icon, true);
// 		headerGrid.addColumnDefinition(BRACKET_STYLES.gridColumns.title, false);

// 		const bracketIcon = createImage("bracketIcon", BRACKET_STYLES.bracketIcon, "assets/icons/tournament.png");
// 		headerGrid.addControl(bracketIcon, 0, 0);

// 		const bracketTitle = createTextBlock("bracketTitle", BRACKET_STYLES.bracketTitle, t.tournamentTitle);
// 		headerGrid.addControl(bracketTitle, 0, 1);

// 		container.addControl(headerGrid, 0, 0);

// 		this.bracketScroll = new ScrollViewer("bracketScroll");
// 		applyStyles(this.bracketScroll, BRACKET_STYLES.bracketScroll);
// 		this.bracketScroll.verticalBar.isVisible = false;
// 		this.bracketScroll.horizontalBar.isVisible = false; // Remove horizontal scrollbar
// 		container.addControl(this.bracketScroll, 1, 0);

// 		const contentWrap = createStackPanel("bracketContentWrap", BRACKET_STYLES.contentWrap);
// 		this.bracketScroll.addControl(contentWrap);

// 		this.bracketGrid = createGrid("bracketGrid", BRACKET_STYLES.bracketGrid);
// 		this.bracketGrid.addRowDefinition(1, false);
// 		contentWrap.addControl(this.bracketGrid);

// 	}

// 	update(winner: string, round_index: number, match_index: number): void {
// 		if (!this.adt) return;
// 		if (!this.bracketGrid) return;

// 		const leftSlot = match_index * 2;
// 		const rightSlot = match_index * 2 + 1;

// 		const leftId = `bracketCell_${round_index}_${leftSlot}`;
// 		const rightId = `bracketCell_${round_index}_${rightSlot}`;
// 		const nextId = `bracketCell_${round_index + 1}_${match_index}`;

// 		const leftTb = this.adt.getControlByName(leftId) as TextBlock;
// 		const rightTb = this.adt.getControlByName(rightId) as TextBlock;
// 		const leftRect = this.adt.getControlByName(`${leftId}_rect`) as Rectangle;
// 		const rightRect = this.adt.getControlByName(`${rightId}_rect`) as Rectangle;
// 		const nextTb   = this.adt.getControlByName(nextId) as TextBlock;

// 		if (!leftTb || !rightTb || !leftRect || !rightRect) return;

// 		const isLeftWinner  = leftTb.text  === winner;
// 		const isRightWinner = rightTb.text === winner;


// 		if (isLeftWinner) {
// 			rightTb.text = "❌ " + rightTb.text;
// 			applyStyles(leftRect, BRACKET_STYLES.winnerCell);
// 			applyStyles(leftTb, BRACKET_STYLES.winnerText);
// 			applyStyles(rightRect, BRACKET_STYLES.loserCell);
// 			applyStyles(rightTb, BRACKET_STYLES.loserText);
			
// 		} else if (isRightWinner) {
// 			leftTb.text = "❌ " + leftTb.text;
// 			applyStyles(rightRect, BRACKET_STYLES.winnerCell);
// 			applyStyles(rightTb, BRACKET_STYLES.winnerText);
// 			applyStyles(leftRect, BRACKET_STYLES.loserCell);
// 			applyStyles(leftTb, BRACKET_STYLES.loserText);
// 		}
// 		if (nextTb)
// 			nextTb.text = winner;
// 	}

// 	insert(
// 		roundIndex: number,
// 		matchIndex: number,
// 		left: string | null,
// 		right: string | null,
// 		matchTotal?: number
// 	): void {
// 		if (!this.bracketGrid) return;
// 		if (!this.isCreated && matchTotal !== undefined)
// 			this.initializeGrid(matchTotal);

// 		const colPanel = this.bracketGrid.getChildByName(`bracketCol_${roundIndex - 1}`) as StackPanel;
// 		if (!colPanel) return;

// 		const leftSlot = matchIndex * 2;
// 		const rightSlot = matchIndex * 2 + 1;

// 		const leftId  = `bracketCell_${roundIndex}_${leftSlot}`;
// 		const rightId = `bracketCell_${roundIndex}_${rightSlot}`;

// 		const leftTb  = this.adt?.getControlByName(leftId)  as TextBlock;
// 		const rightTb = this.adt?.getControlByName(rightId) as TextBlock;

// 		if (left !== null && leftTb !== null)
// 			leftTb.text = left;
// 		if (right !== null && rightTb !== null)
// 			rightTb.text = right;
// 	}

// 	show(show: boolean): void {
// 		if (!this.bracketOverlay || !this.animationManager) return;
// 		if (show) {
// 			this.bracketOverlay.isVisible = true;

// 			this.bracketOverlay.horizontalAlignment = H_RIGHT;
// 			this.bracketOverlay.paddingRight = "5px"
// 			this.bracketOverlay.leftInPixels = 400;

// 			this.animationManager.slideInX(this.bracketOverlay, 400, Motion.F.base);
// 		} else {
// 			this.animationManager.slideOutX(this.bracketOverlay, 400, Motion.F.xFast).then(() => {
// 			this.bracketOverlay!.isVisible = false;
// 		});
// 		}
// 	}

// 	private initializeGrid(matchTotal: number): void {
// 		this.playerTotal = matchTotal * 2;
// 		this.rounds = Math.ceil(Math.log2(this.playerTotal));
// 		const totalColumns = this.rounds + 1;

// 		// Calculate sizing for all rounds
// 		const sizing = this.computeBracketSizing(this.playerTotal);

// 		for (let col = 0; col < totalColumns; col++) {
// 			this.bracketGrid?.addColumnDefinition(sizing.colWidth, true);

// 			const colPanel = createStackPanel(`bracketCol_${col}`, BRACKET_STYLES.bracketColPanel);
// 			this.bracketGrid?.addControl(colPanel, 1, col);

// 			const slots = this.playerTotal / Math.pow(2, col);
// 			for (let i = 0; i < slots; i++) {
// 				const cellName = `bracketCell_${col + 1}_${i}`;
// 				const cellRect = createRect(`${cellName}_rect`, BRACKET_STYLES.bracketCellRect);
// 				cellRect.height = `${sizing.rowHeight}px`;
// 				colPanel.addControl(cellRect);
				
// 				const tb = createTextBlock(cellName, BRACKET_STYLES.bracketCellText, "");
// 				tb.fontSize = col === this.rounds ? sizing.finalFontSize : sizing.fontPx;
// 				tb.text = col === this.rounds ? "🏆" : "tbd";
// 				cellRect.addControl(tb);
// 			}
			
// 			// Apply consistent spacing to this column
// 			this.applySizingToColumn(col, sizing);
// 			this.wireRound(col);
// 		}
// 		this.isCreated = true;
// 	}

// 	private createAnchorPoint(parentControl: Control, position: 'left' | 'right'): Control {
// 		const anchor = new Control(`anchor_${parentControl.name}_${position}`);
// 		anchor.widthInPixels = 1;
// 		anchor.heightInPixels = 1;
// 		anchor.isVisible = false;
// 		anchor.isPointerBlocker = false;
		
// 		// Position the anchor at the edge of the parent control
// 		if (position === 'right') {
// 			anchor.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
// 		} else {
// 			anchor.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
// 		}
// 		anchor.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		
// 		// Add the anchor to the same parent as the control
// 		parentControl.parent?.addControl(anchor);
		
// 		return anchor;
// 	}

// 	private addConnector(src: Control, dst: Control, color = "#BBB", width = 2): MultiLine {
// 		const line = new MultiLine(`conn_${src.name}_${dst.name}`);
// 		line.lineWidth = width;
// 		line.color = color;
// 		line.alpha = 0.9;
// 		line.isPointerBlocker = false;
		
// 		const srcRightAnchor = this.createAnchorPoint(src, 'right');
// 		const dstLeftAnchor = this.createAnchorPoint(dst, 'left');
		
// 		line.add(srcRightAnchor);
// 		line.add(dstLeftAnchor);
		
// 		this.bracketOverlay?.addControl(line);
// 		line.zIndex = 5;
// 		return line;
// 	}

	
// 	private wireRound(roundIndex: number): void {
// 		const slotsInThisRound = this.playerTotal / Math.pow(2, roundIndex - 1);
// 		const nextRoundMatches = Math.ceil(slotsInThisRound / 2);

// 		for (let match = 0; match < nextRoundMatches; match++) {
// 			const leftIdx  = match * 2;
// 			const rightIdx = match * 2 + 1;

// 			const left  = this.adt?.getControlByName(`bracketCell_${roundIndex}_${leftIdx}`)  as Control | null;
// 			const right = this.adt?.getControlByName(`bracketCell_${roundIndex}_${rightIdx}`) as Control | null;
// 			const next  = this.adt?.getControlByName(`bracketCell_${roundIndex + 1}_${match}`) as Control | null;

// 			if (!left || !right || !next) continue;

// 			this.addConnector(left,  next);
// 			this.addConnector(right, next);
// 		}
// 	}

// 	// --- Updated sizing computation for all rounds ---
// 	private computeBracketSizing(playerCount: number) {
// 		// Available vertical space
// 		const { height: canvasH } = this.adt.getSize();
// 		const margin = 48; // Safety margin
// 		const available = Math.max(120, canvasH - margin);

// 		// Calculate total vertical space needed for all rows
// 		const totalRows = playerCount; // First round has playerCount rows
		
// 		// Calculate row height to fit all rows
// 		const MIN_ROW = 24;
// 		const MAX_ROW = 64;
// 		const MIN_GAP = 4;
// 		const MAX_GAP = 10;
		
// 		// Calculate gap proportional to density
// 		const gap = Math.max(MIN_GAP, Math.min(MAX_GAP, Math.floor(available * 0.0025)));
		
// 		// Calculate row height to fit all rows with gaps
// 		let rowHeight = Math.floor((available - (totalRows - 1) * gap) / totalRows);
// 		rowHeight = Math.max(MIN_ROW, Math.min(MAX_ROW, rowHeight));

// 		// Font size proportional to row height
// 		const fontPx = Math.max(12, Math.min(24, Math.round(rowHeight * 0.45)));
// 		const finalFontSize = Math.max(24, Math.min(48, Math.round(rowHeight * 0.9)));

// 		// Column width based on row height
// 		const colWidth = Math.max(140, Math.min(240, Math.round(rowHeight * 4)));

// 		return { rowHeight, gap, fontPx, finalFontSize, colWidth };
// 	}

// 	// --- Apply sizing to a specific column ---
// 	private applySizingToColumn(colIndex: number, sizing: { rowHeight: number; gap: number; fontPx: number; finalFontSize: number; colWidth: number }) {
// 		const colPanel = this.adt.getControlByName(`bracketCol_${colIndex}`) as StackPanel | null;
// 		if (!colPanel) return;

// 		// Set column width
// 		colPanel.width = `${sizing.colWidth}px`;

// 		// Apply sizing to each cell in this column
// 		for (let i = 0; i < colPanel.children.length; i++) {
// 			const rowRect = colPanel.children[i] as Rectangle;
// 			if (!(rowRect instanceof Rectangle)) continue;

// 			rowRect.height = `${sizing.rowHeight}px`;
// 			rowRect.paddingTop = "0px";
// 			rowRect.paddingBottom = "0px";
			
// 			// Add gap between rows (except for the last one)
// 			rowRect.paddingBottom = `${i < colPanel.children.length - 1 ? sizing.gap : 0}px`;

// 			// Update font size for text in this cell
// 			const label = rowRect.children?.find(c => c instanceof TextBlock) as TextBlock | undefined;
// 			if (label) {
// 				if (colIndex === this.rounds) {
// 					label.fontSize = `${sizing.finalFontSize}px`; // Final round (winner)
// 				} else {
// 					label.fontSize = `${sizing.fontPx}px`; // Regular rounds
// 				}
// 				label.resizeToFit = true;
// 				label.textWrapping = true;
// 			}
// 		}
// 	}

// 	dispose():void {
// 		this.bracketGrid.dispose();
// 		this.bracketScroll.dispose()
// 		this.bracketOverlay.dispose()
// 	}
// }