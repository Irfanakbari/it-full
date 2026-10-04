module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  testPathIgnorePatterns: ["/test/"],
  transform: { "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  collectCoverageFrom: ["src/**/*.(t|j)s", "!src/generated/**", "!src/main.ts"],
  coverageDirectory: "coverage",
  testEnvironment: "node",
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
};
