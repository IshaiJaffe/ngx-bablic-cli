import {execShellCommand, jsonPost, postStream} from "./common";
import {createReadStream, createWriteStream} from "fs";
import * as os from "os";

import * as tar from 'tar';

export interface EditorOptions extends BaseOptions {
    site: string;
    outFile: string;
    sourceFile: string;
}

export async function createEditor(params: EditorOptions): Promise<void> {
    console.error("Updating source localization file");
    await execShellCommand("ng xi18n --out-file " + params.sourceFile);
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
}

export async function createLocale(params: LocaleOptions): Promise<void> {
    console.error("Updating source localization file");
    await execShellCommand("ng xi18n --out-file " + params.sourceFile);
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
}

export async function openEditor(params: OpenEditorOptions): Promise<void> {
    console.error("Updating source localization file");
    await execShellCommand("ng xi18n --out-file " + params.sourceFile);
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
    let command = `ng build`;
    if (params.prod) {
        command += " --prod";
    }
    command += ` --aot true --i18nFile ${tempFile} --i18nFormat xlf --i18nLocale editor --outputPath ${tempDir}`;
    await execShellCommand(command);
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
    const readPromise = new Promise<void>((resolve, reject) => {
        const chunks: string[] = [];
        bundleResponse.on("readable", () => {
            chunks.push(bundleResponse.read().toString());
        });
        bundleResponse.on("end", () => {
            const str = chunks.join("");
            const obj = JSON.parse(str);
            console.error("Open browsre in URL:", obj.url);
            resolve();
        });
    });
    await readPromise;
}