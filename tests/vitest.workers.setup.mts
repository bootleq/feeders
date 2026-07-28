import { env } from 'cloudflare:workers';
import { vi } from 'vitest';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => ({ env }),
}));
