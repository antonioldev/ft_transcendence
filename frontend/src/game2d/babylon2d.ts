import { GAME_CONFIG, getPlayerSize, getPlayerLeftPosition, getPlayerRightPosition, getBallStartPosition, getCamera1Position, getCamera1Viewport} from './gameConfig.js';
import { GameObjectFactory } from './gameObjectFactory.js';

declare var BABYLON: any;

let engine: any = null;
let scene: any = null;
let canvas: HTMLCanvasElement | null = null;

function createDefaultEngine(): any {
    return new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true, 
        stencil: true, 
        disableWebGL2Support: false 
    });
}

function startRenderLoop(): void {
    if (engine) {
        engine.runRenderLoop(function () {
            if (scene && scene.activeCamera)
                scene.render();
        });
    }
}

function createScene(): any {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = BABYLON.Color3.Black();
    const camera1 = GameObjectFactory.createCamera(
        scene, "camera1", getCamera1Position(), getCamera1Viewport());
    scene.activeCamera = camera1;

    const light = GameObjectFactory.createLight(scene, "light1", new BABYLON.Vector3(0, 1, 0));
    
    const ground = GameObjectFactory.createGround(scene, "ground", GAME_CONFIG.fieldWidth, 
        GAME_CONFIG.fieldHeight, BABYLON.Color3.Black());

    const walls = GameObjectFactory.createWalls(
        scene, "walls", GAME_CONFIG.fieldWidth, GAME_CONFIG.fieldHeight, GAME_CONFIG.wallHeight, GAME_CONFIG.wallThickness, BABYLON.Color3.White());
    
    const playerLeft = GameObjectFactory.createPlayer(
        scene, "player1", getPlayerLeftPosition(), getPlayerSize(), BABYLON.Color3.Red());
    
    const playerRight = GameObjectFactory.createPlayer(
        scene, "player2", getPlayerRightPosition(), getPlayerSize(), BABYLON.Color3.White());
    
    const ball = GameObjectFactory.createBall(scene, "ball", getBallStartPosition(), BABYLON.Color3.White());

    return scene;
}

export async function initBabylon2D(): Promise<void> {
    try{
        console.log("Initializing Babylon 2D scene...");

        canvas = document.getElementById("game-canvas-2d") as HTMLCanvasElement;
        if (!canvas) {
            console.error("Canvas not found!");
            return;
        }

        engine = createDefaultEngine();
        if (!engine) {
            console.error("Engine creation failed!");
            return;
        }

        scene = createScene();

        startRenderLoop();

        const resizeHandler = () => {
            if (engine)
                engine.resize();
        };
        window.addEventListener("resize", resizeHandler);
        console.log("Babylon 2D scene initialized successfully!");
    } catch (error) {
        console.error("Error initializing Babylon 2D:", error);
    }
}

export function pauseBabylon2D(): void {
    if (engine) {
        engine.stopRenderLoop();
        console.log("Babylon render loop paused");
    }
}

export function resumeBabylon2D(): void {
    if (engine && scene) {
        startRenderLoop();
        console.log("Babylon render loop resumed");
    }
}

export function disposeBabylon2D(): void {
    console.log("Disposing Babylon 2D scene...");
    if (engine)
        engine.stopRenderLoop();

    if (scene) {
        scene.dispose();
        scene = null;
    }

    if (engine) {
        engine.dispose();
        engine = null;
    }

    canvas = null;

    console.log("Babylon 2D scene disposed.");
}