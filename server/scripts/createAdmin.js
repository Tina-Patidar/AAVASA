/**
 * Development-only administrator creation.
 *
 * There is deliberately NO public API for becoming an admin. This script runs from a terminal on a
 * machine that already holds your MONGODB_URI, so only someone with database access can use it.
 *
 * Usage (credentials come from the environment or an interactive prompt, never from source code):
 *   ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" ADMIN_PASSWORD='StrongPass123' npm run create-admin
 *   npm run create-admin          (prompts for each value; the password prompt is hidden)
 *
 * If the email already belongs to a user, that user is promoted to admin.
 */
import readline from 'node:readline';
import { assertEnv, env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
        else rl.output.write('*');
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

async function run() {
  assertEnv();
  if (env.isProd && !process.argv.includes('--allow-production')) {
    throw new Error('This script is intended for development. Add --allow-production if you really need it on a production database.');
  }

  const roleInput = (process.env.ROLE || process.env.ADMIN_ROLE || 'admin').toLowerCase();
  const role = roleInput === 'staff' ? 'staff' : 'admin';
  const roleLabel = role === 'staff' ? 'Staff' : 'Admin';

  const email = (process.env.ADMIN_EMAIL || (await ask(`${roleLabel} email: `))).toLowerCase();
  const name = process.env.ADMIN_NAME || (await ask(`${roleLabel} name: `));
  const password = process.env.ADMIN_PASSWORD || (await ask(`${roleLabel} password (min 8 chars, letters + numbers): `, { hidden: true }));

  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Please provide a valid email address.');
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Password must be at least 8 characters and contain letters and numbers.');
  }

  await connectDB(env.MONGODB_URI);
  const existing = await User.findOne({ email }).select('+password');
  if (existing) {
    existing.role = role;
    existing.isActive = true;
    await existing.save();
    console.log(`[${role}] ${email} already existed and now has role '${role}'. Their password was not changed.`);
  } else {
    await User.create({ name: name || `AAVASA ${roleLabel}`, email, password, role });
    console.log(`[${role}] ${role} account created for ${email}.`);
  }
}

run()
  .catch((err) => {
    console.error('[admin] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
