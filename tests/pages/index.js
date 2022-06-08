export const menu = () => ({
	// Add Menu Items Here
});

export const getProps = (pass) => {
	return { ...pass };
};

export default function home(selection) {
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
