import {execShellCommand, jsonPost, postStream, saveToken, waitForSigterm} from "./common";
import {createReadStream, createWriteStream} from "fs";
import * as os from "os";
import * as open from "open";
import * as QueryStringParser from "querystring";

import * as tar from 'tar';
import {createServer} from "http";

export interface EditorOptions extends BaseOptions {
    site: string;
    outFile: string;
    sourceFile: string;
    skipXi18n: boolean;
}

export async function createEditor(params: EditorOptions): Promise<void> {
    if (params.skipXi18n) {
        console.error("Updating source localization file");
        await execShellCommand("ng", ["xi18n", "--out-file", params.sourceFile]);
    } else {
        console.error("skipping update source localization file");
    }
    console.error("Getting translated localization file");
    const fileReader = createReadStream(params.sourceFile);
    const fileWriter = createWriteStream(params.outFile);
    const stream = await postStream(`site/${encodeURIComponent(params.site)}/i18n/angular/editor`, fileReader);
    stream.pipe(fileWriter);
    const promise = new Promise<void>((resolve, reject) => {
        fileWriter.on("close", () => {
            resolve();
        });
    });
    await promise;
    console.error("File written successfully");
}

export interface LocaleOptions extends BaseOptions {
    site: string;
    locale: string;
    outFile: string;
    sourceFile: string;
    skipXi18n: boolean;
}

export async function createLocale(params: LocaleOptions): Promise<void> {
    if (!params.skipXi18n) {
        console.error("Updating source localization file");
        await execShellCommand("ng", ["xi18n", "--out-file", params.sourceFile]);
    } else {
        console.error("Skip updating localization file");
    }
    console.error("Getting translated localization file");
    const fileReader = createReadStream(params.sourceFile);
    const fileWriter = createWriteStream(params.outFile);
    const stream = await postStream(`site/${encodeURIComponent(params.site)}/i18n/angular/locale/${params.locale}`, fileReader);
    stream.pipe(fileWriter);
    const promise = new Promise<void>((resolve, reject) => {
        fileWriter.on("close", () => {
            resolve();
        });
    });
    await promise;
    console.error("File written successfully");
}

export interface OpenEditorOptions extends BaseOptions {
    site: string;
    sourceFile: string;
    prod?: boolean;
    skipXi18n?: boolean;
}

export async function openEditor(params: OpenEditorOptions): Promise<void> {
    if (!params.skipXi18n) {
        console.error("Updating source localization file");
        await execShellCommand("ng", ["xi18n", "--out-file", params.sourceFile]);
    } else {
        console.error("Skip updating source localization file");
    }
    console.error("Getting translated localization file");
    const fileReader = createReadStream(params.sourceFile);
    const tempFile = os.tmpdir() + `/${params.site}.editor.xlf`;
    const fileWriter = createWriteStream(tempFile);
    const stream = await postStream(`site/${encodeURIComponent(params.site)}/i18n/angular/editor`, fileReader);
    stream.pipe(fileWriter);
    const promise = new Promise<void>((resolve, reject) => {
        fileWriter.on("close", () => {
            resolve();
        });
    });
    await promise;
    console.error("Generated editor file successfully");
    const tempDir = os.tmpdir() + `/${params.site}.editor/`;
    let command: string[] = [`build`];
    if (params.prod) {
        command.push(" --prod");
    }
    command.push("--aot", "true", "--i18nFile", tempFile,  "--i18nFormat", "xlf", "--i18nLocale", "editor", "--outputPath", tempDir);
    await execShellCommand("ng", command);
    const tempTar = os.tmpdir() + `/${params.site}.editor.tar.gs`;
    const tempTarWriter = createWriteStream(tempTar);
    tar.c({
        gzip: true,
    }, [tempDir]).pipe(tempTarWriter);
    await new Promise<void>((resolve, reject) => {
        tempTarWriter.on("close", () => resolve());
    });

    const tarReader = createReadStream(tempTar);
    const bundleResponse = await postStream(`site/${params.site}/i18n/angular/bundle`, tarReader);
    let url: string;
    const readPromise = new Promise<void>((resolve, reject) => {
        const chunks: string[] = [];
        bundleResponse.on("readable", () => {
            chunks.push(bundleResponse.read().toString());
        });
        bundleResponse.on("end", () => {
            const str = chunks.join("");
            const obj = JSON.parse(str);
            url = obj.url;
            console.error("Open browser in URL:", obj.url);
            resolve();
        });
    });
    await readPromise;
    const logInPromise = new Promise<void>((resolve, reject) => {
        const server = createServer((req, res) => {
            const qs = req.url.split("?")[1];
            if (!qs) {
                return res.end();
            }
            const parsed = QueryStringParser.parse(qs);
            const token = parsed.token;
            if (!token) {
                return res.end();
            }
            server.close();
            saveToken(token as string).then(() => {
                resolve();
            }, reject);
        });
        server.listen(12513);
    });
    await open(url);
    await Promise.race([logInPromise, waitForSigterm()]);
}

