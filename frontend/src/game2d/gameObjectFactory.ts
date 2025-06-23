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
        camera.rotation.z = - (Math.PI / 2);
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
        groundMaterial.emissiveColor = color;
        groundMaterial.disableLighting = true;
        ground.material = groundMaterial;
        
        return ground;
    }

    static createWalls(
        scene: any,
        name: string,
        fieldWidth: number,
        fieldHeight: number,
        wallHeight: number,
        wallThickness: number,
        color: any
    ):any[] {
        const walls: any[] = [];
        const wallMaterial = new BABYLON.StandardMaterial(name + "Material", scene);
        wallMaterial.emissiveColor = color;
        wallMaterial.disableLighting = true;

        const topWall = BABYLON.MeshBuilder.CreateBox("topWall",
            {width: fieldWidth, height: wallHeight, depth: wallThickness}, scene);
        topWall.position = new BABYLON.Vector3(0, wallHeight / 2, fieldHeight / 2);
        topWall.material = wallMaterial;
        walls.push(topWall);

        const bottomWall = BABYLON.MeshBuilder.CreateBox("bottomWall",
            {width: fieldWidth, height: wallHeight, depth: wallThickness}, scene);
        bottomWall.position = new BABYLON.Vector3(0, wallHeight / 2, -(fieldHeight / 2));
        bottomWall.material = wallMaterial;
        walls.push(bottomWall);

        const leftWall = BABYLON.MeshBuilder.CreateBox("leftWall",
            {width: wallThickness, height: wallHeight, depth: fieldHeight + 1}, scene);
        leftWall.position = new BABYLON.Vector3(-(fieldWidth / 2), wallHeight / 2, 0);
        leftWall.material = wallMaterial;
        walls.push(bottomWall);

        const rightWall = BABYLON.MeshBuilder.CreateBox("rightWall",
            {width: wallThickness, height: wallHeight, depth: fieldHeight + 1}, scene);
        rightWall.position = new BABYLON.Vector3(fieldWidth / 2, wallHeight / 2, 0);
        rightWall.material = wallMaterial;
        walls.push(rightWall);


        return walls;
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
        material.emissiveColor = color;
        material.disableLighting = true;
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
