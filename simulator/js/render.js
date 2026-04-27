// ─── RENDER ─────────────────────────────────────────────────────────────────

function renderRevenue() {
	const body = document.getElementById('revenue-body');
	body.innerHTML = '';
	const totalRev = calcTotalRevenue();

	for (const [key, r] of Object.entries(state.revenue)) {
		if (key === 'capitalGainsTax') continue;
		
		let multiplier = 1.0;
		if (r.type === 'progressive' && progressiveMultipliers[key]) {
			multiplier = progressiveMultipliers[key];
		}
		if (r.type === 'flat' && flatTaxMultipliers[key]) {
			multiplier = flatTaxMultipliers[key];
		}
		const amt = r.baseAmount * r.rateMultiplier * multiplier;
		const pct = ((amt / totalRev) * 100).toFixed(1);

		const row = document.createElement('div');
		row.className = 'rev-row';
		
		if (r.type === 'flat' && state.flatTaxRates[key]) {
			const baseRate = state.flatTaxRates[key];
			const cappingMultiplier = 0.94 / (baseRate / 100);
			const effectiveRate = (baseRate * r.rateMultiplier).toFixed(1);
			row.innerHTML = `
				<span class="rev-label" title="${r.label}" style="cursor:pointer">${r.label}</span>
				<button class="type-badge badge-flat">FLAT ${effectiveRate}%</button>
				<input type="range" class="rev-slider" min="0" max="6.3" step="0.05" value="${r.rateMultiplier}">
				<span class="rev-amount" id="rev-amt-${key}">${formatB(amt)}</span>
				<span class="rev-pct" id="rev-pct-${key}">${pct}%</span>
			`;
			const btn = row.querySelector('.type-badge');
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				toggleRevType(key);
			});
			
			const slider = row.querySelector('.rev-slider');
			slider.addEventListener('input', (e) => {
				e.stopPropagation();
				const cappedMultiplier = Math.min(+e.target.value, cappingMultiplier);
				const newRate = (baseRate * cappedMultiplier).toFixed(1);
				btn.textContent = `FLAT ${newRate}%`;
				updateRevRate(key, cappedMultiplier);
				slider.value = cappedMultiplier;
			});
			
			body.appendChild(row);
		} else {
			// Check if this progressive tax has brackets - if so, show Tax Brackets in place of slider
			const brackets = key === 'individualIncomeTax' ? state.customBracketRates : (state.taxBrackets && state.taxBrackets[key]);
			const hasProgressiveBrackets = brackets && r.type === 'progressive';
			
			if (hasProgressiveBrackets) {
				const isExpanded = state.bracketsExpandedMap[key] === true;
				
				// Determine label based on tax type
				let bracketsLabel = 'Tax Brackets';
				if (key === 'exciseTax') bracketsLabel = 'Product Categories';
				else if (key === 'customsTariffs') bracketsLabel = 'Import Categories';
				else if (key === 'otherRevenue') bracketsLabel = 'Fee Types';
				
				row.innerHTML = `
					<span class="rev-label" title="${r.label}" style="cursor:pointer">${r.label}</span>
					<button class="type-badge ${r.type==='progressive'?'badge-prog':'badge-flat'}">${r.type==='progressive'?'PROG':'FLAT'}</button>
					<div class="tax-brackets-toggle" style="padding:6px 12px;background:var(--panel);border-radius:3px;border:1px solid var(--border);cursor:pointer;user-select:none;display:flex;align-items:center;gap:6px;font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--blue)">
						<span style="font-size:11px">${isExpanded ? '▼' : '▶'}</span><span>${bracketsLabel}</span>
					</div>
					<span class="rev-amount" id="rev-amt-${key}">${formatB(amt)}</span>
					<span class="rev-pct" id="rev-pct-${key}">${pct}%</span>
				`;
			} else {
			const baseRate = state.flatTaxRates[key] || 15;
			row.innerHTML = `
				<span class="rev-label" title="${r.label}" style="cursor:pointer">${r.label}</span>
				<button class="type-badge ${r.type==='progressive'?'badge-prog':'badge-flat'}">${r.type==='progressive'?'PROG':'FLAT'}</button>
				<input type="range" class="rev-slider" min="0" max="6.3" step="0.05" value="${r.rateMultiplier}">
					<span class="rev-amount" id="rev-amt-${key}">${formatB(amt)}</span>
					<span class="rev-pct" id="rev-pct-${key}">${pct}%</span>
				`;
			}
			
			const btn = row.querySelector('.type-badge');
			(function(k) {
				btn.addEventListener('click', (e) => {
					e.stopPropagation();
					toggleRevType(k);
				});
			})(key);
			
			if (!hasProgressiveBrackets) {
				const slider = row.querySelector('.rev-slider');
				const baseRate = state.flatTaxRates[key] || 15;
			const cappingMultiplier = 0.94 / (baseRate / 100);
			(function(k) {
				slider.addEventListener('input', (e) => {
					e.stopPropagation();
					const rawMultiplier = +e.target.value;
					const cappedMultiplier = Math.min(rawMultiplier, cappingMultiplier);
					updateRevRate(k, cappedMultiplier);
					if (cappedMultiplier < rawMultiplier) {
						slider.value = cappedMultiplier;
					}
					});
				})(key);
			}
			
			body.appendChild(row);
			
			// Add bracket sliders for any progressive tax with bracket data
			if (hasProgressiveBrackets) {
				const isExpanded = state.bracketsExpandedMap[key] === true;
				const brackets = key === 'individualIncomeTax' ? state.customBracketRates : state.taxBrackets[key];
				
				// Determine label based on tax type
				let bracketsLabel = 'Tax Brackets';
				if (key === 'exciseTax') bracketsLabel = 'Product Categories';
				else if (key === 'customsTariffs') bracketsLabel = 'Import Categories';
				else if (key === 'otherRevenue') bracketsLabel = 'Fee Types';
				
				const bracketsContainer = document.createElement('div');
				bracketsContainer.style.cssText = 'display:' + (isExpanded ? 'block' : 'none');
				
				const toggleBtn = row.querySelector('.tax-brackets-toggle');
				toggleBtn.addEventListener('click', () => {
					state.bracketsExpandedMap[key] = !state.bracketsExpandedMap[key];
					if (state.bracketsExpandedMap[key] === undefined) state.bracketsExpandedMap[key] = false;
					const exp = state.bracketsExpandedMap[key] === true;
					bracketsContainer.style.display = exp ? 'block' : 'none';
					toggleBtn.innerHTML = `<span style="font-size:11px">${exp ? '▼' : '▶'}</span><span>${bracketsLabel}</span>`;
				});
				
				brackets.forEach((bracket, idx) => {
					const bracketRow = document.createElement('div');
					bracketRow.style.cssText = 'padding:6px 12px;background:var(--panel);border-radius:3px;margin-top:2px;display:grid;grid-template-columns:1fr 200px 55px;align-items:center;gap:8px;font-family:"IBM Plex Mono",monospace;font-size:9px;border:1px solid var(--border);pointer-events:auto';
					
					bracketRow.innerHTML = `
						<span style="color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${bracket.label}">${bracket.label}</span>
						<input type="range" class="bracket-slider" min="0.01" max="0.75" step="0.01" value="${bracket.rate}" data-idx="${idx}">
						<span class="bracket-rate" style="color:var(--green);font-weight:600;text-align:right">${(bracket.rate * 100).toFixed(1)}%</span>
					`;
					
					const bracketSlider = bracketRow.querySelector('.bracket-slider');
					const rateDisplay = bracketRow.querySelector('.bracket-rate');
					
					bracketSlider.addEventListener('input', (e) => {
						const newRate = +e.target.value;
						brackets[idx].rate = newRate;
						rateDisplay.textContent = (newRate * 100).toFixed(1) + '%';
						updateValues();
					});
					
					bracketsContainer.appendChild(bracketRow);
				});
				
				body.appendChild(bracketsContainer);
			}
		}
	}

	// Capital gains rendered through same unified path
	const cgR = state.revenue.capitalGainsTax;
	const cgKey = 'capitalGainsTax';
	const cgBrackets = state.taxBrackets[cgKey];
	let cgDisplay;
	if (state.cgAsOrdinary) {
		cgDisplay = cgR.baseAmount * cgR.rateMultiplier;
	} else if (cgR.type === 'progressive') {
		cgDisplay = calcBracketRevenue(cgKey);
	} else {
		cgDisplay = cgR.baseAmount * cgR.rateMultiplier;
	}
	const cgPct = ((cgDisplay / totalRev) * 100).toFixed(1);
	const cgRow = document.createElement('div');
	cgRow.className = 'rev-row';
	
	let cgBadgeClass, cgBadgeLabel;
	if (state.cgAsOrdinary) {
		cgBadgeClass = 'badge-prog';
		cgBadgeLabel = 'ORDINARY';
	} else if (cgR.type === 'progressive') {
		cgBadgeClass = 'badge-prog';
		cgBadgeLabel = 'PROG';
	} else {
		const baseRate = state.flatTaxRates[cgKey];
		cgBadgeClass = 'badge-flat';
		cgBadgeLabel = `FLAT ${(baseRate * cgR.rateMultiplier).toFixed(1)}%`;
	}
	
	// Check if this should use Tax Brackets inline toggle (progressive & not ordinary)
	const shouldUseCGBrackets = !state.cgAsOrdinary && cgR.type === 'progressive' && cgBrackets;
	const cgIsExpanded = state.bracketsExpandedMap[cgKey] === true;
	
	if (shouldUseCGBrackets) {
		cgRow.innerHTML = `
			<span class="rev-label" title="${cgR.label}" style="cursor:pointer">${cgR.label}</span>
			<button class="type-badge ${cgBadgeClass}">${cgBadgeLabel}</button>
			<div class="tax-brackets-toggle" style="padding:6px 12px;background:var(--panel);border-radius:3px;border:1px solid var(--border);cursor:pointer;user-select:none;display:flex;align-items:center;gap:6px;font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--blue)">
				<span style="font-size:11px">${cgIsExpanded ? '▼' : '▶'}</span><span>Tax Brackets</span>
			</div>
			<span class="rev-amount" id="rev-amt-capitalGainsTax">${formatB(cgDisplay)}</span>
			<span class="rev-pct" id="rev-pct-capitalGainsTax">${cgPct}%</span>
		`;
	} else {
		const cgBaseRate = state.flatTaxRates[cgKey];
		cgRow.innerHTML = `
			<span class="rev-label" title="${cgR.label}" style="cursor:pointer">${cgR.label}</span>
			<button class="type-badge ${cgBadgeClass}">${cgBadgeLabel}</button>
			<input type="range" class="rev-slider" min="0" max="6.3" step="0.05" value="${cgR.rateMultiplier}">
			<span class="rev-amount" id="rev-amt-capitalGainsTax">${formatB(cgDisplay)}</span>
			<span class="rev-pct" id="rev-pct-capitalGainsTax">${cgPct}%</span>
		`;
	}
	
	const cgBtn = cgRow.querySelector('.type-badge');
	cgBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		toggleCG();
	});
	
	if (!shouldUseCGBrackets) {
		const cgSlider = cgRow.querySelector('.rev-slider');
		const cgBaseRate = state.flatTaxRates[cgKey];
		const cgCappingMultiplier = 0.94 / (cgBaseRate / 100);
		cgSlider.addEventListener('input', (e) => {
			e.stopPropagation();
			const rawMultiplier = +e.target.value;
			const cappedMultiplier = Math.min(rawMultiplier, cgCappingMultiplier);
			if (cgR.type === 'flat' && !state.cgAsOrdinary) {
				const newRate = (cgBaseRate * cappedMultiplier).toFixed(1);
				cgBtn.textContent = `FLAT ${newRate}%`;
			}
			updateRevRate(cgKey, cappedMultiplier);
			if (cappedMultiplier < rawMultiplier) {
				cgSlider.value = cappedMultiplier;
			}
		});
	}
	
	body.appendChild(cgRow);
	
	// Bracket sliders for progressive capital gains
	if (!state.cgAsOrdinary && cgR.type === 'progressive' && cgBrackets) {
		const bracketsContainer = document.createElement('div');
		bracketsContainer.style.cssText = 'display:' + (cgIsExpanded ? 'block' : 'none');
		
		const toggleBtn = cgRow.querySelector('.tax-brackets-toggle');
		toggleBtn.addEventListener('click', () => {
			state.bracketsExpandedMap[cgKey] = !(state.bracketsExpandedMap[cgKey] === true);
			const exp = state.bracketsExpandedMap[cgKey] === true;
			bracketsContainer.style.display = exp ? 'block' : 'none';
			toggleBtn.innerHTML = `<span style="font-size:11px">${exp ? '▼' : '▶'}</span><span>Tax Brackets</span>`;
		});
		body.appendChild(bracketsContainer);
		
		cgBrackets.forEach((bracket, idx) => {
			const bracketRow = document.createElement('div');
			bracketRow.style.cssText = 'padding:6px 12px;background:var(--panel);border-radius:3px;margin-top:2px;display:grid;grid-template-columns:1fr 200px 55px;align-items:center;gap:8px;font-family:"IBM Plex Mono",monospace;font-size:9px;border:1px solid var(--border);pointer-events:auto';
			bracketRow.innerHTML = `
				<span style="color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${bracket.label}">${bracket.label}</span>
				<input type="range" class="bracket-slider" min="0" max="0.94" step="0.01" value="${bracket.rate}">
				<span class="bracket-rate" style="color:var(--green);font-weight:600;text-align:right">${(bracket.rate * 100).toFixed(1)}%</span>
			`;
			const sl = bracketRow.querySelector('.bracket-slider');
			const rd = bracketRow.querySelector('.bracket-rate');
			sl.addEventListener('input', (e) => {
				const newRate = +e.target.value;
				cgBrackets[idx].rate = newRate;
				rd.textContent = (newRate * 100).toFixed(1) + '%';
				updateValues();
			});
			bracketsContainer.appendChild(bracketRow);
		});
		body.appendChild(bracketsContainer);
	}
}

