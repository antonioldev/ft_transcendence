export interface Config {
    server: {
        host: string;
        port: number;
    };
    
    // database?: { //Exampe
    //     host: string;
    //     port: number;
    //     name: string;
    //     user: string;
    //     password: string;
    // };
    debug: string;
}

const config: Config = {
    server: {
        host: '0.0.0.0',
        port: parseInt(process.env.BACKEND_PORT || '3000', 10)
    },
    // database: { //Exampe
    //     host: process.env.DB_HOST || 'localhost',
    //     port: parseInt(process.env.DB_PORT || '5432', 10),
    //     name: process.env.DB_NAME || 'pong_game',
    //     user: process.env.DB_USER || 'postgres',
    //     password: process.env.DB_PASSWORD || 'password'
    // },
    debug: process.env.DEBUG || 'no'
};

export default config;