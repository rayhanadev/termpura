export const getProps = () => ({});
export default function _app(page, props) {
	if (page === '404') return console.log('404');
	if (page === '500') return console.log('500');
	return console.log('termpura-core-test');
}
