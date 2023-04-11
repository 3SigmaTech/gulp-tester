'use strict';

import gulp from 'gulp';
import nodemon from 'nodemon';
import fs from 'fs';
import util from 'util';
import replace from 'gulp-replace';
import merge from 'merge-stream';
// @ts-ignore
import git from 'gulp-git';
const gittag = util.promisify(git.tag);
const gitstatus = util.promisify(git.status);
const gitpush = util.promisify(git.push);

import bs from 'browser-sync';
var browserSync = bs.create();

// CSS builder
import gulpSass from 'gulp-sass';
import nodeSass from 'node-sass';
const sass = gulpSass(nodeSass);
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
//import purify from 'gulp-purifycss';

// Javascript builder
import * as rollupConfig from './rollup.config';
import ts from 'gulp-typescript';
import * as rollup from 'rollup';


import {FRONT_BUILD, FRONT_DIST, BACK_SRC, paths} from './buildconfig';

export function js() {
    if (!fs.existsSync(FRONT_BUILD + paths.js.dest)) {
        fs.mkdirSync(FRONT_BUILD + paths.js.dest, { recursive: true });
    }
    if (!fs.existsSync(FRONT_DIST + paths.js.dest)) {
        fs.mkdirSync(FRONT_DIST + paths.js.dest, { recursive: true });
    }

    let input = rollupConfig.devInput;
    let bOutput = rollupConfig.devOutput;
    let dOutput = rollupConfig.prodOutput;

    return rollup.rollup(input).then(bundle => {
        return Promise.all([bundle.write(bOutput), bundle.write(dOutput)]);
    });

}

export function jsmap() {
    if (fs.existsSync(paths.js.map)) {
        console.log('boop');
    let dev = gulp.src(paths.js.map)
        .pipe(replace(/,?[\s]*"productionimports": \{[^\}]*\},?/g, ''))
        .pipe(replace(/"localimports"/g, '"imports"'))
        .pipe(gulp.dest(FRONT_BUILD + paths.js.dest));
    let prod = gulp.src(paths.js.map)
        .pipe(replace(/,?[\s]*"localimports": \{[^\}]*\},?/g, ''))
        .pipe(replace(/"productionimports"/g, '"imports"'))
        .pipe(gulp.dest(FRONT_DIST + paths.js.dest));

    return merge(dev, prod);
    }
    return new Promise<void>((resolve, _reject)=>{resolve()});
}

export function scss() {
    return gulp.src(paths.scss.src)
        .pipe(sass({
            includePaths: ['node_modules']
        }).on('error', sass.logError))
        .pipe(postcss([autoprefixer()]))
        //.pipe(purify(['./public/js/**/*.js', './public/**/*.html', './views/**/*.ejs', './views/**/*.html']))
        .pipe(gulp.dest(FRONT_BUILD + paths.scss.dest))
        .pipe(sass({
            outputStyle: 'compressed',
            includePaths: ['node_modules']
        }))
        .pipe(gulp.dest(FRONT_DIST + paths.scss.dest));
}

export function css() {
    return gulp.src(paths.css.src)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(FRONT_BUILD + paths.css.dest))
        .pipe(sass({ outputStyle: 'compressed' }))
        .pipe(gulp.dest(FRONT_DIST + paths.css.dest));
}

export function img() {
    return gulp.src(paths.img.src)
        .pipe(gulp.dest(FRONT_BUILD + paths.img.dest))
        .pipe(gulp.dest(FRONT_DIST + paths.img.dest));
}

export function fonts() {
    return gulp.src(paths.fonts.src)
        .pipe(gulp.dest(FRONT_BUILD + paths.fonts.dest))
        .pipe(gulp.dest(FRONT_DIST + paths.fonts.dest));
}

export function data() {
    return gulp.src(paths.data.src)
        .pipe(gulp.dest(FRONT_BUILD + paths.data.dest))
        .pipe(gulp.dest(FRONT_DIST + paths.data.dest));
}

function browsersyncReload() {
    browserSync.reload();
}

function watch() {
    browserSync.init({
        open:false,
        proxy: "http://localhost:4987", // what nodemon starts
        port: 3000 // what you access in the browser
    });

    //gulp.watch(paths.js.src2, js);
    gulp.watch(paths.js.src2, 
        gulp.series(js, browsersyncReload)
    );

    gulp.watch(paths.js.map,
        gulp.series(jsmap, browsersyncReload)
    );

    gulp.watch(paths.ejs.src,
        gulp.series(browsersyncReload)
    );
    gulp.watch(paths.scss.src2,
        gulp.series(scss, browsersyncReload)
    );
    gulp.watch(paths.css.src,
        gulp.series(css, browsersyncReload)
    );
    gulp.watch(paths.img.src,
        gulp.series(img, browsersyncReload)
    );
    gulp.watch(paths.fonts.src,
        gulp.series(fonts, browsersyncReload)
    );
    gulp.watch(paths.data.src,
        gulp.series(data, browsersyncReload)
    );
    // gulp.watch('gulpfile.babel.js',
    //     // Doesn't notice file change
    //     gulp.series(clean, frontbuild, browsersyncReload)
    // );
}

export function devserver() {
    return nodemon({
        exec: `npx ts-node-esm --files --project ./${paths.app}/tsconfig.json ${paths.app}/${paths.serverscript}.ts`,
        ext: 'html,js,ejs,css,jsx,ts,tsx',
        watch: [BACK_SRC],
        env: {
            NODE_ENV: "development",
        },
        execMap: {
            ts: "ts-node"
        }
    })
    .on('restart', function () {
        console.log('restarted');
    });
};

