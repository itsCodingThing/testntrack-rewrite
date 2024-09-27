module.exports = {
    apps: [
        {
            name: "tnt_backend",
            script: "./build/server.js",
            env_production: {
                NODE_ENV: "production",
            },
            env_development: {
                NODE_ENV: "development",
                watch: true,
            },
        },
    ],
};
