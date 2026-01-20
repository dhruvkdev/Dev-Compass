<script lang="ts">
	import {
		Chart,
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale,
		TimeScale,
		Filler,
		type ChartOptions,
		type TooltipItem,
		LineController
	} from 'chart.js';
	import 'chartjs-adapter-date-fns';

	Chart.register(
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale,
		TimeScale,
		Filler,
		LineController
	);

	// Define the shape of your history object
	interface RatingHistory {
		contestId: number;
		contestName: string;
		handle: string;
		rank: number;
		ratingUpdateTimeSeconds: number;
		oldRating: number;
		newRating: number;
	}

	let { history = [] }: { history: RatingHistory[] } = $props();

	let chartCanvas = $state<HTMLCanvasElement>();
	let chartInstance: Chart | null = null;

	// 1. Process Data
	let sortedHistory = $derived(
		[...history].sort((a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds)
	);

	let chartData = $derived({
		labels: sortedHistory.map((entry) => new Date(entry.ratingUpdateTimeSeconds * 1000)),
		datasets: [
			{
				label: 'Rating',
				data: sortedHistory.map((entry) => entry.newRating),
				borderColor: '#3b82f6', // Blue 500
				backgroundColor: 'rgba(59, 130, 246, 0.1)',
				pointBackgroundColor: '#fff',
				pointBorderColor: '#3b82f6',
				pointHoverBackgroundColor: '#3b82f6',
				pointHoverBorderColor: '#fff',
				borderWidth: 2,
				pointRadius: 3,
				pointHoverRadius: 5,
				tension: 0.3,
				fill: true
			}
		]
	});

	// 2. Options
	const options: ChartOptions<'line'> = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false
			},
			tooltip: {
				backgroundColor: 'rgba(9, 9, 11, 0.9)',
				titleColor: '#fff',
				bodyColor: '#cbd5e1',
				borderColor: 'rgba(255, 255, 255, 0.1)',
				borderWidth: 1,
				padding: 10,
				displayColors: false,
				callbacks: {
					title: (tooltipItems: TooltipItem<'line'>[]) => {
						const timestamp = tooltipItems[0].parsed.x as number;
						const date = new Date(timestamp);

						return date.toLocaleDateString(undefined, {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						});
					},
					label: (context: TooltipItem<'line'>) => `Rating: ${context.raw}`,
					afterLabel: (context: TooltipItem<'line'>) => {
						const index = context.dataIndex;
						return sortedHistory[index]?.contestName
							? `Contest: ${sortedHistory[index].contestName}`
							: '';
					}
				}
			}
		},
		scales: {
			x: {
				type: 'time',
				time: {
					tooltipFormat: 'PP'
				},
				grid: {
					display: false
				},
				ticks: {
					color: '#71717a',
					font: { size: 10 },
					maxRotation: 0,
					autoSkip: true
				}
			},
			y: {
				grid: {
					color: 'rgba(255, 255, 255, 0.05)'
				},
				ticks: {
					color: '#71717a',
					font: { size: 10 }
				}
			}
		},
		interaction: {
			mode: 'index',
			intersect: false
		}
	};

	// 3. Effect to Create/Update Chart
	$effect(() => {
		if (chartCanvas && history.length > 0) {
			if (chartInstance) {
				chartInstance.destroy();
			}

			chartInstance = new Chart(chartCanvas, {
				type: 'line',
				data: chartData,
				options: options
			});

			return () => {
				if (chartInstance) chartInstance.destroy();
			};
		}
	});
</script>

<div class="relative h-64 w-full">
	{#if history.length > 0}
		<canvas bind:this={chartCanvas}></canvas>
	{:else}
		<div class="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-500">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-activity opacity-50"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg
			>
			<span class="text-sm">No rating history available</span>
		</div>
	{/if}
</div>
