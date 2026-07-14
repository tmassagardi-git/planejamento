import fs from 'node:fs';

// Parser mínimo de .env — evita depender de um pacote externo só para KEY=VALUE.
function loadDotEnv(filePath = '.env') {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

export const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/blank/',
  defaultToken: process.env.API_TOKEN || undefined,
  defaultLimite: Number(process.env.API_DEFAULT_LIMITE) || 1000,
};

let cachedRegistry;

// Registro de tokens individuais por cliente (config/clients.json, fora do git).
export function loadClientsRegistry(filePath = 'config/clients.json') {
  if (cachedRegistry) return cachedRegistry;
  if (!fs.existsSync(filePath)) {
    cachedRegistry = {};
    return cachedRegistry;
  }
  cachedRegistry = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return cachedRegistry;
}

export function resolveClientToken(codigoCliente, { registryPath } = {}) {
  const registry = loadClientsRegistry(registryPath);
  const entry = registry[codigoCliente];
  if (entry?.token) return entry.token;
  if (config.defaultToken) return config.defaultToken;
  throw new Error(
    `Token não encontrado para o cliente "${codigoCliente}". ` +
      'Configure em config/clients.json (veja config/clients.example.json) ou defina API_TOKEN no .env.'
  );
}
