import fs from "fs";
import path from "path";

export default function (context) {
  const appPath = context.appOutDir;
  const envPath = path.join(process.cwd(), ".env.local");

  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, path.join(appPath, ".env.local"));
    console.log("✅ Copied .env.local to app bundle");
  }
}