document.addEventListener('click', (e) => {
	if (e.target.classList.contains('rev-label')) {
		const row = e.target.closest('.rev-row');
		if (row && row.querySelector('.rev-label')) {
			const key = Array.from(state.revenue.keys || Object.keys(state.revenue)).find(k => {
				const amt = state.revenue[k]?.baseAmount * state.revenue[k]?.rateMultiplier || 0;
				const label = document.querySelector(`#rev-amt-${k}`);
				return label && row.contains(label);
			});
			if (!key) {
				if (row.querySelector('#rev-amt-capitalGainsTax')) {
					if (revenueInfo['capitalGainsTax']) showModal('capitalGainsTax', 'revenue');
					return;
				}
				for (const rkey in state.revenue) {
					if (row.querySelector(`#rev-amt-${rkey}`)) {
						if (revenueInfo[rkey]) showModal(rkey, 'revenue');
						return;
					}
				}
			} else if (revenueInfo[key]) {
				showModal(key, 'revenue');
			}
		}
	}
});

function renderSpending() {
	const body = document.getElementById('spending-body');
	body.innerHTML = '';

	for (const [catKey, cat] of Object.entries(state.spending)) {
		const catTotal = Object.values(cat.items).reduce((s,i) => s + i.amount, 0);
		const catBaseline = Object.values(cat.items).reduce((s,i) => s + i.baseline, 0);
		const catDelta = catTotal - catBaseline;

		const hdr = document.createElement('div');
		hdr.className = 'cat-header';
		hdr.innerHTML = `
			<span>${cat.icon} ${cat.label}</span>
			<span class="cat-total">${formatB(catTotal)}</span>
			<span class="cat-toggle">${cat.collapsed?'▶':'▼'}</span>
		`;
		hdr.onclick = () => { cat.collapsed = !cat.collapsed; renderSpending(); };
		body.appendChild(hdr);

		const rows = document.createElement('div');
		rows.className = `cat-rows ${cat.collapsed?'collapsed':''}`;

		for (const [itemKey, item] of Object.entries(cat.items)) {
			const pct = (item.amount / item.baseline);
			const delta = item.amount - item.baseline;
			const deltaClass = delta > 0 ? 'delta-pos' : delta < 0 ? 'delta-neg' : 'delta-zero';
			const deltaStr = delta === 0 ? '—' : (delta > 0 ? '+' : '') + formatB(delta);
			const locked = item.locked || cat.locked;
			const jobIcon = item.jobKey ? '👷' : '';

			const row = document.createElement('div');
			row.className = `spend-row cat-${cat.color} ${locked?'locked-row':''}`;
			row.dataset.itemKey = itemKey;
			row.innerHTML = `
				<span class="spend-label" title="${item.label}" style="cursor:pointer">${item.label}</span>
				<input type="range" class="spend-slider" min="0" max="1.5" step="0.01" value="${pct}"
					${locked?'disabled':''}>
				<span class="spend-amount" id="spend-amt-${itemKey}">${formatB(item.amount)}</span>
				<span class="spend-delta ${deltaClass}" id="spend-delta-${itemKey}">${deltaStr}</span>
				<span class="spend-job-icon" title="${item.jobKey?'Affects jobs':''}">${jobIcon}</span>
			`;
			
			const slider = row.querySelector('.spend-slider');
			slider.addEventListener('input', (e) => {
				e.stopPropagation();
				updateSpend(catKey, itemKey, +e.target.value);
			});
			
			rows.appendChild(row);
		}
		body.appendChild(rows);
	}
}

