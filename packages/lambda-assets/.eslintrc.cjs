/** @type { import("eslint").Linter.Config } */
module.exports = {
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: __dirname,
      },
    },
  },
  overrides: [
    {
      files: ['**/src/**'],
      excludedFiles: ['**/__tests__/**', '**/*.test.ts?(x)'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: true,
            optionalDependencies: false,
            peerDependencies: true,
          },
        ],
      },
    },
  ],
};
