import fs from "fs";
import path from "path";

const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) {
    process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}

import { verifyLicenseKey } from "../lib/license";

console.log("checksum valid:", verifyLicenseKey("KAEM-ED8D-W84J-68A5"));
