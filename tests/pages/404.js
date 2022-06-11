export const menu = () => ({});

export const getProps = (pass) => {
	return { ...pass, menu: { message: '404.js' } };
};

export default function notfound() {
	return { to: 'index' };
}
