
import * as request from "request";
import {Readable, Writable} from "stream";
import {exec} from "child_process";
import {RequestResponse} from "request";
import * as http from "http";
import * as https from "https";
import * as UrlParser from "url";
const BablicApiBase = "https://www.bablic.com/api/v2/";
const BablicApiBaseParsed = UrlParser.parse(BablicApiBase);

export function jsonPost<TReq, TRes>(url: string, body: TReq, options?: any): Promise<TRes> {
    return new Promise<TRes>((resolve, reject) => {
        request.post({
            url: BablicApiBase + url,
            json: body,
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
export function execShellCommand(cmd: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout ? stdout : stderr);
            }
        });
    });
}