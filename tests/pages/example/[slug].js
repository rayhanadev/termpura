export const menu = () => ({
	// Add Menu Items Here
});

export const getProps = (pass) => {
	return {
		...pass,
		menu: { message: `example/[slug].js - slug: ${pass.slug}` },
	};
};

export default function home(props, selection) {
	try {
		switch (selection) {
			case '': {
				// Add Handlers Here
				// Add Routing Here
			}
		}

		return { to: '404' };
	} catch (error) {
		return { to: '500', pass: { error } };
	}
}
