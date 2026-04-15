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

	// Social Security tax
	let ssTax = 0;
	if (ssR.type === 'progressive' && state.taxBrackets.socialSecurity) {
		// Progressive SS: apply bracket rates based on wage level, no cap
		let cumulativeWages = 0;
		for (const b of state.taxBrackets.socialSecurity) {
			const bracketStart = cumulativeWages;
			const bracketEnd = cumulativeWages + b.incomeMass;
			const wagesInThisBracket = Math.max(0, Math.min(wages, bracketEnd) - bracketStart);
			ssTax += wagesInThisBracket * b.rate * ssR.rateMultiplier;
			cumulativeWages = bracketEnd;
			if (wages <= cumulativeWages) break;
		}
	} else {
		// Flat SS: apply 6.2% with wage cap
		const ssRate = 0.062 * ssR.rateMultiplier;
		const ssCap = 168600; // 2025 Social Security wage base limit
		ssTax = Math.min(wages, ssCap) * ssRate;
	}

	// Medicare tax
	let medTax = 0;
	if (medR.type === 'progressive' && state.taxBrackets.medicare) {
		// Progressive Medicare: apply bracket rates based on wage level
		let cumulativeWages = 0;
		for (const b of state.taxBrackets.medicare) {
			const bracketStart = cumulativeWages;
			const bracketEnd = cumulativeWages + b.incomeMass;
			const wagesInThisBracket = Math.max(0, Math.min(wages, bracketEnd) - bracketStart);
			medTax += wagesInThisBracket * b.rate * medR.rateMultiplier;
			cumulativeWages = bracketEnd;
			if (wages <= cumulativeWages) break;
		}
	} else {
		// Flat Medicare: apply 1.45% with no cap
		medTax = wages * 0.0145 * medR.rateMultiplier;
	}

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

	// Progressive capital gains tax using real income thresholds (2024)
	let tax = 0;
	
	// Real capital gains tax brackets for 2024 (single filer thresholds)
	const cgBrackets = [
		{threshold: 0,      rate: 0.00},
		{threshold: 47025,  rate: 0.15},
		{threshold: 518900, rate: 0.20},
	];
	
	for (let i = 0; i < cgBrackets.length; i++) {
		const bracketStart = cgBrackets[i].threshold;
		const bracketEnd = i < cgBrackets.length - 1 ? cgBrackets[i + 1].threshold : Infinity;
		const gainsInThisBracket = Math.max(0, Math.min(cgIncome, bracketEnd) - bracketStart);
		tax += gainsInThisBracket * cgBrackets[i].rate * m;
		if (cgIncome <= bracketEnd) break;
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
	// Social Security revenue
	let ssRevenue = 0;
	const ssR = state.revenue.socialSecurity;
	
	if (ssR.type === 'progressive') {
		// Use progressive brackets if enabled
		ssRevenue = calcBracketRevenue('socialSecurity');
	} else {
		// Use flat rate with base amount and multiplier
		ssRevenue = ssR.baseAmount * ssR.rateMultiplier;
	}
	
	// Social Security spending (Retirement + Disability + Survivor)
	const ssSpending = getSpendItem('ssRetirement').amount + 
	                     getSpendItem('ssDisability').amount + 
	                     getSpendItem('ssSurvivor').amount;
	
	return ssRevenue - ssSpending; // negative = deficit
}

function calcMedicareDeficit() {
	// Medicare revenue
	let medRevenue = 0;
	const medR = state.revenue.medicare;
	
	if (medR.type === 'progressive') {
		// Use progressive brackets if enabled
		medRevenue = calcBracketRevenue('medicare');
	} else {
		// Use flat rate with base amount and multiplier
		medRevenue = medR.baseAmount * medR.rateMultiplier;
	}
	
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
