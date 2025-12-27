<script lang="ts">
	import {
		Chart,
		ArcElement,
		Tooltip,
		Legend,
		DoughnutController,
		type ChartOptions
	} from 'chart.js';

	Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

	interface Submission {
		verdict: string;
		programmingLanguage: string;
	}

	let { submissions = [] }: { submissions: Submission[] } = $props();

	let verdictCanvas: HTMLCanvasElement;
	let langCanvas: HTMLCanvasElement;
	let verdictChart: Chart | null = null;
	let langChart: Chart | null = null;

	// --- Data Processing ---
	let stats = $derived.by(() => {
		let accepted = 0;
		let total = 0;
		const langs: Record<string, number> = {};
		const verdicts: Record<string, number> = {};

		if (submissions) {
			total = submissions.length;
			for (const sub of submissions) {
				// Languages
				langs[sub.programmingLanguage] = (langs[sub.programmingLanguage] || 0) + 1;
				// Verdicts
				verdicts[sub.verdict] = (verdicts[sub.verdict] || 0) + 1;
				if (sub.verdict === 'OK') accepted++;
			}
		}
		return { accepted, total, langs, verdicts };
	});

	let successRate = $derived(
		stats.total > 0 ? ((stats.accepted / stats.total) * 100).toFixed(0) : '0'
	);

	// --- Chart Configurations ---
	const chartColors = {
		verdict: ['#22c55e', '#ef4444', '#eab308', '#a855f7', '#71717a'], // Green, Red, Yellow, Purple, Zinc
		lang: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316'] // Blue, Cyan, Violet, Pink, Orange
	};

	let verdictData = $derived({
		labels: ['Accepted', 'Wrong Answer', 'Time Limit', 'Runtime Error', 'Others'],
		datasets: [
			{
				data: [
					stats.verdicts['OK'] || 0,
					stats.verdicts['WRONG_ANSWER'] || 0,
					stats.verdicts['TIME_LIMIT_EXCEEDED'] || 0,
					stats.verdicts['RUNTIME_ERROR'] || 0,
					stats.total -
						((stats.verdicts['OK'] || 0) +
							(stats.verdicts['WRONG_ANSWER'] || 0) +
							(stats.verdicts['TIME_LIMIT_EXCEEDED'] || 0) +
							(stats.verdicts['RUNTIME_ERROR'] || 0))
				],
				backgroundColor: chartColors.verdict,
				borderWidth: 0,
				hoverOffset: 4
			}
		]
	});

	let langData = $derived({
		labels: Object.keys(stats.langs).slice(0, 5),
		datasets: [
			{
				data: Object.values(stats.langs).slice(0, 5),
				backgroundColor: chartColors.lang,
				borderWidth: 0,
				hoverOffset: 4
			}
		]
	});

	const commonOptions: ChartOptions<'doughnut'> = {
		responsive: true,
		maintainAspectRatio: false,
		cutout: '75%', // Thinner ring for modern look
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(9, 9, 11, 0.9)',
				padding: 12,
				cornerRadius: 8,
				callbacks: { label: (item) => ` ${item.label}: ${item.raw}` }
			}
		}
	};

	// Helper to generate verdict rows cleanly in UI
	let verdictMeta = $derived([
		{ label: 'Accepted', count: stats.verdicts['OK'] || 0, color: chartColors.verdict[0] },
		{
			label: 'Wrong Answer',
			count: stats.verdicts['WRONG_ANSWER'] || 0,
			color: chartColors.verdict[1]
		},
		{
			label: 'Time Limit',
			count: stats.verdicts['TIME_LIMIT_EXCEEDED'] || 0,
			color: chartColors.verdict[2]
		},
		{
			label: 'Runtime Error',
			count: stats.verdicts['RUNTIME_ERROR'] || 0,
			color: chartColors.verdict[3]
		}
	]);

	$effect(() => {
		if (verdictCanvas && submissions.length > 0) {
			if (verdictChart) verdictChart.destroy();
			verdictChart = new Chart(verdictCanvas, {
				type: 'doughnut',
				data: verdictData,
				options: commonOptions
			});
			return () => verdictChart?.destroy();
		}
	});

	$effect(() => {
		if (langCanvas && submissions.length > 0) {
			if (langChart) langChart.destroy();
			langChart = new Chart(langCanvas, {
				type: 'doughnut',
				data: langData,
				options: commonOptions
			});
			return () => langChart?.destroy();
		}
	});
