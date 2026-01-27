<script lang="ts">
    import type { GithubProfile } from '../types';
    import MetricCard from '../MetricCard.svelte';
    import RadarChart from '../charts/RadarChart.svelte';
    import { GitFork, Star, GitPullRequest, Code2 } from 'lucide-svelte';

    let { data } = $props<{ data: GithubProfile }>();

    // Prepare Radar Data
    let radarData = $derived(data.rating.breakdown);
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Main Left: Radar + Stats -->
    <div class="flex flex-col gap-6 lg:col-span-2">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- Radar Card -->
            <div class="relative overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22] p-6 shadow-sm">
                <h3 class="mb-4 text-sm font-medium text-[#8b949e]">Profile Balance</h3>
                <RadarChart data={radarData} x="label" y="score" />
            </div>

            <!-- Key Metrics Grid -->
            <div class="grid grid-cols-1 gap-4">
                <MetricCard 
                    label="Total Contributions" 
                    value={data.metrics.totalContributions} 
                    icon={Code2}
                />
                <MetricCard 
                    label="Repository Stars" 
                    value={data.metrics.totalStars} 
                    icon={Star}
                    color="text-[#e3b341]"
                />
                <MetricCard 
                    label="Pull Requests" 
                    value={data.metrics.pullRequests} 
                    icon={GitPullRequest}
                />
            </div>
        </div>

        <!-- Pinned Repos -->
        <div>
            <h3 class="mb-4 text-lg font-semibold text-[#f0f6fc]">Pinned Projects</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {#each data.oss.pinned as repo}
                    <div class="group flex flex-col rounded-xl border border-[#30363d] bg-[#0d1117] p-4 transition-all hover:border-[#58a6ff]/50 hover:shadow-md">
                        <div class="mb-2 flex items-center justify-between">
                            <a
                                href={`https://github.com/${data.username}/${repo.name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="font-semibold text-[#58a6ff] hover:underline focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/50 rounded"
                            >
                                {repo.name}
                            </a>

                            <div class="flex items-center gap-1 text-xs text-[#8b949e]">
                                <Star size={12} /> {repo.stars}
                            </div>
                        </div>
                        <p class="mb-4 flex-1 text-xs leading-relaxed text-[#8b949e] line-clamp-2">
                            {repo.description || 'No description provided'}
                        </p>
                        <div class="flex items-center gap-2">
                            {#each repo.languages.slice(0, 3) as lang}
                                <span class="rounded-full bg-[#30363d] px-2 py-0.5 text-[10px] text-[#c9d1d9]">{lang}</span>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>

    <!-- Right Sidebar: Quick Summary? Top Skills? -->
    <div class="flex flex-col gap-6">
        <!-- Top Langs -->
        <div class="rounded-xl border border-[#30363d] bg-[#161b22] p-6">
            <h3 class="mb-4 text-sm font-medium text-[#8b949e]">Top Languages</h3>
            {#each data.skills.languages.slice(0, 5) as lang}
                <div class="mb-3 last:mb-0">
                    <div class="mb-1 flex justify-between text-xs">
                        <span class="text-[#c9d1d9]">{lang.name}</span>
                        <span class="text-[#8b949e]">{lang.percentage.toFixed(1)}%</span>
                    </div>
                    <div class="h-1.5 w-full overflow-hidden rounded-full bg-[#30363d]">
                        <div class="h-full bg-[#58a6ff]" style="width: {lang.percentage}%"></div>
                    </div>
                </div>
            {/each}
        </div>
        
        <!-- Quick Insight -->
        <div class="rounded-xl border border-[#30363d] bg-gradient-to-br from-[#161b22] to-[#1f2428] p-6">
             <h3 class="mb-2 text-sm font-medium text-[#8b949e]">Analyzer Insight</h3>
             <p class="text-sm italic text-[#c9d1d9] leading-6">
                "{data.username} demonstrates {data.rating.breakdown[0].score > 80 ? 'exceptional' : 'solid'} consistency with a strong focus on {data.skills.topLanguages[0]}. Their impact score indicates {data.rating.breakdown[1].score > 50 ? 'significant community reach' : 'growing influence'}."
             </p>
        </div>
    </div>
</div>
