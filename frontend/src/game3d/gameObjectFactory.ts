declare var BABYLON: any;

export class GameObjectFactory {
    static createCamera(
        scene: any,
        name: string,
        position: any,
        viewport: any
    ): any {
        const camera = new BABYLON.FreeCamera(name, position, scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.viewport = viewport;
        return camera;
    }

    static createLight(
        scene: any,
        name: string,
        position: any
    ): any {
        const light = new BABYLON.HemisphericLight(name, position, scene)
        return light;
    }

    static createGround(
        scene: any,
        name: string,
        width: number,
        height: number,
        color: any = new BABYLON.Color3(0.4, 0.6, 0.4)
    ): any {
        const ground = BABYLON.MeshBuilder.CreateGround(name, {
            width: width,
            height: height
        }, scene);
        
        const groundMaterial = new BABYLON.StandardMaterial(name + "Material", scene);
        groundMaterial.diffuseColor = color;
        ground.material = groundMaterial;
        
        return ground;
    }

    static createPlayer(
        scene: any,
        name: string,
        position: any,
        size: any,
        color: any
    ): any {
        const player = BABYLON.MeshBuilder.CreateBox(name, {
            width: size.x, 
            height: size.y, 
            depth: size.z }, scene);
        const material = new BABYLON.StandardMaterial(name + "Material", scene);
        material.diffuseColor = color;
        player.material = material;
        player.position = position;
        return player;
    }

    static createBall(
        scene: any,
        name: string,
        position: any,
        color: any
    ): any {
        const ball = BABYLON.MeshBuilder.CreateSphere(name, {}, scene);
        const material = new BABYLON.StandardMaterial(name + "Material", scene);
        material.diffuseColor = color;
        ball.material = material;
        ball.position = position;
        return ball;
    }
}
