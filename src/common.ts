
import * as request from "request";
import {Readable, Writable} from "stream";
import {exec, spawn} from "child_process";
import {RequestResponse} from "request";
import * as http from "http";
import * as https from "https";
import * as UrlParser from "url";
import {homedir} from "os";
import {ensureDir, writeFile} from "fs-extra";
import {existsSync, readFileSync} from "fs";
const BablicApiBase = "https://www.bablic.com/api/v2/";
const BablicApiBaseParsed = UrlParser.parse(BablicApiBase);

let token: string;

const parentDir = homedir();
const bablicConf = parentDir + "/.bab";

if (existsSync(bablicConf)) {
    token = readFileSync(bablicConf, {encoding: "utf8"});
}

export function jsonPost<TReq, TRes>(url: string, body: TReq, options?: any): Promise<TRes> {
    return new Promise<TRes>((resolve, reject) => {
        request.post({
            url: BablicApiBase + url,
            json: body,
            headers: token ? {"cookie": "babsession=" + token + ";"} : null,
        }, (err, response) => {
            if (err) {
                return reject(err);
            }
            if (response.statusCode < 200 || response.statusCode >= 300) {
                return reject({code: response.statusCode, body: response.body});
            }
            resolve(response.body as TRes);
        }).on("error", (e) => reject(e));
    });
}

export async function postStream(url: string, stream: Readable): Promise<Readable> {
    return new Promise<Readable>((resolve, reject) => {
        const protocol = BablicApiBaseParsed.protocol === 'https:' ? https : http;
        const req = protocol.request({
            method: "POST",
            host: BablicApiBaseParsed.host,
            path: BablicApiBaseParsed.pathname + url,
            headers: {
                "cookie": token ? "babsession=" + token + ";" : undefined,
                'content-type': 'text/xml',
            }
        });
        req.on("error", (e) => reject(e));
        req.on("response", (response) => {
            response.pause();
            if (response.statusCode < 200 || response.statusCode >= 300) {
                return reject({ code: response.statusCode});
            }
            resolve(response);
        }).on("error", (e) => reject(e));
        stream.pipe(req);
    });
}
export function execShellCommand(cmd: string, args: string[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const child = spawn(cmd, args);
        child.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        child.stderr.on('data', (data) => {
            process.stderr.write(data);
        });

        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error("Command returned error: " + code));
            }
        });
    });
}

export function waitForSigterm(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        process.on("SIGTERM", () => resolve());
    });
}

export async function saveToken(token: string): Promise<void> {
    await writeFile(bablicConf, token, {encoding: "utf8"});
}
