/* global module */
/** Les specs vivent dans `test/`, hors de `src/`, pour que le paquet publié
 *  (tsconfig `include: src/**`) ne les embarque pas et que la configuration
 *  eslint typée de `src/` n'ait pas à les connaître. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testRegex: '.*[.]spec[.]ts$',
};
