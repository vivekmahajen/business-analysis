// Run from the backend directory:
// node generate-api-key.js

const { PrismaClient } = require('../node_modules/.prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node generate-api-key.js your@email.com');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('User not found:', email);
    process.exit(1);
  }

  const rawKey = 'sk_live_' + crypto.randomBytes(24).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.substring(0, 12);

  await prisma.apiKey.create({
    data: { userId: user.id, keyHash, keyPrefix, name: 'Primary Key', plan: 'free' },
  });

  console.log('\n✓ API key created for', user.email);
  console.log('  Key:', rawKey);
  console.log('\nTest it:');
  console.log(`  curl https://siteanalyzer-backend-production-b23c.up.railway.app/api/v1/usage -H "X-API-Key: ${rawKey}"`);
  console.log('\nStore this key securely — it will not be shown again.\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
