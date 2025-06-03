const fs = require("fs");
const path = require("path");

// Clean package-lock.json
const packageLockPath = path.join(__dirname, "../package-lock.json");
if (fs.existsSync(packageLockPath)) {
  console.log("Cleaning package-lock.json...");
  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, "utf8"));

  // Remove Vercel-related dependencies
  const cleanDependencies = (deps) => {
    if (!deps) return deps;
    const newDeps = { ...deps };
    Object.keys(newDeps).forEach((key) => {
      if (key.includes("vercel")) {
        delete newDeps[key];
      }
    });
    return newDeps;
  };

  // Clean dependencies and devDependencies
  if (packageLock.dependencies) {
    packageLock.dependencies = cleanDependencies(packageLock.dependencies);
  }
  if (packageLock.devDependencies) {
    packageLock.devDependencies = cleanDependencies(
      packageLock.devDependencies,
    );
  }
  if (packageLock.packages) {
    Object.keys(packageLock.packages).forEach((pkg) => {
      if (pkg.includes("vercel") || pkg.includes("@vercel")) {
        delete packageLock.packages[pkg];
      } else if (packageLock.packages[pkg].dependencies) {
        packageLock.packages[pkg].dependencies = cleanDependencies(
          packageLock.packages[pkg].dependencies,
        );
      }
    });
  }

  fs.writeFileSync(packageLockPath, JSON.stringify(packageLock, null, 2));
  console.log("package-lock.json cleaned successfully");
}

// Clean pnpm-lock.yaml
const pnpmLockPath = path.join(__dirname, "../pnpm-lock.yaml");
if (fs.existsSync(pnpmLockPath)) {
  console.log("Cleaning pnpm-lock.yaml...");
  let pnpmLock = fs.readFileSync(pnpmLockPath, "utf8");

  // Remove Vercel-related dependencies
  const lines = pnpmLock.split("\n");
  let inVercelBlock = false;
  let output = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("@vercel/") || line.includes("vercel-")) {
      inVercelBlock = true;
      continue;
    }

    if (inVercelBlock && line.trim() === "") {
      inVercelBlock = false;
      continue;
    }

    if (!inVercelBlock) {
      output.push(line);
    }
  }

  fs.writeFileSync(pnpmLockPath, output.join("\n"));
  console.log("pnpm-lock.yaml cleaned successfully");
}

console.log("Cleanup complete!");
