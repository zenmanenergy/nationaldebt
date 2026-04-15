// ─── TOOLTIP ────────────────────────────────────────────────────────────────

function showTooltip(e, text) {
	const t = document.getElementById('tooltip');
	t.textContent = text;
	t.classList.add('visible');
	moveTooltip(e);
}

function moveTooltip(e) {
	const t = document.getElementById('tooltip');
	t.style.left = (e.clientX + 12) + 'px';
	t.style.top = (e.clientY - 10) + 'px';
}

function hideTooltip() {
	document.getElementById('tooltip').classList.remove('visible');
}

function addDebtTooltips() {
	document.querySelectorAll('.locked-row').forEach(row => {
		row.addEventListener('mouseenter', (e) => showTooltip(e, 'Interest on the national debt cannot be directly cut — it can only decrease by running a surplus over multiple years, reducing the total debt principal.'));
		row.addEventListener('mousemove', moveTooltip);
		row.addEventListener('mouseleave', hideTooltip);
	});
}
