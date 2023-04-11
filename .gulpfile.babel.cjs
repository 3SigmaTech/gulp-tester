import fs from "fs";
import typescript from "typescript";
import tsnode from "ts-node";

let opts = JSON.parse(fs.readFileSync("./tsconfig.json").toString());
eval(typescript.transpile(fs.readFileSync("./gulpfile.ts").toString(), opts));