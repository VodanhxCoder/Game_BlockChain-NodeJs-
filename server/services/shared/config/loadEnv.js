import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const servicesRoot = path.resolve(__dirname, '..', '..');
const serverRoot = path.resolve(servicesRoot, '..');

// Always load root env first, then allow service env to override.
dotenv.config({ path: path.join(serverRoot, '.env') });

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const normalizedServicesRoot = servicesRoot + path.sep;

if (entryFile.startsWith(normalizedServicesRoot)) {
  const relative = path.relative(servicesRoot, entryFile);
  const [serviceName] = relative.split(path.sep);

  if (serviceName && serviceName !== 'shared') {
    const serviceEnvPath = path.join(servicesRoot, serviceName, '.env');
    if (fs.existsSync(serviceEnvPath)) {
      dotenv.config({ path: serviceEnvPath, override: true });
    }
  }
}
