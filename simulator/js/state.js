// ─── CONSTANTS AND STATE ────────────────────────────────────────────────────

const BASELINE_REVENUE = 3485;
const BASELINE_SPENDING = 4619;
const BASELINE_DEFICIT = -1134;
const STANDARD_DEDUCTION = 14600;
const NATIONAL_DEBT = 39118; // $39.118 trillion as of 2026
const POVERTY_LEVEL_2025 = 14580; // Federal poverty guideline for single person (Norfolk, Virginia area)

// Monthly living expenses (Norfolk, Virginia area, 2025)
const MONTHLY_EXPENSES = {
	rent: 1321,           // Median monthly rent
	food: 350,            // USDA food plan for single adult
	utilities: 150,       // Avg electric, gas, water
	carPayment: 450,      // Avg vehicle loan
	gasoline: 175,        // Avg fuel costs
	carInsurance: 120,    // Auto insurance
	healthcare: 200,      // Health insurance + copays
	clothing: 75,         // Basic clothing budget
	travel: 150,          // Entertainment, misc travel
};

const HOMEOWNERSHIP = {
	medianPrice: 289900,
	downPaymentPct: 0.20,
	loanTerm: 360,        // 30 years in months
	interestRate: 0.065,  // 6.5% mortgage rate
};

const brackets2025 = [
	{min:0,       max:11600,   rate:0.10,  label:'10%'},
	{min:11600,   max:47150,   rate:0.12,  label:'12%'},
	{min:47150,   max:100525,  rate:0.22,  label:'22%'},
	{min:100525,  max:191950,  rate:0.24,  label:'24%'},
	{min:191950,  max:243725,  rate:0.32,  label:'32%'},
	{min:243725,  max:609350,  rate:0.35,  label:'35%'},
	{min:609350,  max:2500000, rate:0.37,  label:'37%'},
	{min:2500000, max:5000000, rate:0.37,  label:'37% (Ultra High)'},
	{min:5000000, max:10000000,rate:0.37,  label:'37% (Super Rich)'},
	{min:10000000,max:Infinity,rate:0.37,  label:'37% (Ultra Wealthy)'},
];

const cgRates = [
	{min:0,       max:47025,   rate:0.00},
	{min:47025,   max:518900,  rate:0.15},
	{min:518900,  max:Infinity,rate:0.20},
];

const progressiveMultipliers = {
	socialSecurity: 1.35,
	medicare:       1.10,
	corporateIncomeTax: 1.15,
	exciseTax:      0.92,
	customsTariffs: 0.95,
};

const flatTaxMultipliers = {
	individualIncomeTax: 0.87,
	estateGiftTax:      0.82,
};

const revenueInfo = {
	individualIncomeTax: {
		title: 'Individual Income Tax',
		description: 'The progressive federal income tax on personal earnings. Uses tax brackets where higher earners pay higher rates. Withheld from paychecks.',
		stakeholders: ['All workers', 'Self-employed individuals', 'Investors', 'Retirees']
	},
	socialSecurity: {
		title: 'Payroll — Social Security (Off-Budget)',
		description: 'The 6.2% employee payroll tax (capped at $168,600 in 2025 wages). Dedicated FICA tax that funds Social Security benefits. Does NOT affect the deficit.',
		stakeholders: ['All workers', 'Self-employed', 'Future retirees', 'Disability beneficiaries']
	},
	medicare: {
		title: 'Payroll — Medicare (Off-Budget)',
		description: 'The 2.9% employee payroll tax on all wages (no cap). Funds Medicare for seniors. Does NOT affect the deficit.',
		stakeholders: ['All workers', 'Self-employed', 'Medicare beneficiaries (age 65+)', 'Hospitals and doctors']
	},
	corporateIncomeTax: {
		title: 'Corporate Income Tax',
		description: 'The 21% federal tax on corporate profits. Affects business investment decisions and is often passed to shareholders or consumers.',
		stakeholders: ['Corporations', 'Shareholders', 'Employees', 'Consumers']
	},
	exciseTax: {
		title: 'Excise Taxes',
		description: 'Targeted consumption taxes on specific goods like gasoline, alcohol, tobacco, and airlines. Creates price increases for consumers.',
		stakeholders: ['Consumers of fuel, alcohol, tobacco', 'Airlines', 'Gun owners']
	},
	estateGiftTax: {
		title: 'Estate & Gift Tax',
		description: 'Tax on large inheritances and gifts. Only affects the wealthiest families (exemption ~$13.61M per person in 2025). Progressive rate structure.',
		stakeholders: ['Wealthy families', 'Estate planners', 'Heirs', 'Tax attorneys']
	},
	customsTariffs: {
		title: 'Customs / Tariffs',
		description: 'Taxes on imported goods. Can protect domestic industries but typically raise prices for consumers who buy imported products.',
		stakeholders: ['Importers', 'Consumers', 'Domestic manufacturers', 'Retailers']
	},
	otherRevenue: {
		title: 'Other Revenue',
		description: 'Misc federal revenue including federal fees, national park entrance fees, patent office fees, and other government service charges.',
		stakeholders: ['Users of federal services', 'Patent applicants', 'National park visitors']
	},
	capitalGainsTax: {
		title: 'Capital Gains Tax',
		description: 'Tax on investment profits. Long-term gains (investments held 1+ year) use preferential lower rates. Short-term gains taxed as ordinary income.',
		stakeholders: ['Investors', 'Stock traders', 'Real estate sellers', 'Mutual fund holders']
	}
};

