// Tutorial system for the budget simulator
let currentTutorialStep = 1;
const tutorialSteps = [
	{
		step: 1,
		title: "Revenue Sliders",
		text: "Use the sliders in the Revenue section to adjust tax rates. As you increase rates, the revenue collected increases. Watch how it affects the deficit!",
		targetSelector: "#revenue-panel",
		position: "right"
	},
	{
		step: 2,
		title: "Spending Cuts & Benefits",
		text: "In the Spending section, adjust spending on different programs. Cutting spending reduces the deficit. Each cut affects real people—see 'Jobs at risk' increase as you cut spending.",
		targetSelector: "#spending-panel",
		position: "left"
	},
	{
		step: 3,
		title: "The Deficit Gap",
		text: "This bar shows your deficit or surplus. When Revenue is less than Spending, you have a deficit (red). Notice the Social Security and Medicare deficits on the right—they're off-budget but still matter for long-term solvency.",
		targetSelector: ".deficit-main",
		position: "bottom"
	},
	{
		step: 4,
		title: "Student Impact Cards",
		text: "These cards show how your policy choices affect different Americans. Watch their tax burdens and employment status change. Your goal: balance the budget without causing too much harm to any income group.",
		targetSelector: "#jobs-grid",
		position: "top"
	},
	{
		step: 5,
		title: "The National Debt",
		text: "This shows America's total accumulated debt ($39.1T and growing). As long as you have a deficit, the national debt grows by that amount each year. A truly balanced budget stops the debt from growing.",
		targetSelector: "#national-debt-display",
		position: "left"
	},
	{
		step: 6,
		title: "Social Security & Medicare",
		text: "These programs run their own separate deficits (off-budget). SS collects $1.1T but pays $1.4T—the difference is a $251B deficit. Medicare HI faces a similar crisis. These trust funds can't borrow like the general budget, so they face harder choices.",
		targetSelector: "#ss-deficit-display",
		position: "left",
		parentSelector: "both"
	}
];

function startTutorial() {
	currentTutorialStep = 1;
	showTutorialStep(1);
}

function closeTutorial() {
	const overlay = document.getElementById('tutorial-overlay');
	overlay.classList.remove('active');
}

function tutorialNext() {
	if (currentTutorialStep < tutorialSteps.length) {
		showTutorialStep(currentTutorialStep + 1);
	} else {
		closeTutorial();
	}
}

function tutorialPrev() {
	if (currentTutorialStep > 1) {
		showTutorialStep(currentTutorialStep - 1);
	}
}

function goToStep(step) {
	if (step >= 1 && step <= tutorialSteps.length) {
		showTutorialStep(step);
	}
}

function showTutorialStep(stepNum) {
	currentTutorialStep = stepNum;
	const step = tutorialSteps[stepNum - 1];
	
	// Update text
	document.getElementById('tutorial-step').textContent = `Step ${stepNum} of ${tutorialSteps.length}`;
	document.getElementById('tutorial-title').textContent = step.title;
	document.getElementById('tutorial-text').textContent = step.text;
	
	// Update dots
	document.querySelectorAll('.dot').forEach((dot, idx) => {
		dot.classList.toggle('active', idx === stepNum - 1);
	});
	
	// Highlight target element
	let targetElement = null;
	
	if (step.parentSelector === 'both') {
		// For SS + Medicare: highlight both together
		const ssDiv = document.querySelector('#ss-deficit-display')?.closest('div[style*="text-align"]');
		const medDiv = document.querySelector('#medicare-deficit-display')?.closest('div[style*="text-align"]');
		if (ssDiv && medDiv) {
			// Create a virtual element that encompasses both
			const ssRect = ssDiv.getBoundingClientRect();
			const medRect = medDiv.getBoundingClientRect();
			targetElement = {
				getBoundingClientRect: () => ({
					top: Math.min(ssRect.top, medRect.top),
					left: Math.min(ssRect.left, medRect.left),
					right: Math.max(ssRect.right, medRect.right),
					bottom: Math.max(ssRect.bottom, medRect.bottom),
					width: Math.max(ssRect.right, medRect.right) - Math.min(ssRect.left, medRect.left),
					height: Math.max(ssRect.bottom, medRect.bottom) - Math.min(ssRect.top, medRect.top)
				})
			};
		}
	} else if (step.parentSelector === true) {
		// For jobs: highlight the parent container
		const element = document.querySelector(step.targetSelector);
		if (element) {
			targetElement = element.closest('div[style*="text-align"]');
		}
	} else {
		// Normal highlight
		targetElement = document.querySelector(step.targetSelector);
	}
	
	if (targetElement) {
		highlightElement(targetElement, step.position);
	}
	
	// Show overlay
	const overlay = document.getElementById('tutorial-overlay');
	overlay.classList.add('active');
	
	// Update button states
	const prevBtn = document.querySelector('.tutorial-btn-secondary');
	const nextBtn = document.querySelector('.tutorial-btn:not(.tutorial-btn-secondary)');
	prevBtn.disabled = stepNum === 1;
	nextBtn.textContent = stepNum === tutorialSteps.length ? 'Done →' : 'Next →';
}

