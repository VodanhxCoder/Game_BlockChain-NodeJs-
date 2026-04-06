import { createServiceApp } from '../shared/createServiceApp.js';
import { runService } from '../shared/runService.js';
import { testConnection } from '../shared/config/sequelize.js';
import tradeRoutes from './src/routes/trade.js';

const app = createServiceApp('trade-service');

app.use('/trade-service', tradeRoutes);

await testConnection();
runService(app, 'trade-service', 'TRADE_SERVICE_PORT', 4005);
