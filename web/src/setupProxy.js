const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api', // Requests to /api will be proxied
        createProxyMiddleware({
            target: 'http://localhost:8000', // Django backend
            changeOrigin: true, // Necessary for virtual hosted sites
        })
    );
};