const spendingInfo = {
	defensePersonnel: {
		title: 'Active Military Personnel',
		description: 'Salaries and wages for active duty military members. Affects military recruitment and force readiness.',
		stakeholders: ['Military members', 'Military families', 'Defense contractors', 'Veterans']
	},
	defenseOps: {
		title: 'Operations & Maintenance',
		description: 'Funding for military operations, training, equipment maintenance, and daily operations. Critical for readiness.',
		stakeholders: ['Military personnel', 'Defense contractors', 'Communities near bases', 'Veterans']
	},
	defenseWeapons: {
		title: 'Weapons Procurement',
		description: 'Purchases of new weapons systems, aircraft, ships, and military equipment. Affects defense contractors and manufacturing jobs.',
		stakeholders: ['Defense manufacturers', 'Manufacturing workers', 'Military', 'Tech companies']
	},
	defenseRD: {
		title: 'Military R&D',
		description: 'Research and development for new military technologies. Impacts innovation and advanced manufacturing.',
		stakeholders: ['Defense contractors', 'Scientists and engineers', 'Tech companies', 'Universities']
	},
	veteransBenefits: {
		title: 'Veterans Benefits',
		description: 'Pensions, healthcare, disability payments, and education benefits for veterans. Direct support to military families.',
		stakeholders: ['Veterans', 'Veteran families', 'Disabled veterans', 'Medical providers']
	},
	medicaid: {
		title: 'Medicaid',
		description: 'Healthcare program for low-income individuals and families. State-administered but partially federally funded. Covers millions of Americans.',
		stakeholders: ['Low-income individuals', 'Families earning <$35k', 'Healthcare providers', 'Hospitals', 'Pharmacies']
	},
	acaChip: {
		title: 'ACA Subsidies & CHIP',
		description: 'Premium subsidies for individuals buying health insurance through healthcare.gov, plus CHIP (Children\'s Health) for low-income kids.',
		stakeholders: ['Uninsured individuals', 'Low-income families', 'Insurance companies', 'Children']
	},
	eduK12: {
		title: 'K-12 Federal Funding',
		description: 'Grants to states and districts for K-12 education. Funds teacher salaries, facilities, and special education.',
		stakeholders: ['Teachers', 'K-12 students', 'School districts', 'School staff']
	},
	eduPell: {
		title: 'Pell Grants & Higher Ed',
		description: 'Grants and loans for college students who demonstrate financial need. Makes college more affordable for lower-income students.',
		stakeholders: ['College students', 'Universities', 'Student loan borrowers', 'Education companies']
	},
	infraHighway: {
		title: 'Highway & Road Funding',
		description: 'Funding for interstate highways,roads, and bridges. Supports construction jobs and transportation infrastructure.',
		stakeholders: ['Construction workers', 'Trucking industry', 'Commuters', 'States and cities']
	},
	sciNASA: {
		title: 'NASA',
		description: 'Space exploration and research agency. Supports advances in space technology and scientific discovery.',
		stakeholders: ['NASA employees', 'Scientists', 'Contractors', 'Innovation sector']
	},
	intlEcon: {
		title: 'Foreign Economic Aid',
		description: 'Development assistance to foreign countries. Supports US diplomatic goals and economic development overseas.',
		stakeholders: ['Developing nations', 'US companies abroad', 'NGOs', 'Foreign partners']
	},
	govCourts: {
		title: 'Federal Courts & Justice',
		description: 'Funding for federal courts, judges, prosecutors, and public defenders. Maintains the judicial system.',
		stakeholders: ['Judges', 'Lawyers', 'Court staff', 'Justice system users']
	},
	debtPublic: {
		title: 'Interest — Public Debt',
		description: 'Interest payments on federal debt held by the public (individuals, corporations, foreign governments). The largest growing budget item.',
		stakeholders: ['Bond investors', 'Foreign governments', 'Retirees', 'Financial markets']
	},
	debtIntra: {
		title: 'Interest — Intragovernmental',
		description: 'Interest paid on Treasury securities held by federal trust funds (Social Security, Medicare, retirement funds). Money transferred between government accounts.',
		stakeholders: ['Social Security Trust Fund', 'Medicare Trust Fund', 'Federal employee pensions', 'Trust fund beneficiaries']
	},
	medicare: {
		title: 'Medicare',
		description: 'Federal health insurance program for seniors 65+ and some disabled individuals. Covers hospital (Part A), medical services (Part B), and drugs (Part D).',
		stakeholders: ['Seniors (65+)', 'Disabled individuals', 'Hospitals', 'Doctors and clinics', 'Pharmacies']
	},
	ssRetirement: {
		title: 'Social Security — Retirement Benefits',
		description: 'Monthly payments to retired workers age 62+. Benefits based on earnings history and age at claim. Funded by payroll taxes (FICA), not income taxes.',
		stakeholders: ['Retirees', 'Older workers', 'Spouses and survivors', 'Disabled beneficiaries']
	},
	ssDisability: {
		title: 'Social Security — Disability Benefits',
		description: 'Monthly payments to workers unable to work due to medical condition expected to last 12+ months. Funded by FICA payroll taxes.',
		stakeholders: ['Disabled workers', 'Low-income workers', 'Workers with chronic conditions', 'Families of disabled workers']
	},
	ssSurvivor: {
		title: 'Social Security — Survivor Benefits',
		description: 'Monthly payments to widow(er)s, children, and dependents of deceased workers. Provides financial security to dependent families.',
		stakeholders: ['Widows and widowers', 'Children of deceased workers', 'Dependent parents', 'Families']
	},
	eduSpecial: {
		title: 'Special Education (IDEA)',
		description: 'Funding for special education services required by the Individuals with Disabilities Education Act. Supports services for K-12 students with disabilities.',
		stakeholders: ['Students with disabilities', 'Teachers', 'School districts', 'Special education providers']
	},
	infraTransit: {
		title: 'Public Transit & Rail',
		description: 'Federal funding for public buses, subways, light rail, and Amtrak. Supports urban transportation and reduces congestion.',
		stakeholders: ['Transit riders', 'Public transit agencies', 'Construction workers', 'Urban commuters']
	},
	infraAirport: {
		title: 'Airports & Aviation',
		description: 'Federal funding for airport infrastructure, air traffic control, and aviation safety. Supports commercial and general aviation.',
		stakeholders: ['Airlines', 'Airport workers', 'Travelers', 'Aviation companies']
	},
	infraWater: {
		title: 'Water Infrastructure',
		description: 'Federal grants for clean water systems, wastewater treatment, and water pipe replacement. Supports public health and environmental protection.',
		stakeholders: ['Water utility companies', 'Municipalities', 'Construction workers', 'Water consumers']
	},
	sciNIH: {
		title: 'National Institutes of Health',
		description: 'Medical research funding for disease prevention and treatment. Supports grants to universities, hospital labs, and research institutions.',
		stakeholders: ['Medical researchers', 'Universities', 'Hospitals', 'Patients with diseases']
	},
	sciEPA: {
		title: 'EPA & Environment',
		description: 'Environmental protection, pollution control, and climate monitoring. Enforces clean air and water regulations.',
		stakeholders: ['Environmental agencies', 'States and cities', 'Environmentalists', 'Public health']
	},
	intlDiplo: {
		title: 'Diplomatic & State Department',
		description: 'Funding for US embassies, diplomatic staff, and international relations. Supports US foreign policy and presence abroad.',
		stakeholders: ['State Department employees', 'US embassies', 'Foreign partners', 'International relations']
	},
	intlSec: {
		title: 'International Security',
		description: 'Military and security assistance to foreign allies. Supports defense partnerships and international stability.',
		stakeholders: ['Foreign governments', 'US military', 'Allied nations', 'International security']
	},
	govIRS: {
		title: 'IRS & Tax Collection',
		description: 'Funding for the Internal Revenue Service to administer and collect federal taxes. Provides audits, enforcement, and taxpayer services.',
		stakeholders: ['IRS employees', 'Taxpayers', 'Tax preparers', 'Tax compliance']
	},
	govCongress: {
		title: 'Congress & Executive',
		description: 'Salaries and operations for Congress members, Senate, House, and executive branch staff. Funds legislative and presidential operations.',
		stakeholders: ['Congress members', 'Congressional staff', 'Executive staff', 'Government employees']
	},
	govGSA: {
		title: 'General Services Administration',
		description: 'Federal building management, federal vehicle fleet, and supplies. Supports day-to-day operations of federal agencies and properties.',
		stakeholders: ['Federal employees', 'Facility workers', 'Government contractors', 'Agencies']
	},
	govOther: {
		title: 'Other Federal Agencies',
		description: 'Funding for various federal agencies including OSHA, SSA, USDA, Commerce, Labor, and others. Supports diverse government functions.',
		stakeholders: ['Federal agencies', 'Agency employees', 'Program beneficiaries', 'Regulated industries']
	}
};

