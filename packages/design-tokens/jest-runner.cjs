#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");
const jest = require("jest");

let extraArgs = process.argv.slice(2);
if (extraArgs[0] === "--") {
  extraArgs = extraArgs.slice(1);
}
const configPath = path.join(__dirname, "..", "..", "jest.config.cjs");

const jestArgs = [
  "--ci",
  "--runInBand",
  "--config",
  configPath,
  ...extraArgs,
];

jest.run(jestArgs);
