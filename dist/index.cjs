'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const clear = require('clear');
const inquirer = require('inquirer');
const path = require('node:path');
const node_fs = require('node:fs');
const node_process = require('node:process');
const fg = require('fast-glob');
const chalk = require('chalk');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    const n = Object.create(null);
    if (e) {
        for (const k in e) {
            if (k !== 'default') {
                const d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        }
    }
    n["default"] = e;
    return Object.freeze(n);
}

const clear__default = /*#__PURE__*/_interopDefaultLegacy(clear);
const inquirer__default = /*#__PURE__*/_interopDefaultLegacy(inquirer);
const path__default = /*#__PURE__*/_interopDefaultLegacy(path);
const fg__default = /*#__PURE__*/_interopDefaultLegacy(fg);
const chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);

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
    if (node_fs.existsSync(file)) {
        const lookup = node_fs.statSync(file);
        if (lookup.isDirectory()) {
            try {
                const dirMain = node_fs.statSync(file + '/index.js');
                if (dirMain.isFile())
                    return file + '/index.js';
            }
            catch (_a) {
                throw new Error('that page is a folder that does not have an index.js file.');
            }
        }
    }
    if (node_fs.existsSync(file + '.js')) {
        const lookup = node_fs.statSync(file + '.js');
        if (lookup.isFile())
            return file + '.js';
    }
    const glob = `\\[*\\].js`;
    const slugPaths = yield fg__default["default"](glob, { cwd: path__default["default"].dirname(file) });
    if (slugPaths.length > 1)
        throw new Error('multiple files with slugs found.');
    if (slugPaths.length === 1) {
        const lookup = node_fs.statSync(`${path__default["default"].dirname(file)}/${slugPaths[0]}`);
        if (lookup.isFile())
            return `${path__default["default"].dirname(file)}/${slugPaths[0]}`;
    }
    return `${path__default["default"].dirname(file)}/404.js`;
});
const toPagesPath = (file) => node_process.platform === 'win32'
    ? 'file:\\\\\\' + path__default["default"].resolve(path__default["default"].join('pages', file))
    : path__default["default"].resolve(path__default["default"].join('pages', file));
const toListOptions = (menu) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const keys = Object.keys(menu);
        const values = Object.values(menu);
        const listOptions = [];
        for (const i in keys)
            listOptions[i] = { name: chalk__default["default"].white(keys[i]), value: values[i] };
        resolve(listOptions);
    });
});
new inquirer__default["default"].Separator();
const createMenu = (menu, message = '') => {
    const questions = [
        {
            type: 'list',
            name: 'a',
            message: '\b\b' + chalk__default["default"].white(message),
            choices: [
                new inquirer__default["default"].Separator(),
                ...menu,
                { name: chalk__default["default"].white('Return'), value: 'return' },
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
        const page = yield (function (t) { return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require(t)); }); })(fileName);
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
    clear__default["default"]();
    const metaProps = yield getMetaProps(pass);
    const redirect = yield _app(Object.assign({}, metaProps), file);
    if (redirect && redirect.to)
        return yield loadPage(redirect.to, redirect.pass);
    const pageProps = yield getProps(pass);
    const menu = pageMenu instanceof Function ? pageMenu() : pageMenu;
    const { a: selection } = yield inquirer__default["default"].prompt(createMenu(yield toListOptions(menu), pageProps.menu ? pageProps.menu.message : ''));
    if (selection === 'return' && file === 'index') {
        const exitProps = yield getExitProps(pass);
        clear__default["default"]();
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

exports.loadPage = loadPage;
