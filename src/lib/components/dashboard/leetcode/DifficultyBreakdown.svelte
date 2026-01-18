<script lang="ts">
	import { Chart, DoughnutController, ArcElement, type ChartOptions } from 'chart.js';
	import { onMount } from 'svelte';
	import { Code } from 'lucide-svelte';

	Chart.register(DoughnutController, ArcElement);

	let { easy, medium, hard, total } = $props();

	// Fallback if data is missing
	let safeEasy = $derived(easy || 0);
	let safeMedium = $derived(medium || 0);
	let safeHard = $derived(hard || 0);

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	const options: ChartOptions<'doughnut'> = {
		responsive: true,
		maintainAspectRatio: false,
		cutout: '75%',
		events: [], // Disable interactions for purely visual component
		plugins: { legend: { display: false }, tooltip: { enabled: false } },
		animation: { animateRotate: true, animateScale: false }
	};

	$effect(() => {
		if (canvas && !chart) {
			chart = new Chart(canvas, {
				type: 'doughnut',
				data: {
					labels: ['Easy', 'Medium', 'Hard'],
					datasets: [
						{
							data: [safeEasy, safeMedium, safeHard],
							backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
							borderWidth: 0,
							hoverOffset: 0
						}
					]
				},
				options
			});
		}
	});
</script>

<div class="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-md">
	<h3 class="mb-6 text-lg font-bold text-white">Difficulty Distribution</h3>
	<div class="relative h-48 w-full">
		<canvas bind:this={canvas}></canvas>
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			<span class="text-3xl font-bold text-white">{total}</span>
			<span class="text-xs text-zinc-500">Total Solved</span>
		</div>
	</div>

	<div class="mt-6 space-y-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
				<span class="text-sm text-zinc-300">Easy</span>
			</div>
			<span class="text-sm font-medium text-white">{safeEasy}</span>
		</div>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="h-2 w-2 rounded-full bg-amber-500"></span>
				<span class="text-sm text-zinc-300">Medium</span>
			</div>
			<span class="text-sm font-medium text-white">{safeMedium}</span>
		</div>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="h-2 w-2 rounded-full bg-rose-500"></span>
				<span class="text-sm text-zinc-300">Hard</span>
			</div>
			<span class="text-sm font-medium text-white">{safeHard}</span>
		</div>
	</div>
</div>
