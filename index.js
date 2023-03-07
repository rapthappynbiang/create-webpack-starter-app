#!/usr/bin/env node

import { createPromptModule } from "inquirer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const CURR_DIR = process.cwd();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prompt = createPromptModule();
const CHOICES = fs.readdirSync(`${__dirname}/templates`);

const QUESTIONS = [
  {
    name: "project-choice",
    type: "list",
    message: "What project template would you like to generate?",
    choices: CHOICES,
  },
  {
    name: "project-name",
    type: "input",
    message: "Project name:",
    validate: function (input) {
      if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
      else
        return "Project name may only include letters, numbers, underscores and hashes.";
    },
  },
];

prompt(QUESTIONS).then((answers) => {
  const projectChoice = answers["project-choice"];
  const projectName = answers["project-name"];
  const templatePath = `${__dirname}/templates/${projectChoice}`;

  fs.mkdirSync(`${CURR_DIR}/${projectName}`);
  createDirectoryContents(templatePath, projectName);
  const packageJson = `${CURR_DIR}/${projectName}/package.json`;
  rewritePackageJson(packageJson, { name: projectName });
  runInstallation(projectName);
});

function createDirectoryContents(templatePath, newProjectPath) {
  const filesToCreate = fs.readdirSync(templatePath);

  filesToCreate.forEach((file) => {
    const origFilePath = `${templatePath}/${file}`;

    // get stats about the current file
    const stats = fs.statSync(origFilePath);

    if (stats.isFile()) {
      const contents = fs.readFileSync(origFilePath, "utf8");

      // Rename
      if (file === ".npmignore") file = ".gitignore";

      const writePath = `${CURR_DIR}/${newProjectPath}/${file}`;
      fs.writeFileSync(writePath, contents, "utf8");
    } else if (stats.isDirectory()) {
      fs.mkdirSync(`${CURR_DIR}/${newProjectPath}/${file}`);

      // recursive call
      createDirectoryContents(
        `${templatePath}/${file}`,
        `${newProjectPath}/${file}`
      );
    }

    const filePath = `${CURR_DIR}/${newProjectPath}/package.json`;
  });
}

function rewritePackageJson(pathTopackageJson, properties) {
  const packageJson = JSON.parse(fs.readFileSync(pathTopackageJson, "utf-8"));

  const newPackageJson = JSON.stringify({ ...packageJson, ...properties });
  fs.writeFileSync(pathTopackageJson, newPackageJson);
}

const runCommand = (command) => {
  try {
    execSync(`${command}`, { stdio: `inherit` });
  } catch (e) {
    console.log(`Failed to execute ${command}`, e);
    return false;
  }
  return true;
};

function runInstallation(repoName) {
  const installDepsCommand = `cd ${repoName} && npm install`;

  console.log(`Installing dependencies for ${repoName}`);
  const installDeps = runCommand(installDepsCommand);
  if (!installDeps) process.exit(-1);

  console.log(
    "Successfully Installed dependencies: Follow the following commands to start"
  );
  console.log(`cd ${repoName} && npm run dev`);
}
