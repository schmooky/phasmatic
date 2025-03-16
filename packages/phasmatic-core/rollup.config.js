import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    }
  ],
  external: ['mobx', 'reflect-metadata'],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
      useTsconfigDeclarationDir: true
    })
  ]
};