export function serverbuild() {
    process.chdir(BACK_SRC); // so directories in tsconfig make sense
    let tsProject = ts.createProject(`./tsconfig.json`);
    return tsProject.src()
        .pipe(tsProject()).js
        .pipe(gulp.dest(tsProject.config.compilerOptions.outDir));
}

export function incrementVersion() {

    // Read latest tag
    let tags = fs.readdirSync('./.git/refs/tags');
    tags.sort(function (a: string, b: string) {
        let aArr = a.replace('v', '').split('.');
        let bArr = b.replace('v', '').split('.');
        if (!aArr || !bArr) {
            return 0;
        }
        let aArrI = [];
        aArrI[0] = parseInt(aArr[0] ?? '0');
        aArrI[1] = parseInt(aArr[1] ?? '0');
        aArrI[2] = parseInt(aArr[2] ?? '0');
        let bArrI = [];
        bArrI[0] = parseInt(bArr[0] ?? '0');
        bArrI[1] = parseInt(bArr[1] ?? '0');
        bArrI[2] = parseInt(bArr[2] ?? '0');
        if (aArrI[0] > bArrI[0] || aArrI[1] > bArrI[1] || aArrI[2] > bArrI[2]) {
            return -1;
        }
        return 1;
    });  
    let appFile = fs.readFileSync('./app/app.ts', 'utf8');
    let pkgFile = fs.readFileSync('./package.json', 'utf8'); 

    let vRegex = /"?version"?:\s*"(.*?)"/g;
    let appV = appFile.matchAll(vRegex);
    let pkgV = pkgFile.matchAll(vRegex);

    let appVersion, pkgVersion;
    for (const match of appV) {
        appVersion = match[1]?.split('.');
        break;
    }
    for (const match of pkgV) {
        pkgVersion = match[1]?.split('.');
    }
    let tagVersion = tags[0]?.replace('v', '').split('.');
    
    if (!appVersion) { return; }

    let latest = appVersion;
    for (let i = 0; i < appVersion.length; i++) {
        if (parseInt(appVersion?.[i] ?? '0') > parseInt(pkgVersion?.[i] ?? '0')) {
            break;
        } else if (parseInt(appVersion?.[i] ?? '0') < parseInt(pkgVersion?.[i] ?? '0')) {
            latest = pkgVersion as string[];
            break;
        }
    }

    let usetag = 0;
    for (let i = 0; i < latest.length; i++) {

        if (parseInt(latest?.[i] ?? '0') > parseInt(tagVersion?.[i] ?? '0')) {
            break;
        } else if (parseInt(latest?.[i] ?? '0') <= parseInt(tagVersion?.[i] ?? '0')) {
            usetag++;
        }
    }
    if (usetag == latest.length) {
        latest = tagVersion as string[];
    }


    // Currently listed versions match the latest release
    // Read: version has not been incremented
    let skipApp, skipPkg;
    if (latest == tagVersion) {
        latest[2] = (parseInt(latest[2] ?? '0') + 1).toString();
    } else {
        if (latest == appVersion) {
            skipApp = true;
        } else if (latest == pkgVersion) {
            skipPkg = true;
        }

        console.log('Version already incremented');
        return gulp.src(".");
    }
    
    let latestStr = latest.join('.');

    let app, pkg;
    if (!skipApp) {
        console.log('Incrementing version in app.ts');
        app = gulp.src('./app/app.ts')
            .pipe(replace(vRegex, `version: "${latestStr}"`))
            .pipe(gulp.dest('./app/'));
    }
    if (!skipPkg) {
        console.log('Incrementing version in package.json');
        pkg = gulp.src('./package.json')
            .pipe(replace(vRegex, `"version": "${latestStr}"`))
            .pipe(gulp.dest('./'));
    }
    if (app && pkg) {
        return merge(app, pkg);
    } else if (app) {
        return app;
    } else {
        return pkg
    }
};

export function addTag() {
    let pkgFile = fs.readFileSync('./package.json');
    let version = JSON.parse(pkgFile.toString())['version'];
    
    return gitstatus({ args: '--porcelain' }).then((changes:any) => {
        if (changes != ' M app/app.ts\n M package.json\n') {
            throw new Error(
                'Task addTag can only be run on a clean repository. '
                + 'Run "git status --porcelain" to see what blocked the task.'
            );
        }
        return new Promise(function (resolve, _reject) {
            gulp.src(['./app/app.ts', './package.json'])
                .pipe(git.add())
                .pipe(git.commit('Update version'))
                .on('end', resolve);
        });
    }).then(() => {
        return gittag('v' + version, "New version");
    }).then(() => {
        return gitpush('origin', 'main');
    }).then(() => {
        return gitpush('origin', 'main', { args: " --tags" });
    }).catch((err:any) => {
        if (err) {
            console.log(err);
            throw err;
        }
    });
}

export function clean() {
    //process.chdir('./');
    return new Promise<void>((resolve, _reject) => {
        if (fs.existsSync(paths.dist)) {
            fs.rmSync(paths.dist, { recursive: true });
        }
        if (fs.existsSync(paths.build)) {
            fs.rmSync(paths.build, { recursive: true });
        }
        if (fs.existsSync(paths.server)) {
            fs.rmSync(paths.server, { recursive: true });
        }
        resolve();
    });
}

export const frontbuild = gulp.parallel(js, jsmap, scss, css, img, fonts, data);
export const build = gulp.series(frontbuild, serverbuild);

// @ts-ignore
export const dev = gulp.series(clean, frontbuild, gulp.parallel(watch, devserver));
export const release = gulp.series(clean, incrementVersion, addTag, build);
export const bump = gulp.series(incrementVersion, addTag);
export const def = gulp.series(clean, build);
export default def;