// ─── CALCULATIONS ───────────────────────────────────────────────────────────

function calcIncomeTax(gross) {
	const m = state.revenue.individualIncomeTax.rateMultiplier;
	const taxable = Math.max(0, gross - STANDARD_DEDUCTION);
	let tax = 0;
	if (state.revenue.individualIncomeTax.type === 'flat') {
		tax = taxable * (state.flatTaxRates.individualIncomeTax / 100) * m;
	} else {
		for (const b of state.customBracketRates) {
			if (taxable <= b.min) break;
			const amt = Math.min(taxable, b.max) - b.min;
			tax += amt * b.rate * m;
		}
	}
	return tax;
}

function calcPayrollTax(wages) {
	const ssR = state.revenue.socialSecurity;
	const medR = state.revenue.medicare;

	const ssRate = 0.062 * ssR.rateMultiplier;
	const ssCap = ssR.type === 'progressive' ? Infinity : 184500;
	const ssTax = Math.min(wages, ssCap) * ssRate;

	const medTax = wages * 0.0145 * medR.rateMultiplier;

	return ssTax + medTax;
}

function calcCGTax(cgIncome) {
	if (state.cgAsOrdinary) return calcIncomeTax(cgIncome);
	const m = state.revenue.individualIncomeTax.rateMultiplier;
	let tax = 0;
	for (const b of cgRates) {
		if (cgIncome <= b.min) break;
		const amt = Math.min(cgIncome, b.max) - b.min;
		tax += amt * b.rate * m;
	}
	return tax;
}

function calcStudentTax(student) {
	const incomeTax = calcIncomeTax(student.income);
	const payroll = calcPayrollTax(student.income);
	const cgTax = calcCGTax(student.cgIncome);
	const total = incomeTax + payroll + cgTax;
	const totalIncome = student.income + student.cgIncome;
	const effRate = totalIncome > 0 ? (total / totalIncome) * 100 : 0;
	return { incomeTax, payroll, cgTax, total, effRate };
}

// Returns total individual income tax revenue in billions using real bracket income masses
function calcIncomeTaxBracketRevenue() {
	const m = state.revenue.individualIncomeTax.rateMultiplier;
	let total = 0;
	for (const b of state.customBracketRates) {
		total += b.incomeMass * b.rate * m;
	}
	return total;
}

function calcTotalRevenue() {
	let total = 0;
	for (const [k, r] of Object.entries(state.revenue)) {
		if (k === 'socialSecurity' || k === 'medicare') continue;
		
		if (k === 'individualIncomeTax' && r.type === 'progressive') {
			total += calcIncomeTaxBracketRevenue();
			continue;
		}
		
		let multiplier = 1.0;
		if (r.type === 'progressive' && progressiveMultipliers[k]) {
			multiplier = progressiveMultipliers[k];
		}
		if (r.type === 'flat' && flatTaxMultipliers[k]) {
			multiplier = flatTaxMultipliers[k];
		}
		total += r.baseAmount * r.rateMultiplier * multiplier;
	}
	return total;
}

function calcTotalSpending() {
	let total = 0;
	for (const cat of Object.values(state.spending)) {
		for (const [k, item] of Object.entries(cat.items)) {
			if (k === 'ssRetirement' || k === 'ssDisability' || k === 'ssSurvivor' || 
				k === 'medicare') continue;
			total += item.amount;
		}
	}
	return total;
}

function calcDeficit() {
	return calcTotalRevenue() - calcTotalSpending();
}

function getSpendItem(key) {
	for (const cat of Object.values(state.spending)) {
		if (cat.items[key]) return cat.items[key];
	}
	return null;
}

function cutPct(key) {
	const item = getSpendItem(key);
	if (!item) return 0;
	return (item.baseline - item.amount) / item.baseline;
}

function checkJobStatus(student) {
	const k = student.depKey;
	if (!k) return 'ok';

	if (k === 'defenseOps') {
		const pct = cutPct('defenseOps');
		if (pct > 0.20) return 'lost';
		if (pct > 0.10) return 'risk';
	}
	if (k === 'medicaid') {
		const pct = cutPct('medicaid');
		if (student.sector === 'govt') {
			if (pct > 0.15) return 'lost';
			if (pct > 0.08) return 'risk';
		} else {
			if (pct > 0.20) return 'risk';
		}
	}
	if (k === 'sciEnv') {
		const pct = cutPct('sciEPA');
		if (pct > 0.25) return 'lost';
		if (pct > 0.12) return 'risk';
	}
	if (k === 'nurse') {
		const medPct = cutPct('medicare');
		const medcaidPct = cutPct('medicaid');
		const combined = (medPct + medcaidPct) / 2;
		if (combined > 0.30) return 'lost';
		if (combined > 0.15) return 'risk';
	}
	if (k === 'education') {
		const pct = cutPct('eduK12');
		if (pct > 0.40) return 'lost';
		if (pct > 0.20) return 'risk';
	}
	return 'ok';
}

function indirectTooltip(student, status) {
	if (status === 'ok') return null;
	if (student.depKey === 'defenseOps') {
		const item = getSpendItem('defenseOps');
		const cutB = item.baseline - item.amount;
		const jobs = Math.round(cutB * 3500);
		return `Defense ops cut by $${cutB}B → est. ${jobs.toLocaleString()} indirect civilian jobs lost in surrounding communities (restaurants, shops, contractors).`;
	}
	if (student.depKey === 'sciEnv') {
		return `Park closures ripple: local tourism businesses, outfitters, and hospitality near federal lands lose significant revenue.`;
	}
	return null;
}

function formatB(n) {
	if (Math.abs(n) >= 1000) return `$${(n/1000).toFixed(1)}T`;
	return `$${Math.round(n)}B`;
}

function fmtMoney(n) {
	if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
	if (n >= 1e6)  return `$${(n/1e6).toFixed(1)}M`;
	return `$${Math.round(n).toLocaleString()}`;
}

function calcDebtPayoffYears() {
	const deficit = calcDeficit();
	if (deficit >= 0) {
		// Surplus case
		const yearsToPayoff = NATIONAL_DEBT / deficit;
		return yearsToPayoff;
	} else {
		// Deficit case - debt grows
		return Infinity;
	}
}
