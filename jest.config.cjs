module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  modulePathIgnorePatterns: [
    "<rootDir>/inspiration-for-frontend/",
    "<rootDir>/inpireation-for-frontend 2/",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/inspiration-for-frontend/",
    "<rootDir>/inpireation-for-frontend 2/",
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
};
