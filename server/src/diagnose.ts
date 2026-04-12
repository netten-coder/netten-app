console.log('[1] Starting diagnostics...');

try {
  console.log('[2] Importing Fastify...');
  require('fastify');
  console.log('[2] ✓ Fastify OK');
} catch (e: any) { console.error('[2] ✗ Fastify:', e.message); }

try {
  console.log('[3] Importing Prisma...');
  require('./lib/db');
  console.log('[3] ✓ Prisma OK');
} catch (e: any) { console.error('[3] ✗ Prisma:', e.message); }

try {
  console.log('[4] Importing Resend lib...');
  require('./lib/resend');
  console.log('[4] ✓ Resend lib OK');
} catch (e: any) { console.error('[4] ✗ Resend lib:', e.message); }

try {
  console.log('[5] Importing xrpl-dex service...');
  require('./services/xrpl-dex.service');
  console.log('[5] ✓ xrpl-dex OK');
} catch (e: any) { console.error('[5] ✗ xrpl-dex:', e.message); }

try {
  console.log('[6] Importing auth routes...');
  require('./routes/auth');
  console.log('[6] ✓ auth routes OK');
} catch (e: any) { console.error('[6] ✗ auth routes:', e.message); }

try {
  console.log('[7] Importing transak webhook...');
  require('./routes/transak.webhook');
  console.log('[7] ✓ transak webhook OK');
} catch (e: any) { console.error('[7] ✗ transak webhook:', e.message); }

console.log('[DONE] All imports checked');
