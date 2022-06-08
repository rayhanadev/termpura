import clear from 'clear';
import inquirer from 'inquirer';

import { toListOptions, createMenu, wrappedImport } from './utils.js';

export const loadPage = async (file, pass = {}) => {
	const { default: _app, getProps: getMetaProps } = await wrappedImport(
		'_app',
	);
	const { default: _exit, getProps: getExitProps } = await wrappedImport(
		'_exit',
	);

	if (file.startsWith('_'))
		throw new Error(`Could not load ${file}, termpura special file.`);

	const {
		default: page,
		menu: pageMenu,
		getProps,
	} = await wrappedImport(file);

	clear();
	const metaProps = await getMetaProps(pass);
	await _app(file, { ...metaProps });

	const pageProps = await getProps(pass);
	const menu = pageMenu instanceof Function ? pageMenu() : pageMenu;

	const { a: selection } = await inquirer.prompt(
		createMenu(await toListOptions(menu), pageProps.menuMessage),
	);

	if (selection === 'return' && file === 'index') {
		const exitProps = await getExitProps(pass);
		clear();
		await _exit(exitProps);
		process.exit(0);
	}

	if (selection === 'return') {
		await loadPage('index');
	}

	const res = await page(selection, {
		...pageProps,
	});

	if (res.to) await loadPage(res.to, res.pass);
	else await loadPage(file, res.pass);
};
