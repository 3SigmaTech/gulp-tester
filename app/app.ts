import type {Request, Response, NextFunction} from 'express';
import express from 'express';
//import session from 'express-session';
// TODO: INVESTIGATE cookieSession
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// @ts-ignore
import reload from 'reload';

// TODO: Add version numbering to deployment step
const pjson = {
    version: "0.0.1"
}

const PORT = process.env['PORT'] || 4987;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

var viewFolders = [
    path.join(__dirname, '/../views'),
];

let distDir = 'dist';
if (process.env['NODE_ENV'] === 'development') {
    distDir = 'build';
}

app
    .use(express.json())
    // Rewrite the URL before it gets to Express' static middleware.
    .use(`/${distDir}/`, (req:Request, _res:Response, next:NextFunction) => {
        req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg)$/, "/$1.$2");
        next();
    })
    .use(`/${distDir}/`, express.static(path.join(__dirname, distDir), { maxAge: 30 }))
    .set('views', viewFolders)
    .set('view engine', 'ejs')
    .get('/', (_req:Request, res:Response) => res.render('pages/index'))
    .use((req:Request, res:Response, next:NextFunction) => {
        let requestedView = path.parse(req.path);
        requestedView.dir = requestedView.dir.replace(/v\d/i, '');

        // Loads all files in views folder so they can be accessed via url path
        for (let viewFolder of viewFolders) {
            let filePath = path.join(viewFolder, requestedView.dir, requestedView.name) + '.ejs';
            if (fs.existsSync(filePath)) {
                let viewPath;
                if (requestedView.dir === '/') { //view is in the root of the views directory
                    viewPath = requestedView.name;
                } else { //need to include the subfolder(s) in the path to the requested view
                    //using slice() to remove the leading '/' from the directory path
                    viewPath = `${requestedView.dir.slice(1)}/${requestedView.name}`;
                }
                //should now have the correct path to the view, go ahead and render() it
                res.render(viewPath);
                return;
            }
        }
        next();
    })
    // make server app handle any error
    .use((err:any, _req:Request, res:Response, _next:NextFunction) => {
        res.status(err.statusCode || 500).json({
            status: 'error',
            statusCode: err.statusCode,
            message: err.message
        });
    })
    //.use((req, res, next) => {
    //    res.render('404');
    //})
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

// Add shortcuts for public folder subdirectories
const publicdirs = fs.readdirSync(`./${distDir}/`, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
for (const subdir of publicdirs) {
    app.use(`/${subdir}/`, function (req:Request, _res:Response, next:NextFunction) {
            req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg|json|html)$/, "/$1.$2");
            next();
        })
        .use(`/${subdir}/`, express['static'](__dirname + `/../${distDir}/${subdir}/`, { maxAge: 30, setHeaders:setJSXMime }));
}

function setJSXMime(res:Response, path:string, _stat:any):void {
    if (path.includes('jsx')) {
        res.contentType('text/javascript');
    }
}

// Set up a cache buster based on application version
app.locals['cacheindex'] = pjson.version.replace(/\./g, "");

reload(app);
