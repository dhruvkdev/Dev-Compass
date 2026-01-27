<script lang="ts">
	import OverviewTab from './OverviewTab.svelte';
	import AnalysisTab from './AnalysisTab.svelte';
	import CompareTab from './CompareTab.svelte';

	let { data, activeTab = 'Overview' } = $props();
</script>

<!-- LeetCode Dashboard Wrapper -->
<div class="pt-6 z-50">
	{#if activeTab === 'Overview'}
		<OverviewTab {data} />
	{:else if activeTab === 'Analytics'}
		<AnalysisTab skills={data.skills} />
	{:else if activeTab === 'Compare'}
		<CompareTab {data} />
	{/if}
</div>
