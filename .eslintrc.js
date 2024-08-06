// module.exports = {
//   parser: '@typescript-eslint/parser',
//   parserOptions: {
//     project: 'tsconfig.json',
//     tsconfigRootDir: __dirname,
//     sourceType: 'module',
//   },
//   plugins: ['@typescript-eslint/eslint-plugin'],
//   extends: [
//     'plugin:@typescript-eslint/recommended',
//     'plugin:prettier/recommended',
//   ],
//   root: true,
//   env: {
//     node: true,
//     jest: true,
//   },
//   ignorePatterns: ['.eslintrc.js'],
//   rules: {
//     '@typescript-eslint/interface-name-prefix': 'off',
//     '@typescript-eslint/explicit-function-return-type': 'off',
//     '@typescript-eslint/explicit-module-boundary-types': 'off',
//     '@typescript-eslint/no-explicit-any': 'off',
//   },
// };

// .prettierrc에서 주석처리하면 에러 뱉길래 이쪽에 백업
// {
//   "singleQuote": true,
//   "trailingComma": "all"
// }

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'prettier', // Prettier 플러그인 추가
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Prettier 권장 설정 추가
    'prettier/@typescript-eslint', // TypeScript와 Prettier 충돌 방지 설정
    'google', // Google 스타일 가이드 추가
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'linebreak-style': ['error', 'windows'],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'object-curly-spacing': 'off', // 중괄호 공백 관련 규칙 비활성화
    'require-jsdoc': 'off', // JSDoc 관련 규칙 비활성화
    'indent': 'off', // 들여쓰기 관련 규칙 비활성화
    'new-cap': 'off',
    'max-len': 'off', // max-len 규칙 비활성화
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: true,
        useTabs: false,
        tabWidth: 2,
        trailingComma: 'all',
        printWidth: 80,
        bracketSpacing: true,
        endOfLine: 'auto',
        quoteProps: 'consistent',
      },
    ],
    // 필요에 따라 추가적인 ESLint 규칙을 정의
  },
};
