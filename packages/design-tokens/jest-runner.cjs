#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Jest runner intentionally uses require for Node CLI entry (ENG-1234) */

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
