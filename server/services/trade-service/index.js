import { createServiceApp } from '../shared/createServiceApp.js';
import { runService } from '../shared/runService.js';
import { testConnection } from '../shared/config/sequelize.js';
import tradeRoutes from './src/routes/trade.js';
import HardhatBlockchainService from '../shared/blockchain/HardhatBlockchainService.js';

const app = createServiceApp('trade-service');

app.use('/trade-service', tradeRoutes);

await testConnection();
await HardhatBlockchainService.initialize();
runService(app, 'trade-service', 'TRADE_SERVICE_PORT', 4005);