const state = {
	revenue: {
		individualIncomeTax: {label:'Individual Income Tax', baseAmount:2450, amount:2450, rateMultiplier:1.0, type:'progressive', minRate:0.5, maxRate:2.0, step:0.05},
		socialSecurity:      {label:'Payroll — Social Security', baseAmount:1125, amount:1125, rateMultiplier:1.0, type:'flat', minRate:0.5, maxRate:2.0, step:0.05},
		medicare:            {label:'Payroll — Medicare', baseAmount:410, amount:410, rateMultiplier:1.0, type:'flat', minRate:0.5, maxRate:2.0, step:0.05},
		corporateIncomeTax:  {label:'Corporate Income Tax', baseAmount:540, amount:540, rateMultiplier:1.0, type:'flat', minRate:0.5, maxRate:2.0, step:0.05},
		exciseTax:           {label:'Excise Taxes', baseAmount:92, amount:92, rateMultiplier:1.0, type:'flat', minRate:0.5, maxRate:2.0, step:0.05},
		estateGiftTax:       {label:'Estate & Gift Tax', baseAmount:36, amount:36, rateMultiplier:1.0, type:'progressive', minRate:0.5, maxRate:2.0, step:0.05},
		customsTariffs:      {label:'Customs / Tariffs', baseAmount:77, amount:77, rateMultiplier:1.0, type:'flat', minRate:0.5, maxRate:2.0, step:0.05},
		otherRevenue:        {label:'Other Revenue', baseAmount:170, amount:170, rateMultiplier:1.0, type:'flat', minRate:0.5, maxRate:2.0, step:0.05},
		capitalGainsTax:     {label:'Capital Gains Tax', baseAmount:120, amount:120, rateMultiplier:1.0, type:'flat', minRate:0.5, maxRate:2.0, step:0.05},
	},
	spending: {
		defense: {
			label:'Defense & Military', icon:'🪖', color:'defense', collapsed:false,
			items:{
				defensePersonnel:  {label:'Active Military Personnel', amount:241, baseline:241, jobKey:'militaryPersonnel'},
				defenseOps:        {label:'Operations & Maintenance', amount:375, baseline:375, jobKey:'defenseOps'},
				defenseWeapons:    {label:'Weapons Procurement', amount:228, baseline:228, jobKey:null},
				defenseRD:         {label:'Military R&D', amount:174, baseline:174, jobKey:null},
				veteransBenefits:  {label:'Veterans Benefits', amount:150, baseline:150, jobKey:null},
			}
		},
		health: {
			label:'Health Programs', icon:'🏥', color:'health', collapsed:false,
			items:{
				medicare:   {label:'Medicare', amount:790, baseline:790, jobKey:'medicare'},
				medicaid:   {label:'Medicaid', amount:789, baseline:789, jobKey:'medicaid'},
				acaChip:    {label:'ACA Subsidies & CHIP', amount:334, baseline:334, jobKey:null},
			}
		},
		social: {
			label:'Social Security', icon:'👴', color:'social', collapsed:false,
			items:{
				ssRetirement: {label:'Retirement Benefits', amount:1010, baseline:1010, jobKey:null},
				ssDisability: {label:'Disability Benefits', amount:238, baseline:238, jobKey:null},
				ssSurvivor:   {label:'Survivor Benefits', amount:128, baseline:128, jobKey:null},
			}
		},
		education: {
			label:'Education', icon:'🏫', color:'edu', collapsed:false,
			items:{
				eduK12:     {label:'K-12 Federal Funding', amount:54, baseline:54, jobKey:'education'},
				eduPell:    {label:'Pell Grants & Higher Ed', amount:39, baseline:39, jobKey:null},
				eduSpecial: {label:'Special Education (IDEA)', amount:26, baseline:26, jobKey:null},
			}
		},
		infrastructure: {
			label:'Infrastructure & Transportation', icon:'🛣️', color:'infra', collapsed:true,
			items:{
				infraHighway: {label:'Highway & Road Funding', amount:80, baseline:80, jobKey:null},
				infraTransit: {label:'Public Transit & Rail', amount:33, baseline:33, jobKey:null},
				infraAirport: {label:'Airports & Aviation', amount:27, baseline:27, jobKey:null},
				infraWater:   {label:'Water Infrastructure', amount:13, baseline:13, jobKey:null},
			}
		},
		science: {
			label:'Science & Environment', icon:'🔬', color:'sci', collapsed:false,
			items:{
				sciNASA:  {label:'NASA', amount:34, baseline:34, jobKey:null},
				sciNIH:   {label:'NIH', amount:27, baseline:27, jobKey:null},
				sciEPA:   {label:'EPA & Environment', amount:19, baseline:19, jobKey:'sciEnv'},
			}
		},
		international: {
			label:'International & Foreign Aid', icon:'🌍', color:'intl', collapsed:true,
			items:{
				intlEcon:   {label:'Foreign Economic Aid', amount:47, baseline:47, jobKey:null},
				intlDiplo:  {label:'Diplomatic / State Dept', amount:38, baseline:38, jobKey:null},
				intlSec:    {label:'International Security', amount:20, baseline:20, jobKey:null},
			}
		},
		government: {
			label:'Government Operations', icon:'🏛️', color:'gov', collapsed:true,
			items:{
				govIRS:     {label:'IRS & Tax Collection', amount:19, baseline:19, jobKey:null},
				govCourts:  {label:'Federal Courts & Justice', amount:54, baseline:54, jobKey:null},
				govCongress:{label:'Congress & Executive', amount:13, baseline:13, jobKey:null},
				govGSA:     {label:'General Services Admin', amount:48, baseline:48, jobKey:null},
				govOther:   {label:'Other Federal Agencies', amount:67, baseline:67, jobKey:null},
			}
		},
		debt: {
			label:'Interest on National Debt', icon:'💸', color:'gov', collapsed:false,
			locked:true,
			items:{
				debtPublic: {label:'Interest — Public Debt', amount:1315, baseline:1315, locked:true},
				debtIntra:  {label:'Interest — Intragovernmental', amount:355, baseline:355, locked:true},
			}
		},
	},
	cgAsOrdinary: false,
	flatTaxRates: {
		individualIncomeTax: 18,
		socialSecurity: 6.2,
		medicare: 2.9,
		corporateIncomeTax: 21,
		exciseTax: 11,
		estateGiftTax: 40,
		customsTariffs: 4,
		otherRevenue: 2,
		capitalGainsTax: 15,
	},
	customBracketRates: [
		// incomeMass = billions of taxable income at this marginal rate (2025 IRS SOI estimates)
		// default rates * masses sum to ~$2,450B matching BASELINE_REVENUE for individual income tax
		{rate: 0.10, min: 0,        max: 11600,   incomeMass: 1400,  label: '$0 - $11.6K'},
		{rate: 0.12, min: 11600,    max: 47150,   incomeMass: 4435,  label: '$11.6K - $47.2K'},
		{rate: 0.22, min: 47150,    max: 100525,  incomeMass: 2451,  label: '$47.2K - $100.5K'},
		{rate: 0.24, min: 100525,   max: 191950,  incomeMass: 1400,  label: '$100.5K - $192K'},
		{rate: 0.32, min: 191950,   max: 243725,  incomeMass: 467,   label: '$192K - $243.7K'},
		{rate: 0.35, min: 243725,   max: 609350,  incomeMass: 759,   label: '$243.7K - $609.4K'},
		{rate: 0.37, min: 609350,   max: 2500000, incomeMass: 607,   label: '$609K - $2.5M'},
		{rate: 0.37, min: 2500000,  max: 5000000, incomeMass: 245,   label: '$2.5M - $5M'},
		{rate: 0.37, min: 5000000,  max: 10000000,incomeMass: 152,   label: '$5M - $10M'},
		{rate: 0.37, min: 10000000, max: Infinity, incomeMass: 315,  label: '$10M+'},
	],
	bracketsExpandedMap: {},
	taxBrackets: {
		// masses calibrated so sum(mass * defaultRate) = baseAmount for each tax
		socialSecurity: [
			// progressive version removes wage cap and allows higher rates on top earners
			{rate:0.062, incomeMass:1100,  label:'$0 - $30K wages'},
			{rate:0.062, incomeMass:3200,  label:'$30K - $75K wages'},
			{rate:0.062, incomeMass:2900,  label:'$75K - $168.6K wages (cap)'},
			{rate:0.062, incomeMass:3245,  label:'$168.6K - $400K wages'},
			{rate:0.062, incomeMass:2900,  label:'$400K - $1M wages'},
			{rate:0.062, incomeMass:4800,  label:'$1M+ wages'},
		],
		medicare: [
			// progressive version allows surtax tiers on high earners
			{rate:0.029, incomeMass:2000,  label:'$0 - $50K wages'},
			{rate:0.029, incomeMass:3500,  label:'$50K - $150K wages'},
			{rate:0.029, incomeMass:2800,  label:'$150K - $400K wages'},
			{rate:0.029, incomeMass:2500,  label:'$400K - $1M wages'},
			{rate:0.029, incomeMass:1800,  label:'$1M - $5M wages'},
			{rate:0.029, incomeMass:1538,  label:'$5M+ wages'},
		],
		corporateIncomeTax: [
			// by corporate profit tier, masses calibrated to sum to $2,571B at 21% = $540B
			{rate:0.21, incomeMass:150,   label:'< $1M profit (small biz)'},
			{rate:0.21, incomeMass:300,   label:'$1M - $10M profit'},
			{rate:0.21, incomeMass:450,   label:'$10M - $100M profit'},
			{rate:0.21, incomeMass:600,   label:'$100M - $1B profit'},
			{rate:0.21, incomeMass:1071,  label:'$1B+ profit (mega corp)'},
		],
		exciseTax: [
			// by product category, masses calibrated to $836B at 11% = $92B
			{rate:0.11, incomeMass:280,   label:'Fuel & energy'},
			{rate:0.11, incomeMass:120,   label:'Alcohol & tobacco'},
			{rate:0.11, incomeMass:100,   label:'Aviation & transport'},
			{rate:0.11, incomeMass:180,   label:'Telecom'},
			{rate:0.11, incomeMass:156,   label:'Other goods'},
		],
		estateGiftTax: [
			// by estate value over exemption, masses calibrated to $90B at 40% = $36B
			{rate:0.40, incomeMass:15,    label:'< $1M over exemption'},
			{rate:0.40, incomeMass:18,    label:'$1M - $5M over exemption'},
			{rate:0.40, incomeMass:22,    label:'$5M - $20M over exemption'},
			{rate:0.40, incomeMass:20,    label:'$20M - $100M over exemption'},
			{rate:0.40, incomeMass:15,    label:'$100M+ over exemption'},
		],
		customsTariffs: [
			// by import category, masses calibrated to $1,925B at 4% = $77B
			{rate:0.04, incomeMass:300,   label:'Low-value consumer goods'},
			{rate:0.04, incomeMass:500,   label:'Consumer electronics & apparel'},
			{rate:0.04, incomeMass:525,   label:'Industrial equipment'},
			{rate:0.04, incomeMass:350,   label:'Vehicles & auto parts'},
			{rate:0.04, incomeMass:250,   label:'Agricultural & food'},
		],
		otherRevenue: [
			// by fee/charge type, masses calibrated to $8,500B at 2% = $170B
			{rate:0.02, incomeMass:1200,  label:'Federal fees & licenses'},
			{rate:0.02, incomeMass:1800,  label:'Fines & penalties'},
			{rate:0.02, incomeMass:2200,  label:'Federal enterprise revenue'},
			{rate:0.02, incomeMass:1600,  label:'Rents & royalties (public land)'},
			{rate:0.02, incomeMass:1700,  label:'Miscellaneous receipts'},
		],
		capitalGainsTax: [
			// by gain size tier, calibrated to $800B at 15% = $120B
			{rate:0.00, incomeMass:400,   label:'$0 - $47K gains (0% tier)'},
			{rate:0.15, incomeMass:260,   label:'$47K - $518.9K gains'},
			{rate:0.15, incomeMass:90,    label:'$518.9K - $2M gains'},
			{rate:0.20, incomeMass:30,    label:'$2M - $10M gains'},
			{rate:0.20, incomeMass:20,    label:'$10M+ gains'},
		],
	},
};

