
import type { Plugin, RollupOptions, RollupWarning, OutputOptions } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import rollupReplace from '@rollup/plugin-replace'; 

import { FRONT_BUILD, FRONT_DIST, paths } from './buildconfig';

// https://github.com/d3/d3-interpolate/issues/58
const D3_WARNING = /Circular dependency.*d3-interpolate/;

export const devInput:RollupOptions = {
    input: paths.js.src,
    plugins: [
        rollupReplace({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        resolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
        typescript({
            tsconfig: `./${paths.src}/tsconfig.json`,
            // declaration: true,
            // declarationDir: 'dist',
        }),
        commonjs({
            include: /node_modules/
        }),
        babel({
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            presets: ["@babel/env", "@babel/preset-react"],
            babelHelpers: 'bundled',
            exclude: 'node_modules/**'
        }),
    ],
    onwarn: function (warning: RollupWarning) {
        if (D3_WARNING.test(warning.message)) {
            return
        }
    },
    external: [
        'react', 'react-dom',
        'd3', 'topojson-client', 'bootstrap',
        //'react-dnd', 'react-modal'
        // "@fullcalendar/core",
        // "@fullcalendar/react",
        // "@fullcalendar/daygrid",
        // "@fullcalendar/timegrid",
        // "@fullcalendar/interaction",
        // "@fullcalendar/multimonth"

        // /node_modules/
    ]
};

export const devOutput:OutputOptions = {
    file: FRONT_BUILD + paths.js.dest + paths.js.flnm,
    //dir: FRONT_BUILD + paths.js.dest,
    format: 'umd',
    //format: 'esm', // needed if I want code splitting
    //preserveModules: true,
    //preserveModulesRoot: 'public',
    plugins: [] as Plugin[],
    name: 'main',
    globals: {
        "react": 'React',
        "react-dom": 'ReactDOM',
        "d3": 'd3',
        "topojson-client": 'topojson',
        "bootstrap": 'bootstrap',
        // "react-dnd": "react-dnd",
        // "ReactModal": "react-modal",
    },
    // manualChunks: (id) => {
    //     if (id.includes("node_modules")) {
    //         if (id.includes("@fullcalendar")) {
    //             return "vendor_fullcalendar";
    //         } else if (id.includes("react") || id.includes("dnd-")) {
    //             return "vendor_react";
    //         } else if (id.includes("d3") || id.includes("topojson")) {
    //             return "vendor_d3";
    //         } else if (id.includes("bootstrap")) {
    //             return "vendor_bootstrap";
    //         } else if (id.includes("popper")) {
    //             return "vendor_popper";
    //         }
    //         return "vendor"; // all other package goes here
    //     }
    // },
};

export const prodInput:RollupOptions = {...devInput};

export const prodOutput:OutputOptions = {...devOutput};
prodOutput.file = FRONT_DIST + paths.js.dest + paths.js.flnm;
//prodOutput.dir = FRONT_DIST + paths.js.dest;
prodOutput.plugins = [terser()];



export const vendorInput:RollupOptions = { ...devInput };

export const vendorOutput:OutputOptions = { ...devOutput };
vendorOutput.file = FRONT_DIST + paths.js.dest + paths.js.flnm;
//prodOutput.dir = FRONT_DIST + paths.js.dest;
vendorOutput.plugins = [terser()];
