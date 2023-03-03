#!/usr/bin/env node
const { execSync } = require("child_process");

const runCommand = (command) => {
  try {
    execSync(`${command}`, { stdio: `inherit` });
  } catch (e) {
    console.log(`Failed to execute ${command}`, e);
    return false;
  }
  return true;
};

const repoName = process.argv[2];
const gitCheckOutCommand = `git clone --depth 1 https://github.com/rapthappynbiang/create-webpack-starter-app.git ${repoName}`;
const installDepsCommand = `cd ${repoName} && npm install`;

console.log(`Cloning the repository with name ${repoName}`);
const checkedOut = runCommand(gitCheckOutCommand);
if (!checkedOut) process.exit(-1);

console.log(`Installing dependencies for ${repoName}`);
const installDeps = runCommand(installDepsCommand);
if (!installDeps) process.exit(-1);

console.log(
  "Successfully Installed dependencies: Follow the following commands to start"
);
console.log(`cd ${repoName} && npm run dev`);
