"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const patient_routes_1 = __importDefault(require("./routes/patient.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const expert_routes_1 = __importDefault(require("./routes/expert.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/patients', patient_routes_1.default);
app.use('/api/appointments', appointment_routes_1.default);
app.use('/api/experts', expert_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/reports', reports_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
const startServer = async () => {
    try {
        await (0, database_1.connectDatabase)();
        app.listen(PORT, () => {
            console.log('=================================');
            console.log(` Server running on port ${PORT}`);
            console.log(` Environment: ${process.env.NODE_ENV}`);
            console.log(` API: http://localhost:${PORT}/api`);
            console.log(`  Health: http://localhost:${PORT}/health`);
            console.log('=================================');
        });
    }
    catch (error) {
        console.error(' Server startup error:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map