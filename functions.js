'use strict';

/*
 * ППО калкулатор — Раздел I: гасене на твърди горими вещества с вода.
 * Методика, Приложение № 5 — формули 1–23.
 *
 * Изчислителното ядро е огледало на React приложението (ppo-calc), файлове
 * app/src/calc/{types,helpers,sectionI}.ts. Смята се ВЕДНЪЖ: calcSectionI()
 * връща { results, steps, warnings }, а renderHtml() пише форматирания отчет
 * в дясната колона (#report).
 *
 * Правила (спазвай ги при промени):
 *   - Ядрото не пипа DOM. Формите се четат само в readInput().
 *   - Не се закръглява при смятане. Закръгляне само за показване, чрез fmt().
 *   - Math.ceil() се прилага само за БРОЙКИ (струйници, екипи, автомобили).
 *   - Полетата се четат по ИМЕ, никога по elements[индекс].
 *   - calcSectionI / fireDevelopment / readInput / calc / area_* са function
 *     declarations нарочно: така остават свойства на глобалния обект и са
 *     достъпни от inline onclick в браузъра и от диференциалните тестове.
 */

/* ------------------------------------------------------------------ */
/* Константи и форматиране (types.ts)                                  */
/* ------------------------------------------------------------------ */

/** π според указанията. */
const PI = 3.14;

/** Закръгляне нагоре до цяло — само за брой струйници/екипи/автомобили. */
const ceilCount = (x) => Math.ceil(x);

/** Закръгляне до зададен брой знаци. */
const roundTo = (x, digits = 0) => {
	const f = 10 ** digits;
	return Math.round(x * f) / f;
};

/** Форматира число за показване (маха излишните нули). */
const fmt = (x, digits = 2) => {
	const r = roundTo(x, digits);
	return Number.isFinite(r) ? String(r) : '—';
};

/* ------------------------------------------------------------------ */
/* Развитие на пожара (helpers.ts)                                     */
/* ------------------------------------------------------------------ */

/** Свободно време за развитие на пожара (формула 1). */
const freeTime = (t_ds, t_dv, t_r) => t_ds + t_dv + t_r;

/**
 * Площ на пожара F_п (формули 2–7) и радиус R_п.
 *
 * Пожарът се развива кръгово със скорост V_л. За първите 10 мин. нарастването
 * се отчита с коефициент 0.5. Когато фронтът достигне по-късата стена (a),
 * развитието става правоъгълно: F_п = n·a·V_л·(0.5·t₁ + t₂), n = 2.
 * Площта не може да надхвърли площта на помещението a·b.
 */
function fireDevelopment(t_sv, V, a, b) {
	const aMin = Math.min(a, b);
	const half = aMin / 2;
	const roomArea = a * b;

	const rFull = t_sv <= 10 ? 0.5 * V * t_sv : 0.5 * V * 10 + V * (t_sv - 10);

	if (rFull < half) {
		return { Fp: PI * rFull * rFull, R: rFull, mode: 'circle', cappedToRoom: false };
	}

	const rect = t_sv <= 10 ? 2 * aMin * (0.5 * V * t_sv) : 2 * aMin * V * (t_sv - 5);
	return {
		Fp: Math.min(rect, roomArea),
		R: half,
		mode: 'rect',
		cappedToRoom: rect >= roomArea,
	};
}

/**
 * Форми на гасене — редът съвпада с radio2 option1…option10 в index.html
 * и със SHAPES в app/src/ui/ShapeSelector.tsx.
 */
const SHAPES = [
	'front_a', 'front_b', 'two_aa', 'two_bb', 'two_ab',
	'three_aab', 'three_abb', 'perimeter', 'circle', 'whole',
];

const SHAPE_LABELS = {
	front_a: 'Едностранно по фронт a',
	front_b: 'Едностранно по фронт b',
	two_aa: 'Двустранно (по двата фронта a)',
	two_bb: 'Двустранно (по двата фронта b)',
	two_ab: 'Двустранно Г-образно (a + b)',
	three_aab: 'Тристранно (2a + b)',
	three_abb: 'Тристранно (2b + a)',
	perimeter: 'По периметъра (правоъгълник)',
	circle: 'По периметъра на кръг',
	whole: 'По цялата площ',
};

