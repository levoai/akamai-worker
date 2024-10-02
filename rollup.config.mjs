import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy-assets';

export default {
    input: 'src/main.ts',
    output: {
        dir: 'dist',
        format: 'es',
        sourcemap: false,
    },
    plugins: [
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            declaration: false,
            sourceMap: false,
        }),
        json(),
        resolve(),
        copy({
            assets: ['./bundle.json'],
        }),
        terser(),
    ],
    external: [
        'create-response',
        'url-search-params',
        'http-request',
        'cookies',
        'text-encode-transform',
        'streams',
        'log',
    ],
};