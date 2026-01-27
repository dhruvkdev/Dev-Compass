<script lang="ts">
    import type { GithubProfile } from '../types';
    import ContributionHeatmap from '../charts/ContributionHeatmap.svelte';
    import ActivityArea from '../charts/ActivityArea.svelte';

    let { data } = $props<{ data: GithubProfile }>();
</script>

<div class="flex flex-col gap-8">
    <!-- Heatmap Section -->
    <div class="rounded-xl border border-[#30363d] bg-[#161b22] p-6">
        <div class="mb-6 flex items-center justify-between">
            <h3 class="text-sm font-medium text-[#8b949e]">Contribution Calendar</h3>
            <span class="text-xs text-[#8b949e]">{data.metrics.totalContributions} contributions in the last year</span>
        </div>
        <ContributionHeatmap data={data.activity.heatmap} />
    </div>

    <!-- Timeline Section -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
            <div class="rounded-xl border border-[#30363d] bg-[#161b22] p-6 h-full">
                <h3 class="mb-6 text-sm font-medium text-[#8b949e]">Activity Timeline</h3>
                <ActivityArea data={data.activity.timeline} />
            </div>
        </div>
        
        <!-- Stats -->
        <div class="flex flex-col gap-4">
             <div class="rounded-xl border border-[#30363d] bg-[#0d1117] p-5">
                <span class="block text-xs text-[#8b949e] mb-1">Total PRs Merged</span>
                <span class="text-2xl font-bold text-[#f0f6fc]">{data.metrics.pullRequests}</span>
             </div>
             <div class="rounded-xl border border-[#30363d] bg-[#0d1117] p-5">
                <span class="block text-xs text-[#8b949e] mb-1">Issues Opened</span>
                <span class="text-2xl font-bold text-[#f0f6fc]">{data.metrics.issues}</span>
             </div>
             <div class="rounded-xl border border-[#30363d] bg-[#0d1117] p-5">
                <span class="block text-xs text-[#8b949e] mb-1">Code Reviews</span>
                <span class="text-2xl font-bold text-[#f0f6fc]">{data.metrics.reviews}</span>
             </div>
        </div>
    </div>
</div>