/**
 * Площ на гасене F_г (формули 8–13) за избраната форма.
 * h — дълбочина на гасене h_г (5 м. ръчни, 10 м. лафетни струйници).
 * Връща { Fg, text, html } — изразът се показва и в двата вида отчет.
 */
const extinguishArea = (shape, aMin, aMax, h, R, Fp) => {
	switch (shape) {
	case 'front_a':
		return {
			Fg: aMin * h,
			text: `Fг = a * hг = ${aMin} * ${h}`,
			html: `<i>F</i><sub>г</sub> = <i>a</i> * <i>h</i><sub>г</sub> = ${aMin} * ${h}`,
		};
	case 'front_b':
		return {
			Fg: aMax * h,
			text: `Fг = b * hг = ${aMax} * ${h}`,
			html: `<i>F</i><sub>г</sub> = <i>b</i> * <i>h</i><sub>г</sub> = ${aMax} * ${h}`,
		};
	case 'two_aa':
		return {
			Fg: 2 * aMin * h,
			text: `Fг = 2 * a * hг = 2 * ${aMin} * ${h}`,
			html: `<i>F</i><sub>г</sub> = 2 * <i>a</i> * <i>h</i><sub>г</sub> = 2 * ${aMin} * ${h}`,
		};
	case 'two_bb':
		return {
			Fg: 2 * aMax * h,
			text: `Fг = 2 * b * hг = 2 * ${aMax} * ${h}`,
			html: `<i>F</i><sub>г</sub> = 2 * <i>b</i> * <i>h</i><sub>г</sub> = 2 * ${aMax} * ${h}`,
		};
	case 'two_ab':
		return {
			Fg: h * (aMin + aMax - h),
			text: `Fг = hг * (a + b - hг) = ${h} * (${aMin} + ${aMax} - ${h})`,
			html: `<i>F</i><sub>г</sub> = <i>h</i><sub>г</sub> * (<i>a</i> + <i>b</i> - <i>h</i><sub>г</sub>) = ${h} * (${aMin} + ${aMax} - ${h})`,
		};
	case 'three_aab':
		return {
			Fg: h * (2 * aMin + aMax - 2 * h),
			text: `Fг = hг * (2 * a + b - 2 * hг) = ${h} * (2 * ${aMin} + ${aMax} - 2 * ${h})`,
			html: `<i>F</i><sub>г</sub> = <i>h</i><sub>г</sub> * (2 * <i>a</i> + <i>b</i> - 2 * <i>h</i><sub>г</sub>) = ${h} * (2 * ${aMin} + ${aMax} - 2 * ${h})`,
		};
	case 'three_abb':
		return {
			Fg: h * (2 * aMax + aMin - 2 * h),
			text: `Fг = hг * (2 * b + a - 2 * hг) = ${h} * (2 * ${aMax} + ${aMin} - 2 * ${h})`,
			html: `<i>F</i><sub>г</sub> = <i>h</i><sub>г</sub> * (2 * <i>b</i> + <i>a</i> - 2 * <i>h</i><sub>г</sub>) = ${h} * (2 * ${aMax} + ${aMin} - 2 * ${h})`,
		};
	case 'perimeter':
		return {
			Fg: 2 * h * (aMin + aMax - 2 * h),
			text: `Fг = 2 * hг * (a + b - 2 * hг) = 2 * ${h} * (${aMin} + ${aMax} - 2 * ${h})`,
			html: `<i>F</i><sub>г</sub> = 2 * <i>h</i><sub>г</sub> * (<i>a</i> + <i>b</i> - 2 * <i>h</i><sub>г</sub>) = 2 * ${h} * (${aMin} + ${aMax} - 2 * ${h})`,
		};
	case 'circle':
		return {
			Fg: PI * h * (2 * R - h),
			text: `Fг = 3.14 * hг * (2 * R - hг) = 3.14 * ${h} * (2 * ${fmt(R)} - ${h})`,
			html: `<i>F</i><sub>г</sub> = π * <i>h</i><sub>г</sub> * (2 * <i>R</i> - <i>h</i><sub>г</sub>) = 3.14 * ${h} * (2 * ${fmt(R)} - ${h})`,
		};
	case 'whole':
		return {
			Fg: Fp,
			text: `Fг = Fп = ${fmt(Fp)}`,
			html: `<i>F</i><sub>г</sub> = <i>F</i><sub>п</sub> = ${fmt(Fp)}`,
		};
	default:
		return { Fg: 0, text: '', html: '' };
	}
};

