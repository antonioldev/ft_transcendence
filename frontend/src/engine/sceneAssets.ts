export const MAP_ASSETS = {
    ground: {
        diffuse: "assets/textures/map1/ground/floor_diff_1k.jpg",
        normal: "assets/textures/map1/ground/floor_nor_gl_1k.jpg",
        roughness: "assets/textures/map1/ground/floor_rough_1k.jpg"
    },
    walls: {
        diffuse: "assets/textures/map1/wall/wall_diff_1k.jpg",
        normal: "assets/textures/map1/wall/wall_nor_gl_1k.jpg",
        roughness: "assets/textures/map1/wall/wall_rough_1k.jpg"
    },
    ball: {
        diffuse: "assets/textures/map1/ball/ball_diff_1k.jpg",
        normal: "assets/textures/map1/ball/ball_nor_gl_1k.jpg",
        roughness: "assets/textures/map1/ball/ball_rough_1k.jpg"
    },
    paddle: {
        diffuse: "assets/textures/map1/paddle/paddle_diff_1k.jpg",
        normal: "assets/textures/map1/paddle/paddle_nor_gl_1k.jpg",
        roughness: "assets/textures/map1/paddle/paddle_rough_1k.jpg"
    },
    skybox: "assets/test2k.hdr"
};

export type TextureSet = {
    diffuse: string;
    normal: string;
    roughness: string;
};

export type MapAssetConfig = {
    ground: TextureSet;
    walls: TextureSet;
    ball: TextureSet;
    paddle: TextureSet;
    skybox: string;
};