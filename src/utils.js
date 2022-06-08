import path from 'node:path';
import { accessSync, constants } from 'node:fs';
import { platform } from 'node:process';

import chalk from 'chalk';
import inquirer from 'inquirer';

export const toPagesPath = (file) =>
	platform === 'win32'
		? 'file:\\\\\\' + path.resolve(path.join('pages', file + '.js'))
		: path.resolve(path.join('pages', file + '.js'));

export const toListOptions = async (menu) => {
	return new Promise((resolve) => {
		const keys = Object.keys(menu);
		const values = Object.values(menu);

		const listOptions = [];
		for (const i in keys)
			listOptions[i] = { name: chalk.white(keys[i]), value: values[i] };

		resolve(listOptions);
	});
};

export const createMenu = (menu, message = '') => {
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

export const wrappedImport = async (file) => {
	try {
		accessSync(toPagesPath(file), constants.F_OK);
		const page = await import(toPagesPath(file));

		if (!page.default) {
			throw new Error(`Could not load ${file}, missing default export.`);
		}
		if (!file.startsWith('_') && !page.menu) {
			throw new Error(
				`Could not load ${file}, missing named export menu.`,
			);
		}
		if (!page.getProps) {
			throw new Error(
				`Could not load ${file}, missing named export getProps.`,
			);
		}

		return page;
	} catch (error) {
		const message = error.message;
		if (message.includes('ENOENT')) {
			throw new Error(
				`Could not find that file in the pages/ directory.`,
			);
		}
		throw new Error(error.message);
	}
};
