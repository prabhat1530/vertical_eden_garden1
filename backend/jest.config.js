module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: ['**/tests/**/*.test.js'],
    testTimeout: 30000,
    // mongodb-memory-server can be slow to download the first time.
    verbose: true,
};