function highlightElement(element, position = 'bottom') {
	const highlight = document.querySelector('.tutorial-highlight');
	const box = document.querySelector('.tutorial-box');
	
	const rect = element.getBoundingClientRect();
	const padding = 12;
	
	// Position highlight
	highlight.style.top = (rect.top - padding) + 'px';
	highlight.style.left = (rect.left - padding) + 'px';
	highlight.style.width = (rect.width + padding * 2) + 'px';
	highlight.style.height = (rect.height + padding * 2) + 'px';
	
	// Position tutorial box
	const boxHeight = 200; // approximate
	let boxTop, boxLeft;
	
	switch(position) {
		case 'right':
			boxLeft = rect.right + 30;
			boxTop = rect.top;
			break;
		case 'left':
			boxLeft = rect.left - 380;
			boxTop = rect.top;
			break;
		case 'bottom':
			boxLeft = (rect.left + rect.right) / 2 - 180;
			boxTop = rect.bottom + 30;
			break;
		case 'top':
		default:
			boxLeft = (rect.left + rect.right) / 2 - 180;
			boxTop = rect.top - boxHeight - 30;
	}
	
	// Constrain to viewport
	if (boxLeft < 10) boxLeft = 10;
	if (boxLeft + 360 > window.innerWidth) boxLeft = window.innerWidth - 370;
	if (boxTop < 60) boxTop = 60;
	if (boxTop + boxHeight > window.innerHeight) boxTop = window.innerHeight - boxHeight - 10;
	
	box.style.left = boxLeft + 'px';
	box.style.top = boxTop + 'px';
}

// Reposition on window resize
window.addEventListener('resize', () => {
	if (document.getElementById('tutorial-overlay').classList.contains('active')) {
		const step = tutorialSteps[currentTutorialStep - 1];
		let targetElement = null;
		
		if (step.parentSelector === 'both') {
			const ssDiv = document.querySelector('#ss-deficit-display')?.closest('div[style*="text-align"]');
			const medDiv = document.querySelector('#medicare-deficit-display')?.closest('div[style*="text-align"]');
			if (ssDiv && medDiv) {
				const ssRect = ssDiv.getBoundingClientRect();
				const medRect = medDiv.getBoundingClientRect();
				targetElement = {
					getBoundingClientRect: () => ({
						top: Math.min(ssRect.top, medRect.top),
						left: Math.min(ssRect.left, medRect.left),
						right: Math.max(ssRect.right, medRect.right),
						bottom: Math.max(ssRect.bottom, medRect.bottom),
						width: Math.max(ssRect.right, medRect.right) - Math.min(ssRect.left, medRect.left),
						height: Math.max(ssRect.bottom, medRect.bottom) - Math.min(ssRect.top, medRect.top)
					})
				};
			}
		} else if (step.parentSelector === true) {
			const element = document.querySelector(step.targetSelector);
			if (element) {
				targetElement = element.closest('div[style*="text-align"]');
			}
		} else {
			targetElement = document.querySelector(step.targetSelector);
		}
		
		if (targetElement) {
			highlightElement(targetElement, step.position);
		}
	}
});
