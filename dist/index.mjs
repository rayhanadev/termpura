import clear from 'clear';
import inquirer from 'inquirer';
import path from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { platform } from 'node:process';
import fg from 'fast-glob';
import chalk from 'chalk';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const lookupFile = (file) => __awaiter(void 0, void 0, void 0, function* () {
    if (existsSync(file)) {
        const lookup = statSync(file);
        if (lookup.isDirectory()) {
            try {
                const dirMain = statSync(file + '/index.js');
                if (dirMain.isFile())
                    return file + '/index.js';
            }
            catch (_a) {
                throw new Error('that page is a folder that does not have an index.js file.');
            }
        }
    }
    if (existsSync(file + '.js')) {
        const lookup = statSync(file + '.js');
        if (lookup.isFile())
            return file + '.js';
    }
    const glob = `\\[*\\].js`;
    const slugPaths = yield fg(glob, { cwd: path.dirname(file) });
    if (slugPaths.length > 1)
        throw new Error('multiple files with slugs found.');
    if (slugPaths.length === 1) {
        const lookup = statSync(`${path.dirname(file)}/${slugPaths[0]}`);
        if (lookup.isFile())
            return `${path.dirname(file)}/${slugPaths[0]}`;
    }
    return `${path.dirname(file)}/404.js`;
});
const toPagesPath = (file) => platform === 'win32'
    ? 'file:\\\\\\' + path.resolve(path.join('pages', file))
    : path.resolve(path.join('pages', file));
const toListOptions = (menu) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const keys = Object.keys(menu);
        const values = Object.values(menu);
        const listOptions = [];
        for (const i in keys)
            listOptions[i] = { name: chalk.white(keys[i]), value: values[i] };
        resolve(listOptions);
    });
});
new inquirer.Separator();
const createMenu = (menu, message = '') => {
    const questions = [
        {
            type: 'list',
            name: 'a',
            message: '\b\b' + chalk.white(message),
            choices: [
                new inquirer.Separator(),
                ...menu,
                { name: chalk.white('Return'), value: 'return' },
            ],
            default: '',
            prefix: '',
        },
    ];
    return questions;
};
const wrappedImport = (file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileName = yield lookupFile(toPagesPath(file));
        const page = yield import(fileName);
        if (!page.default) {
            throw new Error(`Could not load ${file}, missing default export.`);
        }
        if (!file.startsWith('_') && !page.menu) {
            throw new Error(`Could not load ${file}, missing named export menu.`);
        }
        if (!page.getProps) {
            throw new Error(`Could not load ${file}, missing named export getProps.`);
        }
        return page;
    }
    catch (error) {
        throw new Error(`Could not load ${file}, ` + error.message);
    }
});

const loadPage = (file, pass = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const { default: _app, getProps: getMetaProps } = yield wrappedImport('_app');
    const { default: _exit, getProps: getExitProps } = yield wrappedImport('_exit');
    if (file.startsWith('_'))
        throw new Error(`Could not load ${file}, termpura special file.`);
    const { default: page, menu: pageMenu, getProps, } = yield wrappedImport(file);
    clear();
    const metaProps = yield getMetaProps(pass);
    const redirect = yield _app(Object.assign({}, metaProps), file);
    if (redirect && redirect.to)
        return yield loadPage(redirect.to, redirect.pass);
    const pageProps = yield getProps(pass);
    const menu = pageMenu instanceof Function ? pageMenu() : pageMenu;
    const { a: selection } = yield inquirer.prompt(createMenu(yield toListOptions(menu), pageProps.menu ? pageProps.menu.message : ''));
    if (selection === 'return' && file === 'index') {
        const exitProps = yield getExitProps(pass);
        clear();
        yield _exit(exitProps);
        process.exit(0);
    }
    if (selection === 'return') {
        return yield loadPage('index');
    }
    const res = yield page(Object.assign({}, pageProps), selection);
    if (res.to)
        return yield loadPage(res.to, res.pass);
    return yield loadPage(file, res.pass);
});

export { loadPage };
