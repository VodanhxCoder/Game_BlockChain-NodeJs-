import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServiceApp } from '../shared/createServiceApp.js';
import { runService } from '../shared/runService.js';
import { testConnection } from '../shared/config/sequelize.js';
import adminRoutes from './src/routes/admin.js';
import dashboardRoutes from './src/routes/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const app = createServiceApp('admin-service');

app.use('/uploads', express.static(uploadsPath));
app.use('/admin-service/admin', adminRoutes);
app.use('/admin-service/admin/dashboard', dashboardRoutes);

await testConnection();
runService(app, 'admin-service', 'ADMIN_SERVICE_PORT', 4007);
