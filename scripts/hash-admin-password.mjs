import bcrypt from "bcryptjs";

const password = process.argv.slice(2).join(" ").trim();
if (!password) {
  console.error('Usage: npm run hash-admin-password -- "your-admin-password"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("Hash:");
console.log(hash);
console.log("\nPut this in .env.local (dollars escaped for Next.js):");
console.log(`ADMIN_PASSWORD_HASH=${hash.replaceAll("$", "\\$")}`);
