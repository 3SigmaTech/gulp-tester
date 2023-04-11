export const FRONT_SRC = 'public';
export const FRONT_DIST = 'dist';
export const FRONT_BUILD = 'build';
export const BACK_SRC = 'app';
export const BACK_DIST = 'server';

export const paths = {
    app: BACK_SRC,
    serverscript: 'app',
    server: BACK_DIST,
    dist: FRONT_DIST,
    build: FRONT_BUILD,
    src: FRONT_SRC,
    ejs: {
        src: './views/**'
    },
    js: {
        src: FRONT_SRC + '/js/index.ts',
        src2: [
            FRONT_SRC + '/js/**/*.js',
            FRONT_SRC + '/js/**/*.ts',
            FRONT_SRC + '/jsx/**/*.jsx',
            FRONT_SRC + '/jsx/**/*.tsx'
        ],
        map: FRONT_SRC + '/js/importmap.json',
        dest: '/js',
        flnm: '/main.js'
    },
    jsx: {
        src: FRONT_SRC + '/jsx/**/*',
        dest: '/jsx'
    },
    scss: {
        src: FRONT_SRC + '/style/styles.scss',
        src2: FRONT_SRC + '/style/**/*.scss',
        dest: '/style'
    },
    css: {
        src: FRONT_SRC + '/style/**/*.css',
        dest: '/style'
    },
    img: {
        src: [FRONT_SRC + '/img/**/*.{svg,png,jpg,gif,ico}', '!' + FRONT_SRC + '/img/Unused*/**/*'],
        dest: '/img'
    },
    fonts: {
        src: FRONT_SRC + '/fonts/**/*',
        dest: '/fonts'
    },
    data: {
        src: FRONT_SRC + '/data/**/*',
        dest: '/data'
    }
}