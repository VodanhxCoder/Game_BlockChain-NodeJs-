import { createServiceApp } from '../shared/createServiceApp.js';
import { runService } from '../shared/runService.js';
import { testConnection } from '../shared/config/sequelize.js';
import authRoutes from './src/routes/auth.js';
import passwordRoutes from './src/routes/password.js';

const app = createServiceApp('auth-service');

app.use('/auth-service/auth', authRoutes);
app.use('/auth-service/auth', passwordRoutes);

await testConnection();
runService(app, 'auth-service', 'AUTH_SERVICE_PORT', 4001);
