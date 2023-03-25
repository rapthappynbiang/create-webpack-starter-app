import type { Config } from "@jest/types";

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  testEnvironment: "jsdom",
  moduleDirectories: ["node_modules", "src"],
  moduleNameMapper: {
    ".(css|less|scss)$": "identity-obj-proxy",
    "\\.svg": "<rootDir>/__mocks__/svg.ts",
  },
  transform: {
    "\\.[jt]sx?$": "babel-jest",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/fileTransformer.ts",
  },
};
export default config;
