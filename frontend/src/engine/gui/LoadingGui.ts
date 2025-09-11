import { AdvancedDynamicTexture, Rectangle, TextBlock} from "@babylonjs/gui";
import { createRect, createTextBlock, LOADING_STYLE } from "./GuiStyle";
import type { Scene } from "@babylonjs/core/scene";
import { getCurrentTranslation } from "../../translations/translations";

export class LoadingGui {
	private adt: AdvancedDynamicTexture;
	private overlay: Rectangle;
	private title: TextBlock;
	private percent: TextBlock;
	private bar: Rectangle;
	private fill: Rectangle;

	constructor(scene: Scene) {
		this.adt = AdvancedDynamicTexture.CreateFullscreenUI("loadingUI", true, scene);

		const t = getCurrentTranslation();

		this.overlay = createRect("loadingOverlay", LOADING_STYLE.overlay);
		this.adt.addControl(this.overlay);

		this.title = createTextBlock("loadingTitle", LOADING_STYLE.title, t.loading);
		this.overlay.addControl(this.title);

		this.bar = createRect("loadingBar", LOADING_STYLE.bar);
		this.overlay.addControl(this.bar);

		this.fill = createRect("loadingFill", LOADING_STYLE.fill);
		this.bar.addControl(this.fill);

		this.percent = createTextBlock("loadingPercent", LOADING_STYLE.percentege)
		this.overlay.addControl(this.percent);
	}

	setProgress(percent: number): void {
		const clamped = Math.max(0, Math.min(100, Math.floor(percent)));
		this.fill.width = `${clamped}%`;
		this.percent.text = `${clamped}%`;
	}

	show(): void {
		this.overlay.isVisible = true;
	}

	hide(dispose = true): void {
		this.overlay.isVisible = false;
		if (dispose)
			this.dispose();
	}

	dispose(): void {
		this.adt.dispose();
	}
}