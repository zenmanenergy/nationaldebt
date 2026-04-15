// ─── MODAL FUNCTIONS ────────────────────────────────────────────────────────

function showModal(key, type) {
	const info = type === 'revenue' ? revenueInfo[key] : spendingInfo[key];
	if (!info) return;
	
	document.getElementById('modal-title').textContent = info.title;
	document.getElementById('modal-description').textContent = info.description;
	document.getElementById('modal-stakeholders').textContent = info.stakeholders.map(s => '• ' + s).join('\n');
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
