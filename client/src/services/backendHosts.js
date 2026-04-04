const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const normalizeHost = (value) => (value || '').replace(/\/+$/, '');

const fallbackBase = normalizeHost(env.VITE_API_BASE_URL || '');

const hostOrDefault = (envName, defaultPort) => {
  const fromEnv = normalizeHost(env[envName] || '');
  if (fromEnv) return fromEnv;
  if (fallbackBase) return fallbackBase;
  return `http://localhost:${defaultPort}`;
};

export const SERVICE_HOSTS = {
  auth: hostOrDefault('VITE_AUTH_SERVICE_URL', 4001),
  user: hostOrDefault('VITE_USER_SERVICE_URL', 4002),
  inventory: hostOrDefault('VITE_INVENTORY_SERVICE_URL', 4003),
  marketplace: hostOrDefault('VITE_MARKETPLACE_SERVICE_URL', 4004),
  trade: hostOrDefault('VITE_TRADE_SERVICE_URL', 4005),
  blockchain: hostOrDefault('VITE_BLOCKCHAIN_SERVICE_URL', 4006),
  admin: hostOrDefault('VITE_ADMIN_SERVICE_URL', 4007),
  game: hostOrDefault('VITE_GAME_SERVICE_URL', 4008)
};

export const joinServiceUrl = (serviceHost, servicePath) => {
  const host = normalizeHost(serviceHost);
  const path = servicePath.startsWith('/') ? servicePath : `/${servicePath}`;
  return `${host}${path}`;
};

export const mapLegacyApiUrl = (url) => {
  if (!url || typeof url !== 'string') return url;

  if (url.startsWith('/uploads/')) {
    return joinServiceUrl(SERVICE_HOSTS.admin, url);
  }

  if (!url.startsWith('/api/')) {
    return url;
  }

  const resource = url.slice('/api/'.length);

  if (resource.startsWith('auth/')) {
    return joinServiceUrl(SERVICE_HOSTS.auth, `/auth-service/auth/${resource.slice('auth/'.length)}`);
  }

  if (resource.startsWith('admin/dashboard/')) {
    return joinServiceUrl(SERVICE_HOSTS.admin, `/admin-service/admin/dashboard/${resource.slice('admin/dashboard/'.length)}`);
  }

  if (resource.startsWith('admin/')) {
    return joinServiceUrl(SERVICE_HOSTS.admin, `/admin-service/admin/${resource.slice('admin/'.length)}`);
  }

  if (resource.startsWith('user/')) {
    return joinServiceUrl(SERVICE_HOSTS.user, `/user-service/user/${resource.slice('user/'.length)}`);
  }

  if (resource.startsWith('inventory/')) {
    return joinServiceUrl(SERVICE_HOSTS.inventory, `/inventory-service/inventory/${resource.slice('inventory/'.length)}`);
  }

  if (resource === 'drop' || resource.startsWith('drop?')) {
    return joinServiceUrl(SERVICE_HOSTS.inventory, `/inventory-service/drop${resource.slice('drop'.length)}`);
  }

  if (resource === 'drop-pool' || resource.startsWith('drop-pool?')) {
    return joinServiceUrl(SERVICE_HOSTS.inventory, `/inventory-service/drop-pool${resource.slice('drop-pool'.length)}`);
  }

  if (resource.startsWith('market/prepare-trade')) {
    return joinServiceUrl(SERVICE_HOSTS.trade, `/trade-service/trade/prepare${resource.slice('market/prepare-trade'.length)}`);
  }

  if (resource.startsWith('market/confirm-trade')) {
    return joinServiceUrl(SERVICE_HOSTS.trade, `/trade-service/trade/confirm${resource.slice('market/confirm-trade'.length)}`);
  }

  if (resource.startsWith('market/execute-trade')) {
    return joinServiceUrl(SERVICE_HOSTS.trade, `/trade-service/trade/execute${resource.slice('market/execute-trade'.length)}`);
  }

  if (resource.startsWith('market/')) {
    return joinServiceUrl(SERVICE_HOSTS.marketplace, `/marketplace-service/market/${resource.slice('market/'.length)}`);
  }

  if (resource === 'config' || resource.startsWith('config?')) {
    return joinServiceUrl(SERVICE_HOSTS.blockchain, `/blockchain-service/config${resource.slice('config'.length)}`);
  }

  return url;
};
