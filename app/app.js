"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const url_1 = require("url");
const reload_1 = __importDefault(require("reload"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const generics = __importStar(require("./models/generics.js"));
const pjson = {
    version: "0.4.10"
};
const PORT = process.env['PORT'] || 4987;
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
const app = (0, express_1.default)();
let gservice = new generics.Service();
const GoogleServices_js_1 = __importDefault(require("./google/GoogleServices.js"));
(0, GoogleServices_js_1.default)(gservice);
const apiLimiter = (0, express_rate_limit_1.default)({
    max: 30,
    windowMs: 60 * 1000,
    standardHeaders: true,
    legacyHeaders: false,
});
var viewFolders = [
    path_1.default.join(__dirname, '/../views'),
    path_1.default.join(__dirname, '/../views/pages'),
];
let distDir = 'dist';
if (process.env['NODE_ENV'] === 'development') {
    distDir = 'build';
}
app
    .use(express_1.default.json())
    .use((0, cookie_parser_1.default)("StackingBricks10FeetDeep"))
    .use(function (req, _res, next) {
    if (req.url === '/forecast') {
        req.url = '/forecaster';
    }
    if (req.url === '/analyze') {
        req.url = '/analyzer';
    }
    next();
})
    .use('/forecaster', apiLimiter)
    .use('/analyzer', apiLimiter)
    .use(`/${distDir}/`, (req, _res, next) => {
    req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg)$/, "/$1.$2");
    next();
})
    .use(`/${distDir}/`, express_1.default.static(path_1.default.join(__dirname, distDir), { maxAge: 30 }))
    .set('views', viewFolders)
    .set('view engine', 'ejs')
    .get('/', (_req, res) => res.render('pages/index'))
    .use((req, res, next) => {
    let requestedView = path_1.default.parse(req.path);
    requestedView.dir = requestedView.dir.replace(/v\d/i, '');
    for (let viewFolder of viewFolders) {
        let filePath = path_1.default.join(viewFolder, requestedView.dir, requestedView.name) + '.ejs';
        if (fs_1.default.existsSync(filePath)) {
            let viewPath;
            if (requestedView.dir === '/') {
                viewPath = requestedView.name;
            }
            else {
                viewPath = `${requestedView.dir.slice(1)}/${requestedView.name}`;
            }
            res.render(viewPath);
            return;
        }
    }
    next();
})
    .use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({
        status: 'error',
        statusCode: err.statusCode,
        message: err.message
    });
})
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
const publicdirs = fs_1.default.readdirSync(`./${distDir}/`, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
for (const subdir of publicdirs) {
    app.use(`/${subdir}/`, function (req, _res, next) {
        req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg|json|html)$/, "/$1.$2");
        next();
    })
        .use(`/${subdir}/`, express_1.default['static'](__dirname + `/../${distDir}/${subdir}/`, { maxAge: 30, setHeaders: setJSXMime }));
}
function setJSXMime(res, path, _stat) {
    if (path.includes('jsx')) {
        res.contentType('text/javascript');
    }
}
app.locals['cacheindex'] = pjson.version.replace(/\./g, "");
const AnalyzerRoutes_js_1 = __importDefault(require("./analyzer/AnalyzerRoutes.js"));
(0, AnalyzerRoutes_js_1.default)(app);
const ForecasterRoutes_js_1 = __importDefault(require("./forecaster/ForecasterRoutes.js"));
(0, ForecasterRoutes_js_1.default)(app);
const UserRoutes_js_1 = __importDefault(require("./user/UserRoutes.js"));
(0, UserRoutes_js_1.default)(app);
const DashboardRoutes_js_1 = __importDefault(require("./dashboard/DashboardRoutes.js"));
(0, DashboardRoutes_js_1.default)(app);
if (process.env['NODE_ENV'] === 'development') {
    setTimeout(function () {
        if (gservice.complete) {
            (0, reload_1.default)(app);
        }
    }, 500);
}
