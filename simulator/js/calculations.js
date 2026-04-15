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
	const ssCap = ssR.type === 'progressive' ? Infinity : 168600; // 2025 Social Security wage base limit
	const ssTax = Math.min(wages, ssCap) * ssRate;

	const medTax = wages * 0.0145 * medR.rateMultiplier;

	return ssTax + medTax;
}

function calcCGTax(cgIncome) {
	if (state.cgAsOrdinary) return calcIncomeTax(cgIncome);
	
	const cgR = state.revenue.capitalGainsTax;
	const m = cgR.rateMultiplier;
	
	// Flat capital gains tax
	if (cgR.type === 'flat') {
		const baseRate = state.flatTaxRates.capitalGainsTax / 100;
		return cgIncome * baseRate * m;
	}
	
	// Progressive capital gains tax using brackets
	let tax = 0;
	const brackets = state.taxBrackets.capitalGainsTax;
	if (brackets) {
		for (const b of brackets) {
			if (cgIncome <= b.min) break;
			const amt = Math.min(cgIncome, b.max) - b.min;
			tax += amt * b.rate * m;
		}
	}
	return tax;
}

function calcStudentTax(student) {
	const incomeTax = calcIncomeTax(student.income);
	const payroll = calcPayrollTax(student.income);
	const cgTax = calcCGTax(student.cgIncome);
	
	// Consumption-based taxes: excise + tariffs combined
	let consumptionTax = calcConsumptionTax(student);
	
	const total = incomeTax + payroll + cgTax + consumptionTax;
	const totalIncome = student.income + student.cgIncome;
	const effRate = totalIncome > 0 ? (total / totalIncome) * 100 : 0;
	return { incomeTax, payroll, cgTax, consumptionTax, total, effRate };
}

function calcConsumptionTax(student) {
	// Combined excise + tariffs: realistic ~1% effective rate on consumption
	const exciseR = state.revenue.exciseTax;
	const tariffR = state.revenue.customsTariffs;
	
	const totalIncome = student.income + student.cgIncome;
	
	// Estimate consumption as % of income (lower income = higher consumption %age)
	let consumptionRate = 0.75;
	if (totalIncome < 30000) consumptionRate = 0.98;
	else if (totalIncome < 50000) consumptionRate = 0.95;
	else if (totalIncome < 100000) consumptionRate = 0.85;
	else if (totalIncome > 1000000) consumptionRate = 0.85;
	else consumptionRate = 0.80;
	
	const consumption = totalIncome * consumptionRate;
	
	// Base combined consumption tax rate: ~1% (conservative estimate)
	const baseRate = 0.01 * (exciseR.rateMultiplier + tariffR.rateMultiplier) / 2;
	
	return consumption * baseRate;
}

// Returns bracket revenue for any tax with bracket data, in billions
function calcBracketRevenue(key) {
	const brackets = key === 'individualIncomeTax' ? state.customBracketRates : state.taxBrackets[key];
	if (!brackets) return 0;
	const m = state.revenue[key].rateMultiplier;
	let total = 0;
	for (const b of brackets) {
		total += b.incomeMass * b.rate * m;
	}
	return total;
}

function calcIncomeTaxBracketRevenue() {
	return calcBracketRevenue('individualIncomeTax');
}

function calcTotalRevenue() {
	let total = 0;
	for (const [k, r] of Object.entries(state.revenue)) {
		if (k === 'socialSecurity' || k === 'medicare') continue;
		
		const hasBrackets = k === 'individualIncomeTax' ? true : !!(state.taxBrackets && state.taxBrackets[k]);
		if (hasBrackets && r.type === 'progressive') {
			total += calcBracketRevenue(k);
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

function calcSSDeficit() {
	// Social Security revenue (affected by rateMultiplier)
	const ssRevenue = state.revenue.socialSecurity.baseAmount * state.revenue.socialSecurity.rateMultiplier;
	
	// Social Security spending (Retirement + Disability + Survivor)
	const ssSpending = getSpendItem('ssRetirement').amount + 
	                     getSpendItem('ssDisability').amount + 
	                     getSpendItem('ssSurvivor').amount;
	
	return ssRevenue - ssSpending; // negative = deficit
}

function calcMedicareDeficit() {
	// Medicare revenue (affected by rateMultiplier)
	const medRevenue = state.revenue.medicare.baseAmount * state.revenue.medicare.rateMultiplier;
	
	// Medicare spending
	const medSpending = getSpendItem('medicare').amount;
	
	return medRevenue - medSpending; // negative = deficit
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
