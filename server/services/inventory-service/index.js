import { createServiceApp } from '../shared/createServiceApp.js';
import { runService } from '../shared/runService.js';
import { testConnection } from '../shared/config/sequelize.js';
import inventoryRoutes from './src/routes/inventory.js';

const app = createServiceApp('inventory-service');

app.use('/inventory-service', inventoryRoutes);

await testConnection();
runService(app, 'inventory-service', 'INVENTORY_SERVICE_PORT', 4003);
