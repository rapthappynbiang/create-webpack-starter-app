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
    name: "project-name",
    type: "input",
    message: "Project name:",
    validate: function (input) {
      if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
      else
        return "Project name may only include letters, numbers, underscores and hashes.";
    },
  },
  {
    name: "project-description",
    type: "input",
    message: "Description:",
    default: "",
  },
  {
    name: "port",
    type: "input",
    message: "Port:",
    default: 3000,
    validate: function (input) {
      if (
        /^((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4}))$/.test(
          input
        )
      )
        return true;
      else return "invalid port number.";
    },
  },
  {
    name: "language-choice",
    type: "list",
    message: "Choose the language of you choice:",
    choices: CHOICES,
  },
];

prompt(QUESTIONS).then((answers) => {
  const projectName = answers["project-name"];
  const projectDescription = answers["project-description"];
  const port = answers["port"];
  // path of the project to copy
  const languageChoice = answers["language-choice"];
  const templatePath = `${__dirname}/templates/${languageChoice}`;

  const packageJsonProperties = {
    name: projectName,
    description: projectDescription,
  };

  fs.mkdirSync(`${CURR_DIR}/${projectName}`);
  createDirectoryContents(templatePath, projectName);
  const packageJson = `${CURR_DIR}/${projectName}/package.json`;

  // rewrite package.json file
  rewritePackageJson(packageJson, packageJsonProperties);

  //write  webpack files
  writeWebpack(`${CURR_DIR}/${projectName}`, { port, languageChoice });
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
  });
}

function rewritePackageJson(pathTopackageJson, properties) {
  const packageJson = JSON.parse(fs.readFileSync(pathTopackageJson, "utf-8"));

  const newPackageJson = JSON.stringify(
    { ...packageJson, ...properties },
    null,
    2
  );
  fs.writeFileSync(pathTopackageJson, newPackageJson);
}

// create webpack content
export async function writeWebpack(projectPath, { port }) {
  //webpack.dev file content
  const webpackDevContent = `const { merge } = require("webpack-merge");
 const common = require("./webpack.common.js");
 
 module.exports = merge(common, {
   mode: "development",
   output: {
     publicPath: 'http://localhost:${port}/',
   },
   devServer: {
     port: ${port},
     historyApiFallback: true,
     hot: true,
   },
 });`;

  // webpack.prod file content
  const webpackProdContent = `const { merge } = require('webpack-merge');
   const common = require('./webpack.common.js');
   
   const URI = process.env.SERVER_URI;
   module.exports= merge(common, {
       mode: "production",
       output: {
         filename: "bundle.[contenthash].js", // change the output filename to the project name
         clean: true,
         publicPath: \`http://${"${URI}"}:${port}/\`
       }
   })`;

  try {
    fs.writeFileSync(
      `${projectPath}/webpack/webpack.dev.js`,
      webpackDevContent
    );
    fs.writeFileSync(
      `${projectPath}/webpack/webpack.prod.js`,
      webpackProdContent
    );
  } catch (err) {
    console.log("ERROR: ", err);
  }
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

  console.log("\n");
  console.log(`Installing all dependencies for ${repoName}`);
  const installDeps = runCommand(installDepsCommand);
  if (!installDeps) process.exit(-1);

  console.log(
    "Successfully Installed dependencies: Follow the following commands to start"
  );
  console.log(`cd ${repoName} && npm run dev`);
}
