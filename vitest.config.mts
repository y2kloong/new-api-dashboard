import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Vitest 5's default forks pool fails to initialise the test collector for
    // this project path ("Cannot read properties of undefined (reading
    // 'config')"). The VM pool loads the runner state correctly.
    pool: 'vmForks',
    reporters: ['default'],
  },
})