/* ------------------------------------------------------------------ */
/* Раздел I (sectionI.ts)                                              */
/* ------------------------------------------------------------------ */

/*
 * Струйници — означения и ключове както в React (app/src/calc/sectionI.ts):
 *   "B" — 7 л/с, един екип подава 2 бр.
 *   "C" — 3.5 л/с, един екип подава 4 бр.; и струйниците за защита са "C".
 */
const JET_FLOW = { B: 7, C: 3.5 };
/** Струйници, които подава един екип (пълен състав, 4 пожарникари). */
const TEAM_JETS = { B: 2, C: 4 };
/** Дебит на струйник за защита — струйник "C". */
const PROTECTION_JET_FLOW = 3.5;
/** Коефициент на използване на помпата (формула 23). */
const PUMP_FACTOR = 0.8;

const stHeading = (text) => ({ kind: 'heading', text });
const stNote = (text) => ({ kind: 'note', text });
const stMath = (text, html) => ({ kind: 'math', text, html });
const stResult = (label, value) => ({ kind: 'result', label, text: value });
const stDivider = () => ({ kind: 'divider' });

/**
 * Пълно изчисление за Раздел I.
 * inp: { t_ds, t_dv, t_r, V, a, b, I, shape, jet, hg, protectionJets, Qpa }
 * Връща { results, steps, warnings }.
 */
