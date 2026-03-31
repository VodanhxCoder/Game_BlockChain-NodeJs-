import { createServiceApp } from '../shared/createServiceApp.js';
import { runService } from '../shared/runService.js';
import { testConnection } from '../shared/config/sequelize.js';
import marketRoutes from './src/routes/market.js';

const app = createServiceApp('marketplace-service');

app.use('/marketplace-service', marketRoutes);

await testConnection();
runService(app, 'marketplace-service', 'MARKETPLACE_SERVICE_PORT', 4004);
