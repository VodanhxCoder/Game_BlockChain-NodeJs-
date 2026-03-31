import { createServiceApp } from '../shared/createServiceApp.js';
import { runService } from '../shared/runService.js';
import { testConnection } from '../shared/config/sequelize.js';
import configRoutes from './src/routes/config.js';

const app = createServiceApp('blockchain-service');

app.use('/blockchain-service', configRoutes);

await testConnection();
runService(app, 'blockchain-service', 'BLOCKCHAIN_SERVICE_PORT', 4006);
