// jest.config.js
module.exports = {
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  // transform: {
  //   "^.+\\.(ts|tsx)$": "<rootDir>/preprocessor.js"
  // },
  "roots": [
    "<rootDir>/src"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  testURL: "http://localhost",
  testMatch: ["**/tests/*.(ts|tsx|js|jsx)"],
  moduleDirectories: ["node_modules", "bower_components"]
};
