declare var BABYLON: any;

export class GameObjectFactory {
    
    static createCamera(
        scene: any,
        name: string,
        position: any,
        viewport: any,
        is2D: boolean
    ): any {
        const camera = new BABYLON.FreeCamera(name, position, scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.viewport = viewport;
        if (is2D)
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
        color: any,
        is2D: boolean
    ): any {
        const ground = BABYLON.MeshBuilder.CreateGround(name, {
            width: width,
            height: height
        }, scene);
        
        const material = new BABYLON.StandardMaterial(name + "Material", scene);
        if (is2D) {
            material.emissiveColor = color;
            material.disableLighting = true;
        } else
            material.diffuseColor = color;
        ground.material = material;
        
        return ground;
    }

    static createWalls(
        scene: any,
        name: string,
        fieldWidth: number,
        fieldHeight: number,
        wallHeight: number,
        wallThickness: number,
        color: any,
        is2D: boolean
    ):any[] {
        const walls: any[] = [];
        const material = new BABYLON.StandardMaterial(name + "Material", scene);
        if (is2D) {
            material.emissiveColor = color;
            material.disableLighting = true;
        } else
            material.diffuseColor = color;

        const topWall = BABYLON.MeshBuilder.CreateBox("topWall",
            {width: fieldWidth, height: wallHeight, depth: wallThickness}, scene);
        topWall.position = new BABYLON.Vector3(0, wallHeight / 2, fieldHeight / 2);
        topWall.material = material;
        walls.push(topWall);

        const bottomWall = BABYLON.MeshBuilder.CreateBox("bottomWall",
            {width: fieldWidth, height: wallHeight, depth: wallThickness}, scene);
        bottomWall.position = new BABYLON.Vector3(0, wallHeight / 2, -(fieldHeight / 2));
        bottomWall.material = material;
        walls.push(bottomWall);

        const leftWall = BABYLON.MeshBuilder.CreateBox("leftWall",
            {width: wallThickness, height: wallHeight, depth: fieldHeight + 1}, scene);
        leftWall.position = new BABYLON.Vector3(-(fieldWidth / 2), wallHeight / 2, 0);
        leftWall.material = material;
        walls.push(bottomWall);

        const rightWall = BABYLON.MeshBuilder.CreateBox("rightWall",
            {width: wallThickness, height: wallHeight, depth: fieldHeight + 1}, scene);
        rightWall.position = new BABYLON.Vector3(fieldWidth / 2, wallHeight / 2, 0);
        rightWall.material = material;
        walls.push(rightWall);


        return walls;
    }

    static createPlayer(
        scene: any,
        name: string,
        position: any,
        size: any,
        color: any,
        is2D: boolean
    ): any {
        const player = BABYLON.MeshBuilder.CreateBox(name, {
            width: size.x, 
            height: size.y, 
            depth: size.z }, scene);
        const material = new BABYLON.StandardMaterial(name + "Material", scene);
        if (is2D) {
            material.emissiveColor = color;
            material.disableLighting = true;
        } else
            material.diffuseColor = color;
        player.material = material;
        player.position = position;
        return player;
    }

    static createBall(
        scene: any,
        name: string,
        position: any,
        color: any,
        is2D: boolean
    ): any {
        const ball = BABYLON.MeshBuilder.CreateSphere(name, {}, scene);
        const material = new BABYLON.StandardMaterial(name + "Material", scene);
        if (is2D) {
            material.emissiveColor = color;
            material.disableLighting = true;
        } else
            material.diffuseColor = color;
        ball.material = material;
        ball.position = position;
        return ball;
    }
}