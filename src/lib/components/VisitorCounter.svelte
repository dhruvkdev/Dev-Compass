<script lang="ts">
	import { onMount } from 'svelte';
	import { Eye } from 'lucide-svelte';

	export let count: number;
	export let label = 'Total Visitors';
	export let showTrend = true;

	let displayCount = 0;
	let mounted = false;
	let trend = 0;

	onMount(() => {
		mounted = true;

		// Simulated trend (replace with real data if available)
		const previous = count * 0.9;
		trend = ((count - previous) / previous) * 100;

		// Smooth, restrained count-up animation
		const duration = 800;
		const steps = 20;
		const increment = count / steps;
		let current = 0;

		const timer = setInterval(() => {
			current += increment;
			if (current >= count) {
				displayCount = count;
				clearInterval(timer);
			} else {
				displayCount = Math.floor(current);
			}
		}, duration / steps);

		return () => clearInterval(timer);
	});

	function formatNumber(num: number): string {
		if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
		if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
		return num.toLocaleString();
	}
</script>

<div
	class="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-full
	       border border-white/[0.06]
	       bg-[#0E0F11]/80 px-4 py-2
	       backdrop-blur-md
	       shadow-[0_6px_20px_rgba(0,0,0,0.6)]
	       transition-all duration-300
	       hover:bg-[#14161A]/90"
>
	<!-- Icon -->
	<div
		class="flex h-8 w-8 items-center justify-center rounded-full
		       bg-white/[0.04]"
	>
		<Eye class="h-4 w-4 text-[#BFC3C9]" />
	</div>

	<!-- Text -->
	<div class="flex flex-col leading-tight">
		<div class="flex items-baseline gap-2">
			<span
				class="text-lg font-semibold tracking-tight tabular-nums text-[#E6E7EB]"
			>
				{#if mounted}
					{formatNumber(displayCount)}
				{:else}
					—
				{/if}
			</span>

			{#if showTrend && mounted}
				<span class="text-xs text-[#9CA0A8]">
					↑ {trend.toFixed(1)}%
				</span>
			{/if}
		</div>

		<span class="text-[11px] text-[#9CA0A8]">
			{label}
		</span>
	</div>
</div>