document.addEventListener('click', (e) => {
	if (e.target.classList.contains('spend-label')) {
		const row = e.target.closest('.spend-row');
		if (row) {
			const itemKey = row.dataset.itemKey;
			if (itemKey && spendingInfo[itemKey]) {
				showModal(itemKey, 'spending');
			}
		}
	}
});

function renderJobs() {
	const grid = document.getElementById('jobs-grid');
	grid.innerHTML = '';
	let atRisk = 0, lost = 0;

	for (const s of students) {
		const status = checkJobStatus(s);
		if (status === 'risk') atRisk++;
		if (status === 'lost') lost++;

		const {incomeTax, payroll, cgTax, consumptionTax, total, effRate} = calcStudentTax(s);
		const totalIncome = s.income + s.cgIncome;
		const afterTaxIncome = totalIncome - total;
		const belowPoverty = afterTaxIncome < POVERTY_LEVEL_2025;

		const card = document.createElement('div');
		
		// When job is lost, calculate affordability with $0 income
		const displayAfterTaxForCalc = status === 'lost' ? 0 : afterTaxIncome;
		const affordability = calcAffordability(displayAfterTaxForCalc);
		const unaffordableItems = Object.entries(affordability.items)
			.filter(([key, item]) => !item.canAfford)
			.map(([key, item]) => {
				const expenseNames = {
					food: 'Food',
					rent: 'Rent',
					homeOwnership: 'Home',
					carPayment: 'Car',
					gasoline: 'Gas',
					carInsurance: 'Insurance',
					utilities: 'Utilities',
					healthcare: 'Healthcare',
					clothing: 'Clothing',
					travel: 'Travel'
				};
				return expenseNames[key];
			});
		card.className = `student-card ${status === 'risk' ? 'at-risk' : status === 'lost' ? 'job-lost' : ''} ${belowPoverty ? 'below-poverty' : ''} ${unaffordableItems.length > 0 ? 'has-unaffordables' : ''}`;
		card.dataset.studentId = s.id;

		const statusLabel = status === 'ok' ? 'OK' : status === 'risk' ? 'AT RISK' : 'JOB LOST';
		const statusClass  = status === 'ok' ? 'status-ok' : status === 'risk' ? 'status-risk' : 'status-lost';
		const povertyIndicator = belowPoverty ? '<div class="poverty-indicator">BELOW POVERTY LEVEL</div>' : '';
		const unaffordableDisplay = unaffordableItems.length > 0 
			? `<div class="card-essentials">Cannot afford: ${unaffordableItems.join(', ')}</div>` 
			: '';

		// When job is lost, show $0 income
		const displayIncome = status === 'lost' ? 0 : totalIncome;
		const displayAfterTax = status === 'lost' ? 0 : afterTaxIncome;
		const displayTax = status === 'lost' ? 0 : total;
		const displayRate = status === 'lost' ? 0 : effRate;

		card.innerHTML = `
			<span class="card-status ${statusClass}">${statusLabel}</span>
			<div class="card-name">${s.name}</div>
			<div class="card-income">${fmtMoney(displayIncome)}</div>
			<div class="card-tax">${fmtMoney(displayTax)}</div>
			${unaffordableDisplay}
			<div class="card-after-tax">${fmtMoney(displayAfterTax)}</div>
			<div class="card-rate">${displayRate.toFixed(1)}% eff. rate</div>
			${povertyIndicator}
			<div class="card-dep">${s.dependsOn}</div>
			<div class="job-lost-overlay">JOB LOST</div>
		`;

		const indirect = indirectTooltip(s, status);
		
		const itLabel = state.revenue.individualIncomeTax.type === 'flat' ? 'Income tax (flat)' : 'Income tax (prog)';
		const ssRate = (0.062 * state.revenue.socialSecurity.rateMultiplier * 100).toFixed(2);
		const medRate = (0.0145 * state.revenue.medicare.rateMultiplier * 100).toFixed(2);
		const ssCap = state.revenue.socialSecurity.type === 'progressive' ? s.income : 168600;
		const ssTaxAmt = Math.min(s.income, ssCap) * 0.062 * state.revenue.socialSecurity.rateMultiplier;
		const medTaxAmt = s.income * 0.0145 * state.revenue.medicare.rateMultiplier;
		
		let tipLines = [
			`${itLabel}: ${fmtMoney(incomeTax)}`,
			`SS payroll (${ssRate}%): ${fmtMoney(ssTaxAmt)} + Medicare (${medRate}%): ${fmtMoney(medTaxAmt)}`,
		];
		if (s.cgIncome > 0) tipLines.push(`Capital gains tax: ${fmtMoney(cgTax)} (${state.cgAsOrdinary?'ordinary rates':'CG rates'})`);
		if (consumptionTax > 0) tipLines.push(`Excise & tariffs: ${fmtMoney(consumptionTax)} (embedded in prices)`);
		tipLines.push('');
		tipLines.push(`Total tax: ${fmtMoney(total)} | Eff. rate: ${effRate.toFixed(1)}%`);
		tipLines.push(`After-tax income: ${fmtMoney(afterTaxIncome)}`);
		tipLines.push(`Monthly income: ${fmtMoney(affordability.monthlyIncome)}`);
		
		if (belowPoverty) tipLines.push(`⚠ Below poverty level ($${POVERTY_LEVEL_2025.toLocaleString()})`);
		
		tipLines.push('', '─ MONTHLY AFFORDABILITY ─');
		const expenseNames = {
			food: 'Food',
			rent: 'Rent',
			homeOwnership: 'Home Ownership',
			carPayment: 'Car Payment',
			gasoline: 'Gasoline',
			carInsurance: 'Car Insurance',
			utilities: 'Utilities',
			healthcare: 'Healthcare',
			clothing: 'Clothing',
			travel: 'Travel/Entertainment'
		};
		
		for (const [key, item] of Object.entries(affordability.items)) {
			const affordStatus = item.canAfford ? '✓' : '✗';
			const label = expenseNames[key];
			tipLines.push(`${affordStatus} ${label}: ${fmtMoney(item.monthly)}/mo`);
		}
		
		if (indirect) tipLines.push('', indirect);
		const tipText = tipLines.join('\n');

		card.addEventListener('click', () => showStudentReport(s.id));
		card.addEventListener('mouseenter', (e) => showTooltip(e, tipText));
		card.addEventListener('mousemove', moveTooltip);
		card.addEventListener('mouseleave', hideTooltip);

		grid.appendChild(card);
	}
}