function calcSectionI(inp) {
	const steps = [];
	const warnings = [];

	const { t_ds, t_dv, t_r, V, a, b, I, shape, jet, hg, protectionJets: z, Qpa } = inp;
	const aMin = Math.min(a, b);
	const aMax = Math.max(a, b);

	/* --- 1. Свободно време за развитие (формула 1) --- */
	const t_sv = freeTime(t_ds, t_dv, t_r);
	steps.push(stHeading('1. Свободно време за развитие на пожара, τ<sub>св</sub>'));
	steps.push(stMath(
		'tсв = tдс + tдв + tр',
		'τ<sub>св</sub> = τ<sub>дс</sub> + τ<sub>дв</sub> + τ<sub>р</sub>'));
	steps.push(stMath(
		`tсв = ${t_ds} + ${t_dv} + ${t_r} = ${t_sv} (мин.)`,
		`τ<sub>св</sub> = ${t_ds} + ${t_dv} + ${t_r} = ${t_sv} (мин.)`));

	/* --- 2. Площ на пожара F_п (формули 2–7) --- */
	const dev = fireDevelopment(t_sv, V, a, b);
	steps.push(stHeading('2. Определяне площта на пожара, F<sub>п</sub>'));
	steps.push(stNote(`V<sub>л</sub> = ${V} (м/мин) — по Табл. № 1 от указанията.`));

	if (dev.mode === 'circle') {
		steps.push(stNote('Пожарът се развива кръгово.'));
		steps.push(stMath(
			'Fп = 3.14 * (0.5 * Vл * tсв)^2',
			'<i>F</i><sub>п</sub> = π * (0.5 * <i>V</i><sub>л</sub> * τ<sub>св</sub>)<sup>2</sup>'));
		steps.push(stMath(
			`Fп = 3.14 * (0.5 * ${V} * ${t_sv})^2 = ${fmt(dev.Fp)} (м<sup>2</sup>)`,
			`<i>F</i><sub>п</sub> = 3.14 * (0.5 * ${V} * ${t_sv})<sup>2</sup> = ${fmt(dev.Fp)} (м<sup>2</sup>)`));
	} else {
		steps.push(stNote('Фронтът достига по-късата стена — правоъгълно развитие.'));
		steps.push(stMath(
			'Fп = n * a * Vл * (0.5 * t1 + t2),  n = 2',
			'<i>F</i><sub>п</sub> = <i>n</i> * <i>a</i> * <i>V</i><sub>л</sub> * (0.5 * τ<sub>1</sub> + τ<sub>2</sub>), &nbsp;&nbsp;&nbsp;<i>n</i> = 2'));
		steps.push(stMath(
			`Fп = ${fmt(dev.Fp)} (м<sup>2</sup>)`,
			`<i>F</i><sub>п</sub> = ${fmt(dev.Fp)} (м<sup>2</sup>)`));
		if (dev.cappedToRoom) {
			steps.push(stNote(`Пожарът обхваща цялата площ на помещението: F<sub>общ</sub> = a * b = ${aMin} * ${aMax} = ${fmt(a * b)} (м<sup>2</sup>).`));
		}
	}
	steps.push(stResult('Площ на пожара F<sub>п</sub>', `${fmt(dev.Fp)} м<sup>2</sup>`));
	if (dev.mode === 'circle') {
		steps.push(stResult('Радиус на пожара R<sub>п</sub>', `${fmt(dev.R)} м.`));
	}

	/* --- 3. Площ на гасене F_г (формули 8–13) --- */
	const ea = extinguishArea(shape, aMin, aMax, hg, dev.R, dev.Fp);
	const Fg = ea.Fg;
	steps.push(stHeading('3. Определяне площта на гасене, F<sub>г</sub>'));
	steps.push(stNote(`Форма на гасене: ${SHAPE_LABELS[shape]}; h<sub>г</sub> = ${hg} м.`));
	if (shape !== 'whole') {
		steps.push(stMath(
			`${ea.text} = ${fmt(Fg)} (м<sup>2</sup>)`,
			`${ea.html} = ${fmt(Fg)} (м<sup>2</sup>)`));
	}
	steps.push(stResult('Площ на гасене F<sub>г</sub>', `${fmt(Fg)} м<sup>2</sup>`));

	/* --- 4. Необходим разход на вода Q_н^г (формули 14–16) --- */
	steps.push(stHeading('4. Необходим разход на вода за гасене, Q<sub>н</sub>'));
	steps.push(stNote(`I<sub>н</sub> = ${I} (л/с·м<sup>2</sup>) — по Табл. № 2 от указанията.`));
	let Qg;
	if (dev.Fp <= Fg) {
		/* формула 14 — когато F_п ≤ F_г */
		Qg = dev.Fp * I;
		steps.push(stNote('F<sub>п</sub> <= F<sub>г</sub> — гаси се по цялата площ на пожара.'));
		steps.push(stMath(
			'Qн = Fп * Iн',
			'<i>Q</i><sub>н</sub><sup>г</sup> = <i>F</i><sub>п</sub> * <i>I</i><sub>н</sub>'));
		steps.push(stMath(
			`Qн = ${fmt(dev.Fp)} * ${I} = ${fmt(Qg)} (л/с)`,
			`<i>Q</i><sub>н</sub><sup>г</sup> = ${fmt(dev.Fp)} * ${I} = ${fmt(Qg)} (л/с)`));
	} else {
		/* формула 15 — когато F_п > F_г */
		Qg = Fg * I;
		steps.push(stNote('F<sub>п</sub> > F<sub>г</sub> — гаси се по площта на гасене.'));
		steps.push(stMath(
			'Qн = Fг * Iн',
			'<i>Q</i><sub>н</sub><sup>г</sup> = <i>F</i><sub>г</sub> * <i>I</i><sub>н</sub>'));
		steps.push(stMath(
			`Q<sub>н</sub> = ${fmt(Fg)} * ${I} = ${fmt(Qg)} (л/с)`,
			`<i>Q</i><sub>н</sub><sup>г</sup> = ${fmt(Fg)} * ${I} = ${fmt(Qg)} (л/с)`));
	}
	steps.push(stResult('Разход за гасене Q<sub>н</sub>', `${fmt(Qg)} л/с`));

	/* --- 5. Брой струйници за гасене (формули 17–19) --- */
	const q = JET_FLOW[jet];
	const N_jets = ceilCount(Qg / q);
	steps.push(stHeading('5. Брой струйници за гасене, N<sub>стр</sub>'));
	steps.push(stNote(`Избран струйник тип "${jet}", q<sub>стр</sub> = ${q} (л/с).`));
	steps.push(stMath(
		'Nстр.г = Qн / qстр',
		'<i>N</i><sub>стр</sub><sup>г</sup> = <i>Q</i><sub>н</sub><sup>г</sup> / <i>q</i><sub>стр</sub>'));
	steps.push(stMath(
		`Nстр.г = ${fmt(Qg)} / ${q} = ${N_jets} струйника тип "${jet}"`,
		`<i>N</i><sub>стр</sub><sup>г</sup> = ${fmt(Qg)} / ${q} = ${N_jets} струйника тип "${jet}"`));

	const N_jets_total = N_jets + z;
	if (z > 0) {
		steps.push(stNote(`Струйници за защита: Nстр.з = ${z} (струйник "C", по ${PROTECTION_JET_FLOW} л/с).`));
		steps.push(stMath(
			'Nстр.об = Nстр.г + Nстр.з',
			'<i>N</i><sub>стр</sub><sup>об</sup> = <i>N</i><sub>стр</sub><sup>г</sup> + <i>N</i><sub>стр</sub><sup>з</sup>'));
		steps.push(stMath(
			`N<sub>стр.об</sub> = ${N_jets} + ${z} = ${N_jets_total} струйника`,
			`<i>N</i><sub>стр</sub><sup>об</sup> = ${N_jets} + ${z} = ${N_jets_total} струйника`));
	}

	/* --- 6. Брой екипи (формули 21, 22) --- */
	const n_team = TEAM_JETS[jet];
	const N_teams_g = ceilCount(N_jets / n_team);
	const N_teams_z = z > 0 ? ceilCount(z / TEAM_JETS.C) : 0;
	const N_teams = N_teams_g + N_teams_z;
	const N_personnel = N_teams * 4;
	steps.push(stHeading('6. Брой екипи за гасене, N<sub>екип</sub>'));
	steps.push(stNote(`Един екип (пълен състав, 4 пожарникари) подава n<sub>стр,екип</sub> = ${n_team} струйника тип "${jet}" (4 тип "C" или 2 тип "B").`));
	steps.push(stMath(
		'Nекип.г = Nстр.г / nстр,екип',
		'<i>N</i><sub>екип</sub><sup>г</sup> = <i>N</i><sub>стр</sub><sup>г</sup> / <i>n</i><sub>стр,екип</sub>'));
	steps.push(stMath(
		`Nекип.г = ${N_jets} / ${n_team} = ${N_teams_g} екип(а)`,
		`<i>N</i><sub>екип</sub><sup>г</sup> = ${N_jets} / ${n_team} = ${N_teams_g} екип(а)`));
	if (z > 0) {
		steps.push(stMath(
			`Nекип.з = ${z} / ${TEAM_JETS.C} = ${N_teams_z}`,
			`<i>N</i><sub>екип</sub><sup>з</sup> = ${z} / ${TEAM_JETS.C} = ${N_teams_z}`));
		steps.push(stMath(
			'Nекип = Nекип.г + Nекип.з',
			'<i>N</i><sub>екип</sub> = <i>N</i><sub>екип</sub><sup>г</sup> + <i>N</i><sub>екип</sub><sup>з</sup>'));
		steps.push(stMath(
			`Nекип = ${N_teams_g} + ${N_teams_z} = ${N_teams} екип(а)`,
			`<i>N</i><sub>екип</sub> = ${N_teams_g} + ${N_teams_z} = ${N_teams} екип(а)`));
	}
	steps.push(stMath(
		`Личен състав = 4 * ${N_teams} = ${N_personnel} пожарникари`,
		`Личен състав = 4 * ${N_teams} = ${N_personnel} пожарникари`));

	/* --- 7. Брой пожарни автомобили (формула 23) --- */
	let N_trucks = 0;
	steps.push(stHeading('7. Брой пожарни автомобили, N<sub>па</sub>'));
	if (Qpa > 0) {
		N_trucks = ceilCount(Qg / (PUMP_FACTOR * Qpa));
		steps.push(stNote(`Q<sub>па</sub> = ${fmt(Qpa)} л/с — дебит на помпата; използваемост ${PUMP_FACTOR} (${PUMP_FACTOR} * Q<sub>па</sub>).`));
		steps.push(stMath(
			'Nпа.г = Qн / (0.8 * Qпа)',
			'<i>N</i><sub>па</sub><sup>г</sup> = <i>Q</i><sub>н</sub><sup>г</sup> / (0.8 * <i>Q</i><sub>па</sub>)'));
		steps.push(stMath(
			`Nпа.г = ${fmt(Qg)} / (0.8 * ${fmt(Qpa)}) = ${N_trucks}`,
			`<i>N</i><sub>па</sub><sup>г</sup> = ${fmt(Qg)} / (0.8 * ${fmt(Qpa)}) = ${N_trucks}`));
	} else {
		warnings.push('Q<sub>па</sub> трябва да е положителен — въведете дебит на помпата, за да се изчисли броят автомобили.');
	}

	steps.push(stDivider()); // разделител преди обобщението на резултатите
	steps.push(stResult('Брой струйници (общо)', String(N_jets_total)));
	steps.push(stResult('Брой екипи', String(N_teams)));
	steps.push(stResult('Личен състав', String(N_personnel)));
	steps.push(stResult('Брой пожарни автомобили', String(N_trucks)));

	if (Fg <= 0) {
		warnings.push('Площта на гасене F<sub>г</sub> е нула или отрицателна за избраната форма и размери — проверете a, b и h<sub>г</sub>.');
	}

	return {
		results: {
			t_sv,
			Fp: dev.Fp,
			R: dev.R,
			Fg,
			Qg,
			N_jets,
			N_jets_total,
			N_trucks,
			N_teams_g,
			N_teams,
			N_personnel,
		},
		steps,
		warnings,
	};
}