const students = [
	{id:1,  name:'Part-time Retail Worker',  income:22000,      sector:'private', dependsOn:'Medicaid',                  depKey:'medicaid',    cgIncome:0},
	{id:2,  name:'Warehouse Worker',          income:38000,      sector:'private', dependsOn:'Medicaid',                  depKey:'medicaid',    cgIncome:0},
	{id:3,  name:'Public School Teacher',    income:54000,      sector:'private', dependsOn:'Federal Education (indirect)',depKey:'education',  cgIncome:0},
	{id:4,  name:'Registered Nurse',          income:85000,      sector:'private', dependsOn:'Medicare/Medicaid',         depKey:'nurse',       cgIncome:0},
	{id:5,  name:'Software Engineer',         income:140000,     sector:'private', dependsOn:'None',                      depKey:null,          cgIncome:0},
	{id:6,  name:'Physician',                 income:320000,     sector:'private', dependsOn:'Medicare/Medicaid',         depKey:'nurse',       cgIncome:0},
	{id:7,  name:'Business Owner',            income:900000,     sector:'private', dependsOn:'General Economy',           depKey:null,          cgIncome:0},
	{id:8,  name:'Hedge Fund Manager',        income:0,          sector:'private', dependsOn:'Capital gains rates',       depKey:null,          cgIncome:4000000},
	{id:9,  name:'Billionaire',               income:0,          sector:'private', dependsOn:'Capital gains / wealth',    depKey:null,          cgIncome:3000000000},
	{id:10, name:'Military Contractor',       income:48000,      sector:'govt',    dependsOn:'Defense — Ops & Maint.',    depKey:'defenseOps',  cgIncome:0},
	{id:11, name:'Medicaid Caseworker',       income:42000,      sector:'govt',    dependsOn:'Medicaid',                  depKey:'medicaid',    cgIncome:0},
	{id:12, name:'National Park Ranger',      income:36000,      sector:'govt',    dependsOn:'Science & Environment',     depKey:'sciEnv',      cgIncome:0},
];
