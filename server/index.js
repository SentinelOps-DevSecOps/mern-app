require('dotenv').config();

const express = require('express');

const getConnection = require('./utils/getConnection');
const userRoutes = require('./routes/user');
const homeRoutes = require('./routes/home');

const app = express();

// Disable x-powered-by header to prevent server identification
app.disable('x-powered-by');

// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:5000 http://localhost:3000;");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Middleware with payload size limits
app.use(express.json({ limit: '10kb' }));
app.use(
    express.urlencoded({
        extended: true,
        limit: '10kb',
    })
);

// Routes
app.use('/', homeRoutes);
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "UP"
    });
});
app.use('/user/auth', userRoutes);

// Error Handler (4 arguments required by Express)
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Internal Server Error' : (error.message || 'Error occurred');

    res.status(statusCode).json({
        message,
        status: false
    });
});

// Database Connection
getConnection();

// Start Server
app.listen(process.env.PORT,'0.0.0.0', () => {
    console.log(
        'Server is running on port: ' + process.env.PORT
    );
});
