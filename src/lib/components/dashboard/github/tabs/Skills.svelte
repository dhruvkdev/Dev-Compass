<script lang="ts">
    import type { GithubProfile } from '../types';
    import SkillBars from '../charts/SkillBars.svelte';

    let { data } = $props<{ data: GithubProfile }>();
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
    <!-- Language Breakdown -->
    <div class="rounded-xl border border-[#30363d] bg-[#161b22] p-6">
        <h3 class="mb-6 text-base font-semibold text-[#f0f6fc]">Language Distribution</h3>
        <SkillBars skills={data.skills} />
        
        <div class="mt-8">
            <p class="text-xs text-[#8b949e]">
                * Based on byte count across top 20 repositories.
            </p>
        </div>
    </div>

    <!-- Confidence Table -->
    <div class="rounded-xl border border-[#30363d] bg-[#161b22] p-6">
        <h3 class="mb-6 text-base font-semibold text-[#f0f6fc]">Skill Confidence</h3>
        
        <div class="overflow-hidden rounded-lg border border-[#30363d]">
            <table class="w-full text-left text-sm">
                <thead class="bg-[#21262d] text-[#8b949e]">
                    <tr>
                        <th class="px-4 py-3 font-medium">Language</th>
                        <th class="px-4 py-3 font-medium">Usage</th>
                        <th class="px-4 py-3 font-medium">Confidence</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[#30363d]">
                    {#each data.skills.languages as lang}
                        <tr class="hover:bg-[#21262d]/50">
                            <td class="px-4 py-3 text-[#c9d1d9]">{lang.name}</td>
                            <td class="px-4 py-3 text-[#8b949e]">{lang.percentage.toFixed(1)}%</td>
                            <td class="px-4 py-3">
                                {#if lang.percentage > 30}
                                    <span class="inline-flex items-center rounded-full bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-400">Strong</span>
                                {:else if lang.percentage > 10}
                                    <span class="inline-flex items-center rounded-full bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-400">Proficient</span>
                                {:else}
                                    <span class="inline-flex items-center rounded-full bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400">Familiar</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>
