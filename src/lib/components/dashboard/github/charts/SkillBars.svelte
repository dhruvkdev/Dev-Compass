<script lang="ts">
    import type { LanguageStats } from '../types';

    let { skills } = $props<{ skills: { languages: LanguageStats[] } }>();
    
    // Default GitHub colors helper if missing
    // We can add a simple hash or list later, for now relying on API providing it or default
    const colors = ['#2b7489', '#f1e05a', '#563d7c', '#e34c26', '#3178c6', '#178600'];
</script>

<div class="flex flex-col gap-4">
    <!-- Stacked Bar -->
    <div class="flex h-3 w-full overflow-hidden rounded-full bg-[#30363d]">
        {#each skills.languages as lang, i}
            <div 
                style="width: {lang.percentage}%; background-color: {colors[i % colors.length]};"
                class="h-full first:rounded-l-full last:rounded-r-full hover:opacity-80 transition-opacity relative group"
            >
                <!-- Tooltip attempt (CSS only for now) -->
            </div>
        {/each}
    </div>

    <!-- Legend / Details -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {#each skills.languages as lang, i}
            <div class="flex items-center gap-2">
                <div 
                    class="h-3 w-3 rounded-full" 
                    style="background-color: {colors[i % colors.length]};"
                ></div>
                <div class="flex flex-col">
                    <span class="text-sm font-medium text-[#c9d1d9]">{lang.name}</span>
                    <span class="text-xs text-[#8b949e]">{lang.percentage.toFixed(1)}%</span>
                </div>
            </div>
        {/each}
    </div>
</div>