function renderDeficit() {
	const rev = calcTotalRevenue();
	const spend = calcTotalSpending();
	const gap = rev - spend;
	const baselineVal = typeof window.INITIAL_DEFICIT !== 'undefined' ? window.INITIAL_DEFICIT : BASELINE_DEFICIT;
	const change = gap - baselineVal;

	const el = document.getElementById('deficit-number');
	el.textContent = (gap >= 0 ? '+' : '') + formatB(gap);
	el.className = 'deficit-number ' + (gap >= 0 ? 'surplus' : 'deficit');

	const changeEl = document.getElementById('deficit-change');
	if (change === 0) {
		changeEl.textContent = 'Baseline';
		changeEl.style.color = 'var(--muted)';
	} else {
		changeEl.textContent = (change > 0 ? '▲ improved ' : '▼ worsened ') + formatB(Math.abs(change));
		changeEl.style.color = change > 0 ? 'var(--green)' : 'var(--red)';
	}

	
	document.getElementById('rev-total-display').textContent = formatB(rev);
	document.getElementById('spend-total-display').textContent = formatB(spend);
	
	// Social Security deficit
	const ssDeficit = calcSSDeficit();
	document.getElementById('ss-deficit-display').textContent = (ssDeficit >= 0 ? '+' : '') + formatB(ssDeficit);
	document.getElementById('ss-deficit-display').style.color = ssDeficit >= 0 ? 'var(--green)' : 'var(--red)';
	
	// Medicare deficit
	const medDeficit = calcMedicareDeficit();
	document.getElementById('medicare-deficit-display').textContent = (medDeficit >= 0 ? '+' : '') + formatB(medDeficit);
	document.getElementById('medicare-deficit-display').style.color = medDeficit >= 0 ? 'var(--green)' : 'var(--red)';

	const barPct = Math.min(100, Math.max(0, ((gap + 2500) / 3350) * 100));
	const bar = document.getElementById('bar-fill');
	bar.style.width = barPct + '%';
	bar.style.background = gap >= 0 ? 'var(--green)' : gap > -455 ? 'var(--amber)' : 'var(--red)';

	// Update national debt display
	const debtDisplay = document.getElementById('national-debt-display');
	debtDisplay.textContent = formatB(NATIONAL_DEBT);

	// Calculate payoff time
	const payoffEl = document.getElementById('payoff-years');
	const yearsToPayoff = calcDebtPayoffYears();
	if (yearsToPayoff === Infinity) {
		payoffEl.textContent = 'Debt increasing';
		payoffEl.style.color = 'var(--red)';
	} else {
		const years = Math.round(yearsToPayoff * 10) / 10;
		payoffEl.textContent = years + ' years';
		payoffEl.style.color = years > 50 ? 'var(--red)' : years > 20 ? 'var(--amber)' : 'var(--green)';
	}
}

