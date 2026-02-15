<script lang="ts">
    import type { GithubProfile } from './types';
    import { Tier } from './types';
    import { fade } from 'svelte/transition';
    import { Github, Users, Star, GitFork, Calendar } from 'lucide-svelte';

    let { profile } = $props<{ profile: GithubProfile }>();

    // Dynamic color for tiers
    let tierColor = $derived.by(() => {
        switch (profile.rating.tier) {
            case Tier.Grandmaster: return 'text-red-500 ring-red-500/30 bg-red-500/10';
            case Tier.InternationalMaster: return 'text-orange-500 ring-orange-500/30 bg-orange-500/10';
            case Tier.Master: return 'text-yellow-500 ring-yellow-500/30 bg-yellow-500/10';
            case Tier.CandidateMaster: return 'text-purple-500 ring-purple-500/30 bg-purple-500/10';
            case Tier.Expert: return 'text-blue-500 ring-blue-500/30 bg-blue-500/10';
            default: return 'text-green-500 ring-green-500/30 bg-green-500/10';
        }
    });
</script>

<div class="relative overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22] p-6 shadow-xl">
    <!-- Decorative background glow -->
    <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/5 blur-[100px]"></div>
    
    <div class="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <!-- User Info -->
        <div class="flex items-center gap-5">
            <div class="relative group">
                <div class="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <img
                    src={`https://github.com/${profile.username}.png`}
                    alt={profile.username}
                    class="relative h-24 w-24 rounded-full border-2 border-[#30363d] bg-[#0d1117] object-cover ring-2 ring-black/50"
                />
                <div class="absolute -bottom-2 -right-2 rounded-lg border border-[#30363d] bg-[#0d1117] p-1.5 text-[#c9d1d9] shadow-sm">
                   <Github size={16} />
                </div>
            </div>
            
            <div class="space-y-1">
                <h1 class="text-3xl font-bold tracking-tight text-[#f0f6fc]">
                    {profile.username}
                </h1>
                <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#8b949e]">
                    <span class="flex items-center gap-1.5 hover:text-[#58a6ff] transition-colors">
                        <Users size={14} />
                        {profile.metrics.followers.toLocaleString()} followers
                    </span>
                    <span class="flex items-center gap-1.5 hover:text-[#58a6ff] transition-colors">
                        <Calendar size={14} />
                        Joined {profile.accountAgeYears}y ago
                    </span>
                    <span class="flex items-center gap-1.5 hover:text-[#e3b341] transition-colors">
                        <Star size={14} />
                        {profile.metrics.totalStars.toLocaleString()} stars
                    </span>
                </div>
            </div>
        </div>

        <!-- Rating Badge -->
        <div class="flex flex-col items-end gap-2">
            <div class="flex flex-col items-end">
                <span class="text-xs font-medium uppercase tracking-wider text-[#8b949e]">Vector Rating</span>
                <div class="flex items-baseline gap-2">
                    <span class="text-5xl font-black tracking-tight {tierColor.split(' ')[0]}">
                        {profile.rating.score}
                    </span>
                    <span class="text-sm font-semibold text-[#8b949e]">/ 3000</span>
                </div>
            </div>
            
            <div class={`flex items-center gap-2 rounded-full px-3 py-1 ring-1 ${tierColor}`}>
                <span class="text-sm font-bold uppercase tracking-wide">
                    {profile.rating.tier}
                </span>
            </div>
        </div>
    </div>

    <!-- Mini Score Breakdown -->
    <div class="mt-8 grid grid-cols-1 gap-4 border-t border-[#30363d] pt-6 sm:grid-cols-3">
        {#each profile.rating.breakdown as item}
            <div class="rounded-lg bg-[#0d1117] p-3 transition-colors hover:bg-[#21262d]">
                <div class="mb-1 flex items-center justify-between">
                    <span class="text-xs font-semibold uppercase text-[#8b949e]">{item.label}</span>
                    <span class="text-xs text-[#58a6ff]">{item.score}/{item.max}</span>
                </div>
                <!-- Progress bar -->
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-[#30363d]">
                    <div 
                        class="h-full rounded-full bg-gradient-to-r from-[#58a6ff] to-[#bc8cff]"
                        style="width: {(item.score / item.max) * 100}%"
                    ></div>
                </div>
                <p class="mt-1.5 text-[10px] text-[#8b949e]">{item.description}</p>
            </div>
        {/each}
    </div>
</div>
