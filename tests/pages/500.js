export const menu = () => ({});

export const getProps = (pass) => {
	return { ...pass, menu: { message: '500.js' } };
};

export default function error() {
	return { to: 'index' };
}
