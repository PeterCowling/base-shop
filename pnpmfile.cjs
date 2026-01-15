/** @type {import('pnpm').Hooks} */
module.exports = {
  hooks: {
    readPackage(pkg) {
      const ensurePeer = (dep, range) => {
        pkg.peerDependencies = pkg.peerDependencies || {};
        pkg.peerDependencies[dep] = range;
      };

      if (pkg.name === "vite-plugin-istanbul" && pkg.version?.startsWith("6.")) {
        ensurePeer("vite", ">=4 <=7");
      }

      if (pkg.name === "cypress-image-snapshot" && pkg.version?.startsWith("4.")) {
        ensurePeer("cypress", ">=4.5.0");
      }

      if (pkg.name === "jest-image-snapshot" && pkg.version?.startsWith("4.")) {
        ensurePeer("jest", ">=20 <30");
      }

      if (pkg.name === "@typescript-eslint/utils" && pkg.version?.startsWith("5.")) {
        ensurePeer("eslint", ">=6 <10");
      }

      return pkg;
    },
  },
};