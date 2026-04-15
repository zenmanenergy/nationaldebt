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
			const effectiveRate = (baseRate * r.rateMultiplier).toFixed(1);
			row.innerHTML = `
				<span class="rev-label" title="${r.label}" style="cursor:pointer">${r.label}</span>
				<button class="type-badge badge-flat">FLAT ${effectiveRate}%</button>
				<input type="range" class="rev-slider" min="0" max="3" step="0.05" value="${r.rateMultiplier}">
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
				const newRate = (baseRate * +e.target.value).toFixed(1);
				btn.textContent = `FLAT ${newRate}%`;
				updateRevRate(key, +e.target.value);
			});
			
			body.appendChild(row);
		} else {
			row.innerHTML = `
				<span class="rev-label" title="${r.label}" style="cursor:pointer">${r.label}</span>
				<button class="type-badge ${r.type==='progressive'?'badge-prog':'badge-flat'}">${r.type==='progressive'?'PROG':'FLAT'}</button>
				<input type="range" class="rev-slider" min="0" max="3" step="0.05" value="${r.rateMultiplier}">
				<span class="rev-amount" id="rev-amt-${key}">${formatB(amt)}</span>
				<span class="rev-pct" id="rev-pct-${key}">${pct}%</span>
			`;
			
			const btn = row.querySelector('.type-badge');
			(function(k) {
				btn.addEventListener('click', (e) => {
					e.stopPropagation();
					toggleRevType(k);
				});
			})(key);
			
			const slider = row.querySelector('.rev-slider');
			(function(k) {
				slider.addEventListener('input', (e) => {
					e.stopPropagation();
					updateRevRate(k, +e.target.value);
				});
			})(key);
			
			body.appendChild(row);
			
			// Add bracket sliders for progressive income tax
			if (key === 'individualIncomeTax' && r.type === 'progressive') {
				const bracketsContainer = document.createElement('div');
				bracketsContainer.id = 'brackets-container';
				bracketsContainer.style.cssText = 'display:' + (state.bracketsExpanded ? 'block' : 'none');
				
				const expandBtn = document.createElement('div');
				expandBtn.style.cssText = 'padding:6px 12px;margin-top:4px;font-family:"IBM Plex Mono",monospace;font-size:9px;color:var(--blue);cursor:pointer;user-select:none;display:flex;align-items:center;gap:6px';
				expandBtn.innerHTML = `<span style="font-size:11px">${state.bracketsExpanded ? '▼' : '▶'}</span><span>Tax Brackets</span>`;
				expandBtn.addEventListener('click', () => {
					state.bracketsExpanded = !state.bracketsExpanded;
					bracketsContainer.style.display = state.bracketsExpanded ? 'block' : 'none';
					expandBtn.innerHTML = `<span style="font-size:11px">${state.bracketsExpanded ? '▼' : '▶'}</span><span>Tax Brackets</span>`;
				});
				body.appendChild(expandBtn);
				
				state.customBracketRates.forEach((bracket, idx) => {
					const bracketRow = document.createElement('div');
					bracketRow.style.cssText = 'padding:6px 12px;background:var(--panel);border-radius:3px;margin-top:2px;display:grid;grid-template-columns:100px 1fr 55px;align-items:center;gap:8px;font-family:"IBM Plex Mono",monospace;font-size:9px;border:1px solid var(--border);pointer-events:auto';
					
					bracketRow.innerHTML = `
						<span style="color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${bracket.label}">${bracket.label}</span>
						<input type="range" class="bracket-slider" min="0.01" max="0.75" step="0.01" value="${bracket.rate}" data-idx="${idx}">
						<span class="bracket-rate" style="color:var(--green);font-weight:600;text-align:right">${(bracket.rate * 100).toFixed(1)}%</span>
					`;
					
					const bracketSlider = bracketRow.querySelector('.bracket-slider');
					const rateDisplay = bracketRow.querySelector('.bracket-rate');
					
					bracketSlider.addEventListener('input', (e) => {
						const newRate = +e.target.value;
						state.customBracketRates[idx].rate = newRate;
						rateDisplay.textContent = (newRate * 100).toFixed(1) + '%';
						updateValues();
					});
					
					bracketsContainer.appendChild(bracketRow);
				});
				
				body.appendChild(bracketsContainer);
			}
		}
	}

	const cgR = state.revenue.capitalGainsTax;
	const cgAmt = cgR.baseAmount * cgR.rateMultiplier;
	const cgPct = ((cgAmt / totalRev) * 100).toFixed(1);
	const cgRow = document.createElement('div');
	cgRow.className = 'rev-row';
	
	if (!state.cgAsOrdinary && state.flatTaxRates.capitalGainsTax) {
		const baseRate = state.flatTaxRates.capitalGainsTax;
		const effectiveRate = (baseRate * cgR.rateMultiplier).toFixed(1);
		cgRow.innerHTML = `
			<span class="rev-label" title="${cgR.label}" style="cursor:pointer">${cgR.label}</span>
			<button class="type-badge badge-flat">FLAT ${effectiveRate}%</button>
			<input type="range" class="rev-slider" min="0" max="3" step="0.05" value="${cgR.rateMultiplier}">
			<span class="rev-amount" id="rev-amt-capitalGainsTax">${formatB(cgAmt)}</span>
			<span class="rev-pct" id="rev-pct-capitalGainsTax">${cgPct}%</span>
		`;
		
		const cgBtn = cgRow.querySelector('.type-badge');
		cgBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			toggleCG();
		});
		
		const cgSlider = cgRow.querySelector('.rev-slider');
		cgSlider.addEventListener('input', (e) => {
			e.stopPropagation();
			const newRate = (baseRate * +e.target.value).toFixed(1);
			cgBtn.textContent = `FLAT ${newRate}%`;
			updateRevRate('capitalGainsTax', +e.target.value);
		});
	} else {
		cgRow.innerHTML = `
			<span class="rev-label" title="${cgR.label}" style="cursor:pointer">${cgR.label}</span>
			<button class="type-badge ${state.cgAsOrdinary?'badge-prog':'badge-flat'}">${state.cgAsOrdinary?'ORDINARY':'CAP GAINS'}</button>
			<input type="range" class="rev-slider" min="0" max="3" step="0.05" value="${cgR.rateMultiplier}">
			<span class="rev-amount" id="rev-amt-capitalGainsTax">${formatB(cgAmt)}</span>
			<span class="rev-pct" id="rev-pct-capitalGainsTax">${cgPct}%</span>
		`;
		
		const cgBtn = cgRow.querySelector('.type-badge');
		cgBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			toggleCG();
		});
		
		const cgSlider = cgRow.querySelector('.rev-slider');
		cgSlider.addEventListener('input', (e) => {
			e.stopPropagation();
			updateRevRate('capitalGainsTax', +e.target.value);
		});
	}
	
	body.appendChild(cgRow);
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

		const {incomeTax, payroll, cgTax, total, effRate} = calcStudentTax(s);
		const totalIncome = s.income + s.cgIncome;

		const card = document.createElement('div');
		card.className = `student-card ${status === 'risk' ? 'at-risk' : status === 'lost' ? 'job-lost' : ''}`;
		card.dataset.studentId = s.id;

		const statusLabel = status === 'ok' ? 'OK' : status === 'risk' ? 'AT RISK' : 'JOB LOST';
		const statusClass  = status === 'ok' ? 'status-ok' : status === 'risk' ? 'status-risk' : 'status-lost';

		card.innerHTML = `
			<span class="card-status ${statusClass}">${statusLabel}</span>
			<div class="card-name">${s.name}</div>
			<div class="card-income">${fmtMoney(totalIncome)}</div>
			<div class="card-tax">${fmtMoney(total)}</div>
			<div class="card-rate">${effRate.toFixed(1)}% eff. rate</div>
			<div class="card-dep">${s.dependsOn}</div>
			<div class="job-lost-overlay">JOB LOST</div>
		`;

		const indirect = indirectTooltip(s, status);
		const itLabel = state.revenue.individualIncomeTax.type === 'flat' ? 'Income tax (flat)' : 'Income tax (prog)';
		const ssLabel = state.revenue.socialSecurity.type === 'progressive' ? 'SS payroll (no cap)' : 'SS payroll (6.2%)';
		const medRate = (0.0145 * state.revenue.medicare.rateMultiplier * 100).toFixed(2);
		let tipLines = [
			`${itLabel}: ${fmtMoney(incomeTax)}`,
			`${ssLabel}: ${fmtMoney(payroll - (s.income * 0.0145 * state.revenue.medicare.rateMultiplier))} + Medicare ${medRate}%: ${fmtMoney(s.income * 0.0145 * state.revenue.medicare.rateMultiplier)}`,
		];
		if (s.cgIncome > 0) tipLines.push(`Capital gains tax: ${fmtMoney(cgTax)} (${state.cgAsOrdinary?'ordinary rates':'CG rates'})`);
		tipLines.push(`Total: ${fmtMoney(total)} | Eff. rate: ${effRate.toFixed(1)}%`);
		if (indirect) tipLines.push('', indirect);
		const tipText = tipLines.join('\n');

		card.addEventListener('mouseenter', (e) => showTooltip(e, tipText));
		card.addEventListener('mousemove', moveTooltip);
		card.addEventListener('mouseleave', hideTooltip);

		grid.appendChild(card);
	}

	document.getElementById('jobs-at-risk-count').textContent = atRisk;
	document.getElementById('jobs-lost-count').textContent = lost;
}

function renderDeficit() {
	const rev = calcTotalRevenue();
	const spend = calcTotalSpending();
	const gap = rev - spend;
	const change = gap - BASELINE_DEFICIT;

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

	document.getElementById('d-rev').textContent = formatB(rev);
	document.getElementById('d-spend').textContent = formatB(spend);
	document.getElementById('d-gap').textContent = (gap >= 0 ? '+' : '') + formatB(gap);

	document.getElementById('rev-total-display').textContent = formatB(rev);
	document.getElementById('spend-total-display').textContent = formatB(spend);

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
		if (key === 'individualIncomeTax' && r.type === 'progressive') {
			amt = calcIncomeTaxBracketRevenue();
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
