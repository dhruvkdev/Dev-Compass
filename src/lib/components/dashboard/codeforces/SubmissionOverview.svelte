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
		stats.total > 0 ? ((stats.accepted / stats.total) * 100).toFixed(1) : '0.0'
	);

	// Prepare Chart Data
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
				backgroundColor: ['#22c55e', '#ef4444', '#eab308', '#a855f7', '#71717a'],
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
				backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316'],
				borderWidth: 0,
				hoverOffset: 4
			}
		]
	});

	const options: ChartOptions<'doughnut'> = {
		responsive: true,
		maintainAspectRatio: false,
		cutout: '70%',
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(9, 9, 11, 0.9)',
				padding: 10,
				callbacks: {
					label: (item) => ` ${item.label}: ${item.raw}`
				}
			}
		}
	};

	$effect(() => {
		if (verdictCanvas && submissions.length > 0) {
			if (verdictChart) verdictChart.destroy();
			verdictChart = new Chart(verdictCanvas, {
				type: 'doughnut',
				data: verdictData,
				options
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
				options
			});
			return () => langChart?.destroy();
		}
	});
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
	<!-- Verdict Stats -->
	<div
		class="group relative overflow-hidden
		rounded-2xl border border-white/10
		bg-gradient-to-b from-zinc-950/90 to-black/80
		p-6 backdrop-blur-xl

		transition-all duration-300
		hover:border-white/20
		hover:shadow-2xl hover:shadow-black/60"
	>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-white">Verdict Distribution</h3>
			<div class="text-right">
				<div class="text-2xl font-bold text-green-400">{stats.accepted}</div>
				<div class="text-xs text-zinc-500">Accepted</div>
			</div>
		</div>

		<div class="flex items-center gap-8">
			<div class="relative h-40 w-40 shrink-0">
				<div
					class="absolute inset-0 rounded-full
					bg-gradient-to-br from-white/10 to-transparent
					opacity-60 blur-lg"
				></div>

				<canvas bind:this={verdictCanvas}></canvas>

				<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
					<span class="text-2xl font-bold text-white">{successRate}%</span>
					<span class="text-[10px] tracking-widest text-zinc-500 uppercase"> Success </span>
				</div>
			</div>

			<div class="flex-1 space-y-2 text-sm">
				<div class="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-white/5">
					<span class="flex items-center gap-2 text-zinc-400">
						<span class="h-2 w-2 rounded-full bg-green-500"></span>
						Accepted
					</span>
					<span class="font-medium text-white">{stats.verdicts['OK'] || 0}</span>
				</div>

				<div class="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-white/5">
					<span class="flex items-center gap-2 text-zinc-400"
						><span class="h-2 w-2 rounded-full bg-red-500"></span>Wrong Answer</span
					>
					<span class="font-medium text-white">{stats.verdicts['WRONG_ANSWER'] || 0}</span>
				</div>

				<div class="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-white/5">
					<span class="flex items-center gap-2 text-zinc-400"
						><span class="h-2 w-2 rounded-full bg-yellow-500"></span>Time Limit</span
					>
					<span class="font-medium text-white">{stats.verdicts['TIME_LIMIT_EXCEEDED'] || 0}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Language Stats -->
	<div
		class="group relative overflow-hidden
		rounded-2xl border border-white/10
		bg-gradient-to-b from-zinc-950/90 to-black/80
		p-6 backdrop-blur-xl

		transition-all duration-300
		hover:border-white/20
		hover:shadow-2xl hover:shadow-black/60"
	>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-white">Programming Languages</h3>
			<div class="text-right">
				<div class="text-2xl font-bold text-blue-400">{Object.keys(stats.langs).length}</div>
				<div class="text-xs text-zinc-500">Languages Used</div>
			</div>
		</div>

		<div class="flex items-center gap-8">
			<div class="relative h-40 w-40 shrink-0">
				<canvas bind:this={langCanvas}></canvas>
				<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
					<span class="text-2xl font-bold text-white">{stats.total}</span>
					<span class="text-[10px] tracking-widest text-zinc-500 uppercase">Total Submissions</span>
				</div>
			</div>

			<div class="flex-1 space-y-2 text-sm">
				{#each Object.entries(stats.langs).slice(0, 4) as [lang, count], i}
					<div class="flex items-center justify-between">
						<span class="flex items-center gap-2 text-zinc-400">
							<span
								class="h-2 w-2 rounded-full"
								style="background-color: {['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899'][i]}"
							></span>
							{lang}
						</span>
						<span class="text-white">{count}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
