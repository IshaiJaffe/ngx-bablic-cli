import {execShellCommand, jsonPost, postStream, saveToken, waitForLogin, waitForSigterm,
    createEditorFile, createTranslationFile, uploadSiteAndOpenEditor} from "bablic-i18n";
import {createReadStream, createWriteStream} from "fs";
import * as os from "os";
import {BaseOptions} from "bablic-i18n";
export interface EditorOptions extends BaseOptions {
    site: string;
    outFile: string;
    sourceFile: string;
    skipXi18n: boolean;
}

export async function createEditor(params: EditorOptions): Promise<void> {
    if (!params.skipXi18n) {
        console.error("Updating source localization file");
        await execShellCommand("ng", ["xi18n", "--out-file", params.sourceFile]);
    } else {
        console.error("skipping update source localization file");
    }
    console.error("Getting translated localization file");
    const fileReader = createReadStream(params.sourceFile);
    const fileWriter = createWriteStream(params.outFile);
    await createEditorFile(fileReader, fileWriter, params.site, "angular");
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
    await createTranslationFile(fileReader, fileWriter, params.site, params.locale, "angular");
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
    await createEditorFile(fileReader, fileWriter, params.site, "angular");
    console.error("Generated editor file successfully");
    const tempDir = os.tmpdir() + `/${params.site}.editor/`;
    let command: string[] = [`build`];
    if (params.prod) {
        command.push(" --prod");
    }
    command.push("--aot", "true", "--i18nFile", tempFile,  "--i18nFormat", "xlf", "--i18nLocale", "editor", "--outputPath", tempDir);
    await execShellCommand("ng", command);
    await uploadSiteAndOpenEditor(tempDir, params.site, "angular");
}

