// COMPREHENSIVE DIAGNOSTIC - Tests all imports and startup
console.log('='.repeat(60));
console.log('[DIAG] NETTEN SERVER FULL DIAGNOSTIC');
console.log('='.repeat(60));
console.log('[DIAG] Node version:', process.version);
console.log('[DIAG] Working dir:', process.cwd());
console.log('[DIAG] NODE_ENV:', process.env.NODE_ENV);
console.log('');

// Check critical env vars
console.log('[DIAG] Checking environment variables...');
const envVars = [
  'JWT_SECRET', 'JWT_REFRESH_SECRET', 'MAGIC_LINK_SECRET',
  'DATABASE_URL', 'RESEND_API_KEY', 'PORT',
  'XRPL_PLATFORM_WALLET_ADDRESS', 'XRPL_PLATFORM_WALLET_SECRET',
  'XRPL_PLATFORM_WALLET_SEED', 'FEE_WALLET_ADDRESS', 'FEE_WALLET_SEED'
];
envVars.forEach(v => {
  const val = process.env[v];
  console.log(`  ${v}: ${val ? '✓ SET (' + val.substring(0,8) + '...)' : '✗ MISSING'}`);
});
console.log('');

// Test each import
const imports = [
  ['fastify', 'fastify'],
  ['@fastify/cors', '@fastify/cors'],
  ['@fastify/cookie', '@fastify/cookie'],
  ['@fastify/jwt', '@fastify/jwt'],
  ['@fastify/rate-limit', '@fastify/rate-limit'],
  ['prisma db', './lib/db'],
  ['resend lib', './lib/resend'],
  ['xrpl service', './services/xrpl'],
  ['xrpl-dex service', './services/xrpl-dex.service'],
  ['email service', './services/email.service'],
  ['auth routes', './routes/auth'],
  ['merchant routes', './routes/merchant'],
  ['transaction routes', './routes/transactions'],
  ['invoice routes', './routes/invoices'],
  ['payment-links routes', './routes/payment-links'],
  ['rewards routes', './routes/rewards'],
  ['webhooks routes', './routes/webhooks'],
  ['waitlist routes', './routes/waitlist'],
  ['subscriptions routes', './routes/subscriptions'],
  ['offramp routes', './routes/offramp'],
  ['onramp routes', './routes/onramp'],
  ['xaman routes', './routes/xaman'],
  ['email routes', './routes/email-routes'],
  ['transak webhook', './routes/transak.webhook'],
  ['security middleware', './middleware/security'],
  ['rewardsSweep job', './jobs/rewardsSweep'],
];

console.log('[DIAG] Testing imports...');
for (const [name, path] of imports) {
  try {
    require(path);
    console.log(`  ✓ ${name}`);
  } catch (e: any) {
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}
console.log('');

// Try to actually start the server
console.log('[DIAG] Attempting server startup...');
try {
  const { start } = require('./index');
  console.log('  ✓ index.ts loaded');
  console.log('  Calling start()...');
} catch (e: any) {
  console.log(`  ✗ index.ts failed: ${e.message}`);
  console.log(`  Stack: ${e.stack}`);
}

console.log('');
console.log('='.repeat(60));
console.log('[DIAG] DIAGNOSTIC COMPLETE');
console.log('='.repeat(60));
