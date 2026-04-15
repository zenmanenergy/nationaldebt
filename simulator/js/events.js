// ─── EVENT HANDLERS ─────────────────────────────────────────────────────────

function updateRevRate(key, val) {
	state.revenue[key].rateMultiplier = val;
	updateValues();
}

function toggleRevType(key) {
	const r = state.revenue[key];
	r.type = r.type === 'flat' ? 'progressive' : 'flat';
	updateAll();
}

function toggleCG() {
	state.cgAsOrdinary = !state.cgAsOrdinary;
	if (state.cgAsOrdinary) {
		state.revenue.capitalGainsTax.rateMultiplier = 1.5;
	} else {
		state.revenue.capitalGainsTax.rateMultiplier = 1.0;
	}
	updateAll();
}

function updateSpend(catKey, itemKey, pct) {
	state.spending[catKey].items[itemKey].amount = state.spending[catKey].items[itemKey].baseline * pct;
	updateValues();
}

function resetAll() {
	for (const r of Object.values(state.revenue)) {
		r.rateMultiplier = 1.0;
		r.type = r.type;
	}
	state.revenue.individualIncomeTax.type = 'progressive';
	state.revenue.socialSecurity.type = 'flat';
	state.revenue.medicare.type = 'flat';
	state.revenue.corporateIncomeTax.type = 'flat';
	state.revenue.exciseTax.type = 'flat';
	state.revenue.estateGiftTax.type = 'progressive';
	state.revenue.customsTariffs.type = 'flat';
	state.revenue.otherRevenue.type = 'flat';
	state.revenue.capitalGainsTax.type = 'flat';
	state.cgAsOrdinary = false;

	for (const cat of Object.values(state.spending)) {
		for (const item of Object.values(cat.items)) {
			item.amount = item.baseline;
		}
	}
	renderRevenue();
	renderSpending();
	updateAll();
}
