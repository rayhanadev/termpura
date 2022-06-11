import path from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { platform } from 'node:process';
import fg from 'fast-glob';

import chalk from 'chalk';
import inquirer from 'inquirer';

export const lookupFile = async (file: string): Promise<string> => {
	if (existsSync(file)) {
		const lookup = statSync(file);
		if (lookup.isDirectory()) {
			try {
				const dirMain = statSync(file + '/index.js');
				if (dirMain.isFile()) return file + '/index.js';
			} catch {
				throw new Error(
					'that page is a folder that does not have an index.js file.',
				);
			}
		}
	}

	if (existsSync(file + '.js')) {
		const lookup = statSync(file + '.js');
		if (lookup.isFile()) return file + '.js';
	}

	const glob = `\\[*\\].js`;
	const slugPaths = await fg(glob, { cwd: path.dirname(file) });
	if (slugPaths.length > 1)
		throw new Error('multiple files with slugs found.');
	if (slugPaths.length === 1) {
		const lookup = statSync(`${path.dirname(file)}/${slugPaths[0]}`);
		if (lookup.isFile()) return `${path.dirname(file)}/${slugPaths[0]}`;
	}

	return `${path.dirname(file)}/404.js`;
};

export const toPagesPath = (file: string): string =>
	platform === 'win32'
		? 'file:\\\\\\' + path.resolve(path.join('pages', file))
		: path.resolve(path.join('pages', file));

interface RawMenu {
	[key: string]: string;
}

interface ListItem {
	name: string;
	value: string;
}

export const toListOptions = async (menu: RawMenu): Promise<ListItem[]> => {
	return new Promise((resolve) => {
		const keys = Object.keys(menu);
		const values = Object.values(menu);

		const listOptions = [];
		for (const i in keys)
			listOptions[i] = { name: chalk.white(keys[i]), value: values[i] };

		resolve(listOptions);
	});
};

const sep = new inquirer.Separator();
type Separator = typeof sep;

interface Menu {
	type: string;
	name: string;
	message: string;
	choices: (ListItem | Separator)[];
	default: string;
	prefix: string;
}

export const createMenu = (menu: ListItem[], message = ''): Menu[] => {
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

interface MainExport {
	to?: string;
	pass?: {
		menu?: {
			message?: string;
		};
		[key: string]: any;
	};
}

interface Props {
	[key: string]: any;
}

type DefaultFunction = (
	props: Props,
	selection?: string,
) => MainExport | Promise<MainExport>;
type GetPropsFunction = (pass: {
	[key: string]: string;
}) => Props | Promise<Props>;

interface Page {
	default: DefaultFunction;
	menu?: RawMenu[];
	getProps: GetPropsFunction;
}

export const wrappedImport = async (file: string): Promise<Page> => {
	try {
		const fileName = await lookupFile(toPagesPath(file));
		const page: Page = await import(fileName);

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
		throw new Error(`Could not load ${file}, ` + error.message);
	}
};