/* ------------------------------------------------------------------ */
/* Четене на формата (по ИМЕ, не по индекс)                            */
/* ------------------------------------------------------------------ */

const num = (name) => {
	const v = parseFloat(document.ppo1[name]?.value ?? '');
	return Number.isNaN(v) ? 0 : v;
};

/** Коя форма на гасене е избрана — radio2 option1…option10 → SHAPES[0…9]. */
const shapeFromForm = () => {
	const idx = Array.from(document.ppo1.radio2).findIndex((el) => el.checked);
	return idx >= 0 ? SHAPES[idx] : 'whole';
};

/** Кой тип струйник е избран — падащо меню radio1 със стойности "B" (7 л/с) / "C" (3.5 л/с). */
const jetFromForm = () => (document.ppo1.radio1.value === 'B' ? 'B' : 'C');

function readInput() {
	return {
		t_ds: num('text0'),
		t_dv: num('text1'),
		t_r: num('text2'),
		V: num('text3'),
		a: num('text4'),
		b: num('text5'),
		I: num('text6'),
		protectionJets: num('text7'),
		hg: 5, // фиксирано: калкулаторът работи само с ръчни струйници (h_г = 5 m)
		Qpa: num('qpa'),
		shape: shapeFromForm(),
		jet: jetFromForm(),
	};
}

