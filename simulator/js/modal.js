// ─── MODAL FUNCTIONS ────────────────────────────────────────────────────────

function showModal(key, type) {
	const info = type === 'revenue' ? revenueInfo[key] : spendingInfo[key];
	if (!info) return;
	
	document.getElementById('modal-title').textContent = info.title;
	document.getElementById('modal-description').textContent = info.description;
	document.getElementById('modal-stakeholders').textContent = info.stakeholders.map(s => '• ' + s).join('\n');
	document.getElementById('info-modal').classList.add('visible');
}

function showStudentReport(studentId) {
	const student = students.find(s => s.id === studentId);
	if (!student) return;
	
	const {incomeTax, payroll, cgTax, consumptionTax, total, effRate} = calcStudentTax(student);
	const totalIncome = student.income + student.cgIncome;
	const afterTaxIncome = totalIncome - total;
	const affordability = calcAffordability(afterTaxIncome);
	const monthlyIncome = afterTaxIncome / 12;
	
	let reportHTML = `
		<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.6">
			<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)">
				<div style="font-size:12px;font-weight:600;margin-bottom:4px">${student.name}</div>
				<div style="color:var(--muted)">${student.dependsOn}</div>
			</div>
			
			<div style="margin-bottom:12px">
				<div style="color:var(--blue);font-weight:600;margin-bottom:6px">INCOME</div>
				<div>Gross income: ${fmtMoney(totalIncome)}/year</div>
				<div>Monthly: ${fmtMoney(monthlyIncome)}</div>
			</div>
			
			<div style="margin-bottom:12px">
				<div style="color:var(--blue);font-weight:600;margin-bottom:6px">TAXES</div>
				<div>Income tax: ${fmtMoney(incomeTax)}</div>
				<div>Payroll tax: ${fmtMoney(payroll)}</div>
				${cgTax > 0 ? `<div>Capital gains tax: ${fmtMoney(cgTax)}</div>` : ''}
				${consumptionTax > 0 ? `<div>Excise & tariffs: ${fmtMoney(consumptionTax)}</div>` : ''}
				<div style="border-top:1px solid var(--border);padding-top:4px;margin-top:4px;font-weight:600">Total tax: ${fmtMoney(total)} (${effRate.toFixed(1)}% eff. rate)</div>
			</div>
			
			<div style="margin-bottom:12px">
				<div style="color:var(--blue);font-weight:600;margin-bottom:6px">MONTHLY BUDGET (${fmtMoney(monthlyIncome)}/month)</div>
				<div style="padding:6px;background:#1c2128;border-radius:3px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
					${Object.entries(affordability.items).map(([key, item]) => {
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
							travel: 'Travel'
						};
						const icon = item.canAfford ? '✓' : '✗';
						const color = item.canAfford ? 'var(--green)' : 'var(--red)';
						return `<div style="color:${color}"><span style="font-weight:600">${icon}</span> ${expenseNames[key]}: ${fmtMoney(item.monthly)}</div>`;
					}).join('')}
				</div>
			</div>
		</div>
	`;
	
	document.getElementById('modal-title').textContent = student.name + ' - Detailed Report';
	document.getElementById('modal-description').innerHTML = reportHTML;
	document.getElementById('modal-stakeholders').textContent = '';
	document.getElementById('info-modal').classList.add('visible');
}

function closeModal() {
	document.getElementById('info-modal').classList.remove('visible');
}

document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') closeModal();
});

document.getElementById('info-modal')?.addEventListener('click', (e) => {
	if (e.target.id === 'info-modal') closeModal();
});
