import { createServiceApp } from '../shared/createServiceApp.js';
import { runService } from '../shared/runService.js';
import { testConnection } from '../shared/config/sequelize.js';
import userRoutes from './src/routes/user.js';

const app = createServiceApp('user-service');

app.use('/user-service', userRoutes);

await testConnection();
runService(app, 'user-service', 'USER_SERVICE_PORT', 4002);