/* ------------------------------------------------------------------ */
/* Рендериране                                                         */
/* ------------------------------------------------------------------ */

/** Форматиран отчет — в дясната колона (#report) на същата страница. */
const renderHtml = (out) => {
	const body = out.steps.map((st) => {
		if (st.kind === 'heading') return `<h3>${st.text}</h3>`;
		if (st.kind === 'divider') return '<hr>';
		if (st.kind === 'result') return `<p class="res">${st.label}: ${st.text}</p>`;
		return `<p>${st.html || st.text}</p>`;
	}).join('');

	const warns = out.warnings.length
		? `<h3>Предупреждения</h3>${out.warnings.map((w) => `<p class="warn">${w}</p>`).join('')}`
		: '';

	document.getElementById('report').innerHTML =
		`<h3>Разчет на силите и средствата за гасене на пожар</h3>${body}${warns}`;
	return true;
};

/* ------------------------------------------------------------------ */
/* Точки за вход — бутоните в index.html                                 */
/* ------------------------------------------------------------------ */

function calc() {
	return renderHtml(calcSectionI(readInput()));
}

/* ------------------------------------------------------------------ */
/* Изскачащи прозорци с чертежите (без промяна)                        */
/* ------------------------------------------------------------------ */

/*
 * Информация за всяка форма на гасене — показва се в модален прозорец (#modal)
 * при клик върху съответната илюстрация. Заглавието идва от SHAPE_LABELS.
 */
