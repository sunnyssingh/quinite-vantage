const { defineConfig } = require('vitest/config')
const path = require('path')

module.exports = defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: './tests/setup.js',
        alias: {
            '@': path.resolve(__dirname, './')
        }
    },
})
