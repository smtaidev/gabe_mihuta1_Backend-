export const cents = (amount?: number | null) =>
	amount != null ? amount / 100 : null;
