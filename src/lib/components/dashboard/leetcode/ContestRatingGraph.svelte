<script lang="ts">
	import { Chart, Svg, Axis, Spline, Area, Highlight, Tooltip, Group } from 'layerchart';
	import { scaleTime, scaleLinear } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';
	import { format } from 'date-fns';
	import type { ContestRatingHistory } from '$lib/server/leetcode/types';

	let {
		datasets,
		variant = 'overview'
	}: {
		datasets: {
			label: string;
			color: string;
			data: ContestRatingHistory;
		}[];
		variant?: 'overview' | 'comparison';
	} = $props();

	let allPoints = $derived(datasets.flatMap((d) => d.data));
	let minDate = $derived(Math.min(...allPoints.map((d) => d.date * 1000)));
	let maxDate = $derived(Math.max(...allPoints.map((d) => d.date * 1000)));
	let minRating = $derived(Math.min(...allPoints.map((d) => d.rating)));
	let maxRating = $derived(Math.max(...allPoints.map((d) => d.rating)));

	// Give the chart some vertical breathing room
	let yDomain = $derived([Math.max(0, minRating - 100), maxRating + 100]);
</script>

<div
	class="h-[400px] w-full rounded-2xl border border-white/5 bg-zinc-950/50 p-6 shadow-2xl backdrop-blur-sm"
>
	{#if allPoints.length === 0}
		<div class="flex h-full flex-col items-center justify-center space-y-2">
			<div class="rounded-full bg-zinc-900 p-4">
				<div class="h-6 w-6 text-zinc-500">📉</div>
			</div>
			<div class="text-sm font-medium text-zinc-300">No contest history yet</div>
			<p class="text-xs text-zinc-500">Compete in a LeetCode contest to see your growth.</p>
		</div>
	{:else}
		<Chart
			data={datasets.flatMap((d) =>
				d.data.map((p) => ({
					...p,
					group: d.label,
					color: d.color
				}))
			)}
			x={(d: any) => d.date * 1000}
			y="rating"
			xScale={scaleTime()}
			yScale={scaleLinear()}
			xDomain={[minDate, maxDate]}
			{yDomain}
			padding={{ top: 20, right: 10, bottom: 30, left: 45 }}
			tooltip={{ mode: 'bisect-x' }}
		>
			<Svg>
				<defs>
					{#each datasets as dataset, i}
						<linearGradient id="gradient-{i}" x1="0" x2="0" y1="0" y2="1">
							<stop offset="0%" stop-color={dataset.color} stop-opacity="0.3" />
							<stop offset="100%" stop-color={dataset.color} stop-opacity="0" />
						</linearGradient>
					{/each}
				</defs>

				<Axis
					placement="left"
					grid={{ class: 'stroke-zinc-800/50' }}
					ticks={5}
					class="fill-zinc-500 text-[10px] font-medium"
				/>

				<Axis
					placement="bottom"
					format={(d) => format(d, 'MMM yy')}
					class="fill-zinc-500 text-[10px] font-medium"
				/>

				{#each datasets as dataset, i}
					<Area
						data={dataset.data}
						x={(d: any) => d.date * 1000}
						y="rating"
						curve={curveMonotoneX}
						fill="url(#gradient-{i})"
					/>

					<Spline
						data={dataset.data}
						x={(d: any) => d.date * 1000}
						y="rating"
						curve={curveMonotoneX}
						class="fill-none stroke-[3]"
						style="stroke: {dataset.color}; filter: drop-shadow(0px 4px 6px {dataset.color}44);"
					/>
				{/each}

				<Highlight
					lines={{ class: 'stroke-zinc-700' }}
					points={{ size: 4, fill: 'white', stroke: 'currentColor', strokeWidth: 2 }}
				/>
			</Svg>

			<Tooltip.Root let:data>
				<div
					class="pointer-events-none min-w-[200px] overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-2xl"
				>
					<div class="h-1 w-full" style="background-color: {data.color || '#3b82f6'}"></div>

					<div class="p-3">
						<div class="flex items-center justify-between gap-4">
							<span class="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
								{format(data.date * 1000, 'MMM dd, yyyy')}
							</span>
							{#if typeof data.delta === 'number'}
								<span
									class="flex items-center gap-1 text-xs font-bold {data.delta >= 0
										? 'text-emerald-400'
										: 'text-rose-400'}"
								>
									{data.delta > 0 ? '↑' : '↓'}
									{Math.abs(data.delta).toFixed(3)}
								</span>
							{/if}
						</div>

						<div class="mt-1 text-2xl font-black text-white">
							{data.rating}
						</div>

						<div class="mt-2 flex flex-col gap-1 border-t border-white/5 pt-2">
							<div class="flex justify-between text-xs">
								<span class="text-zinc-500">Rank</span>
								<span class="font-mono text-zinc-200">#{data.ranking.toLocaleString()}</span>
							</div>
							{#if variant === 'comparison'}
								<div class="flex justify-between text-xs">
									<span class="text-zinc-500">User</span>
									<span style="color: {data.color}">{data.group}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</Tooltip.Root>
		</Chart>
	{/if}
</div>