function updateAll() {
	renderDeficit();
	renderJobs();
	renderRevenue();
	renderSpending();
}

function updateValues() {
	renderDeficit();
	renderJobs();

	const totalRev = calcTotalRevenue();
	for (const [key, r] of Object.entries(state.revenue)) {
		let amt;
		const hasBrackets = key === 'individualIncomeTax' ? true : !!(state.taxBrackets && state.taxBrackets[key]);
		if (hasBrackets && r.type === 'progressive') {
			amt = calcBracketRevenue(key);
		} else {
			let multiplier = 1.0;
			if (r.type === 'progressive' && progressiveMultipliers[key]) multiplier = progressiveMultipliers[key];
			if (r.type === 'flat' && flatTaxMultipliers[key]) multiplier = flatTaxMultipliers[key];
			amt = r.baseAmount * r.rateMultiplier * multiplier;
		}
		const pct = ((amt / totalRev) * 100).toFixed(1);
		const amtEl = document.getElementById(`rev-amt-${key}`);
		const pctEl = document.getElementById(`rev-pct-${key}`);
		if (amtEl) amtEl.textContent = formatB(amt);
		if (pctEl) pctEl.textContent = pct + '%';
	}

	for (const cat of Object.values(state.spending)) {
		for (const [k, item] of Object.entries(cat.items)) {
			const amtEl = document.getElementById(`spend-amt-${k}`);
			const dEl = document.getElementById(`spend-delta-${k}`);
			if (amtEl) amtEl.textContent = formatB(item.amount);
			if (dEl) {
				const d = item.amount - item.baseline;
				dEl.textContent = d === 0 ? '—' : (d > 0 ? '+' : '') + formatB(d);
				dEl.className = 'spend-delta ' + (d > 0 ? 'delta-pos' : d < 0 ? 'delta-neg' : 'delta-zero');
			}
		}
	}
}
