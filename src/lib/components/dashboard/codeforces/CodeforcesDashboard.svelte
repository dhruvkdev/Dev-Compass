<script lang="ts">
	import { browser } from '$app/environment';
	import OverviewTab from './OverviewTab.svelte';

	let { data, activeTab = 'Overview' }: { data: any; activeTab?: string } = $props();

	// Dynamically import tabs only on client-side to avoid SSR issues with Chart.js
	let AnalyticsTab: any = $state(null);
	let CompareTab: any = $state(null);

	$effect(() => {
		if (browser && activeTab === 'Analytics' && !AnalyticsTab) {
			import('./AnalyticsTab.svelte').then((module) => {
				AnalyticsTab = module.default;
			});
		}
	});

	$effect(() => {
		if (browser && activeTab === 'Compare' && !CompareTab) {
			import('./CompareTab.svelte').then((module) => {
				CompareTab = module.default;
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
		{#if CompareTab}
			<CompareTab {data} />
		{:else}
			<div class="flex h-64 items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"
				></div>
			</div>
		{/if}
	{/if}
</div>
