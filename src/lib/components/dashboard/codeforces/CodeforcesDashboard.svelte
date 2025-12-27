<script lang="ts">
	import { browser } from '$app/environment';
	import OverviewTab from './OverviewTab.svelte';

	let { data, activeTab = 'Overview' }: { data: any; activeTab?: string } = $props();

	// Dynamically import AnalyticsTab only on client-side to avoid SSR issues with layerchart
	let AnalyticsTab: any = $state(null);

	$effect(() => {
		if (browser && activeTab === 'Analytics' && !AnalyticsTab) {
			import('./AnalyticsTab.svelte').then((module) => {
				AnalyticsTab = module.default;
			});
		}
	});
</script>

<div class="pt-6">
	{#if activeTab === 'Overview'}
		<OverviewTab {data} />
	{:else if activeTab === 'Analytics'}
		{#if AnalyticsTab}
			<AnalyticsTab {data} />
		{:else}
			<div class="flex h-64 items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"
				></div>
			</div>
		{/if}
	{:else if activeTab === 'Compare'}
		<div
			class="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50"
		>
			<div class="text-center">
				<p class="text-lg font-medium text-zinc-400">Compare Feature</p>
				<p class="mt-2 text-sm text-zinc-500">Coming soon...</p>
			</div>
		</div>
	{/if}
</div>
