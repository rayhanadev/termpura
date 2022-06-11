import clear from 'clear';
import inquirer from 'inquirer';

import { toListOptions, createMenu, wrappedImport } from './utils';

export const loadPage = async (file: string, pass = {}): Promise<void> => {
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
		slug,
	} = await wrappedImport(file);

	clear();
	const metaProps = await getMetaProps(pass);
	const redirect = await _app({ ...metaProps }, file);

	if (redirect && redirect.to)
		return await loadPage(redirect.to, redirect.pass);

	const pageProps = await getProps({ ...pass, slug });
	const menu = pageMenu instanceof Function ? await pageMenu() : pageMenu;

	const { a: selection } = await inquirer.prompt(
		createMenu(
			await toListOptions(menu),
			pageProps.menu ? pageProps.menu.message : '',
		),
	);

	if (selection === 'return' && file === 'index') {
		const exitProps = await getExitProps(pass);
		clear();
		await _exit(exitProps);
		process.exit(0);
	}

	if (selection === 'return') {
		return await loadPage('index');
	}

	const res = await page(
		{
			...pageProps,
		},
		selection,
	);

	if (res.to) return await loadPage(res.to, res.pass);
	return await loadPage(file, res.pass);
};