</script>

<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
	<div
		class="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-zinc-900/80"
	>
		<div class="mb-6 flex items-start justify-between">
			<div>
				<h3 class="text-lg font-semibold text-white">Verdict Distribution</h3>
				<p class="text-xs text-zinc-500">Out of {stats.total} total submissions</p>
			</div>
			<div class="rounded-lg bg-green-500/10 px-3 py-1.5 text-right">
				<div class="text-xl font-bold text-green-400 tabular-nums">{stats.accepted}</div>
				<div class="text-[10px] tracking-wider text-green-500/60 uppercase">Accepted</div>
			</div>
		</div>

		<div class="flex flex-col gap-8 sm:flex-row sm:items-center">
			<div class="relative mx-auto h-40 w-40 shrink-0 sm:mx-0">
				<canvas bind:this={verdictCanvas}></canvas>
				<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
					<span class="text-3xl font-bold text-white tabular-nums"
						>{successRate}<span class="text-lg">%</span></span
					>
					<span class="text-[10px] tracking-widest text-zinc-500 uppercase">Success</span>
				</div>
			</div>

			<div class="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
				{#each verdictMeta as item}
					{@const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}
					<div
						class="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10"
					>
						<div class="flex items-center justify-between text-xs">
							<span class="flex items-center gap-2 font-medium text-zinc-300">
								<span class="h-2 w-2 rounded-full shadow-sm" style="background-color: {item.color}"
								></span>
								{item.label}
							</span>
							<span class="text-zinc-500">{percentage}%</span>
						</div>
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
							<div
								class="h-full rounded-full transition-all duration-500"
								style="width: {percentage}%; background-color: {item.color}"
							></div>
						</div>
						<div class="text-right text-xs font-medium text-white tabular-nums">{item.count}</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div
		class="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-zinc-900/80"
	>
		<div class="mb-6 flex items-start justify-between">
			<div>
				<h3 class="text-lg font-semibold text-white">Language Usage</h3>
				<p class="text-xs text-zinc-500">Breakdown by frequency</p>
			</div>
			<div class="rounded-lg bg-blue-500/10 px-3 py-1.5 text-right">
				<div class="text-xl font-bold text-blue-400 tabular-nums">
					{Object.keys(stats.langs).length}
				</div>
				<div class="text-[10px] tracking-wider text-blue-500/60 uppercase">Languages</div>
			</div>
		</div>

		<div class="flex flex-col gap-8 sm:flex-row sm:items-center">
			<div class="relative mx-auto h-40 w-40 shrink-0 sm:mx-0">
				<canvas bind:this={langCanvas}></canvas>
				<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
					<span class="text-3xl font-bold text-white tabular-nums">{stats.total}</span>
					<span class="text-[10px] tracking-widest text-zinc-500 uppercase">Total</span>
				</div>
			</div>

			<div class="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
				{#each Object.entries(stats.langs).slice(0, 4) as [lang, count], i}
					{@const color = chartColors.lang[i]}
					{@const percentage = Math.round((count / stats.total) * 100)}

					<div
						class="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10"
					>
						<div class="flex items-center justify-between text-xs">
							<span class="flex items-center gap-2 font-medium text-zinc-300">
								<span class="h-2 w-2 rounded-full shadow-sm" style="background-color: {color}"
								></span>
								{lang}
							</span>
							<span class="text-zinc-500">{percentage}%</span>
						</div>
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
							<div
								class="h-full rounded-full transition-all duration-500"
								style="width: {percentage}%; background-color: {color}"
							></div>
						</div>
						<div class="text-right text-xs font-medium text-white tabular-nums">{count}</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