const SHAPE_INFO = {
	front_a:   { img: 'images/area_1side_a.jpg',          formula: '<i>F</i><sub>г</sub> = <i>a</i> · <i>h</i><sub>г</sub>',                                    desc: 'Гасене по един фронт откъм по-късата страна <i>a</i>.' },
	front_b:   { img: 'images/area_1side_b.jpg',          formula: '<i>F</i><sub>г</sub> = <i>b</i> · <i>h</i><sub>г</sub>',                                    desc: 'Гасене по един фронт откъм по-дългата страна <i>b</i>.' },
	two_aa:    { img: 'images/area_2sides_a.jpg',         formula: '<i>F</i><sub>г</sub> = 2<i>a</i> · <i>h</i><sub>г</sub>',                                   desc: 'Гасене по двата срещуположни фронта <i>a</i>.' },
	two_bb:    { img: 'images/area_2sides_b.jpg',         formula: '<i>F</i><sub>г</sub> = 2<i>b</i> · <i>h</i><sub>г</sub>',                                   desc: 'Гасене по двата срещуположни фронта <i>b</i>.' },
	two_ab:    { img: 'images/area_2sides_c.jpg',         formula: '<i>F</i><sub>г</sub> = <i>h</i><sub>г</sub>(<i>a</i> + <i>b</i> − <i>h</i><sub>г</sub>)',    desc: 'Двустранно Г-образно гасене — по една страна <i>a</i> и една страна <i>b</i>.' },
	three_aab: { img: 'images/area_3sides_a.jpg',         formula: '<i>F</i><sub>г</sub> = <i>h</i><sub>г</sub>(2<i>a</i> + <i>b</i> − 2<i>h</i><sub>г</sub>)', desc: 'Тристранно гасене — по двете страни <i>a</i> и едната страна <i>b</i>.' },
	three_abb: { img: 'images/area_3sides_b.jpg',         formula: '<i>F</i><sub>г</sub> = <i>h</i><sub>г</sub>(2<i>b</i> + <i>a</i> − 2<i>h</i><sub>г</sub>)', desc: 'Тристранно гасене — по двете страни <i>b</i> и едната страна <i>a</i>.' },
	perimeter: { img: 'images/area_perimeter_square.jpg', formula: '<i>F</i><sub>г</sub> = 2<i>h</i><sub>г</sub>(<i>a</i> + <i>b</i> − 2<i>h</i><sub>г</sub>)',   desc: 'Гасене по целия периметър на правоъгълния пожар.' },
	circle:    { img: 'images/area_perimeter_circle.jpg', formula: '<i>F</i><sub>г</sub> = π<i>h</i><sub>г</sub>(2<i>R</i> − <i>h</i><sub>г</sub>)',              desc: 'Гасене по периметъра на кръгов пожар с радиус <i>R</i>.' },
	whole:     { img: 'images/area_plosht_1.jpg',         formula: '<i>F</i><sub>г</sub> = <i>F</i><sub>п</sub>',                                              desc: 'Гасене по цялата площ на пожара.' },
};

/** Отваря модалния прозорец с информация за избраната форма на гасене. */
function openShapeModal(key) {
	const info = SHAPE_INFO[key];
	if (!info) return false;
	document.getElementById('modalTitle').textContent = SHAPE_LABELS[key];
	const img = document.getElementById('modalImg');
	img.src = info.img;
	img.alt = SHAPE_LABELS[key];
	document.getElementById('modalFormula').innerHTML = info.formula;
	document.getElementById('modalDesc').innerHTML = info.desc;
	document.getElementById('modal').classList.add('open');
	document.addEventListener('keydown', modalEscHandler);
	return true;
}

/** Затваря модалния прозорец. */
function closeShapeModal() {
	document.getElementById('modal').classList.remove('open');
	document.removeEventListener('keydown', modalEscHandler);
	return true;
}

/** Затваряне с клавиш Esc (закача се само докато прозорецът е отворен). */
function modalEscHandler(e) {
	if (e.key === 'Escape') closeShapeModal();
}

function area_perimeter_square() { return openShapeModal('perimeter'); }
function area_perimeter_circle() { return openShapeModal('circle'); }
function area_plosht() { return openShapeModal('whole'); }
function area_3sides_b() { return openShapeModal('three_abb'); }
function area_3sides_a() { return openShapeModal('three_aab'); }
function area_2sides_c() { return openShapeModal('two_ab'); }
function area_2sides_b() { return openShapeModal('two_bb'); }
function area_2sides_a() { return openShapeModal('two_aa'); }
function area_1side_b() { return openShapeModal('front_b'); }
function area_1side_a() { return openShapeModal('front_a'); }