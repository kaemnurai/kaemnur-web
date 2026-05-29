const crypto = require("crypto");
function cs(p1, p2, secret) {
  return crypto.createHmac("sha256", secret).update("KAEM-" + p1 + "-" + p2).digest("hex").toUpperCase().slice(0, 4);
}
// The intended secret value (the $ is literal, backslash is just .env escaping)
const good = "Km#9xP2vL" + "$" + "nR7qW4@jD6eY1uB8sF3hZ5";
console.log("good secret len:", good.length);
console.log("checksum for DWNF-KHNE (good):", cs("DWNF", "KHNE", good), "expected 85B9");

// What happens if someone pastes the .env value WITH the backslash into Vercel:
const withBackslash = "Km#9xP2vL\\$nR7qW4@jD6eY1uB8sF3hZ5";
console.log("with-backslash secret len:", withBackslash.length);

// What dotenv-expand does if the $ is NOT escaped (strips $nR7qW4 as undefined var):
const stripped = "Km#9xP2vL" + "@jD6eY1uB8sF3hZ5";
console.log("dollar-stripped secret len:", stripped.length);
