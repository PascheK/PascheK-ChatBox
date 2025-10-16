import fs from "fs";
import path from "path";

const dir = "./dist-electron";

function renameToCjs(folder) {
  const files = fs.readdirSync(folder);
  for (const file of files) {
    const fullPath = path.join(folder, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      renameToCjs(fullPath);
    } else if (file.endsWith(".js")) {
      const newPath = fullPath.replace(/\.js$/, ".cjs");
      fs.renameSync(fullPath, newPath);
      console.log(`Renamed: ${file} → ${path.basename(newPath)}`);
    }
  }
}

renameToCjs(dir);