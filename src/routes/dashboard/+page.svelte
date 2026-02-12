<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade, slide } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import CodeforcesDashboard from '$lib/components/dashboard/codeforces/CodeforcesDashboard.svelte';
    import { LeetCodeDashboard } from '$lib/components/dashboard/leetcode';
    import RisingParticles from '$lib/components/ui/RisingParticles/index';
    import { GithubDashboard } from '$lib/components/dashboard/github';
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

    let { data, form } = $props();

    let activeTab = $state('Overview');
    let loading = $state(false);

    // For manual lookup
    let selectedPlatform = $state('codeforces');

    // Available platforms for verified display
    const verifiedPlatforms = $derived(data.platforms ?? []);
    
    // Current platform being viewed (from verified list or form submission)
    let activePlatformId = $state<string | null>(null);

    // Auto-select first verified platform on load
    $effect(() => {
        if (verifiedPlatforms.length > 0 && !activePlatformId && !form?.success) {
            activePlatformId = verifiedPlatforms[0].platform;
        }
    });

    // Track if we are viewing manual search results
    let viewingManualSearch = $state(!!form?.success);

    // Get data for currently active platform
    const activePlatformData = $derived(
        viewingManualSearch && form?.success
            ? { platform: form.platform, data: form.data }
            : verifiedPlatforms.find((p: { platform: string }) => p.platform === activePlatformId)
    );

    const tabs = ['Overview', 'Analytics', 'Compare'];
    const platforms = [
        { id: 'codeforces', label: 'Codeforces', color: 'text-red-500' },
        { id: 'leetcode', label: 'LeetCode', color: 'text-yellow-500' },
        { id: 'github', label: 'GitHub', color: 'text-white' }
    ];

    let selectedLabel = $derived(platforms.find(p => p.id === selectedPlatform)?.label ?? 'Select Platform');
</script>

<div class="relative min-h-screen bg-black pt-24 pb-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <RisingParticles particleCount={40} className="z-0" />
            <div class="absolute top-[-20%] left-[-10%] h-125 w-125 rounded-full bg-indigo-600/20 blur-[120px]"></div>
            <div class="absolute right-[-10%] bottom-[-20%] h-125 w-125 rounded-full bg-purple-600/20 blur-[120px]"></div>
        </div>

        <!-- Platform Tabs (for verified platforms) -->
        {#if verifiedPlatforms.length > 0}
            <div transition:fade class="mb-6 flex justify-center">
                <div class="inline-flex rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md">
                    {#each verifiedPlatforms as platform}
                        {@const p = platforms.find(pl => pl.id === platform.platform)}
                        <button
                            onclick={() => { 
                                activePlatformId = platform.platform;
                                viewingManualSearch = false; 
                            }}
                            class="relative rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 {activePlatformId === platform.platform
                                ? 'text-black'
                                : 'text-zinc-400 hover:text-white'}"
                        >
                            {#if activePlatformId === platform.platform}
                                <div
                                    class="absolute inset-0 rounded-full bg-white shadow-lg"
                                    transition:slide|local={{ axis: 'x', duration: 300, easing: cubicOut }}
                                ></div>
                            {/if}
                            <span class="relative z-10">{p?.label ?? platform.platform}</span>
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Dashboard Tabs (Overview, Analytics, Compare) -->
        {#if activePlatformData?.platform !== 'github'}
            <div transition:fade class="mb-8 flex justify-center">
                <div class="inline-flex rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md">
                    {#each tabs as tab}
                        <button
                            onclick={() => (activeTab = tab)}
                            class="relative rounded-full px-6 py-2 text-sm font-medium transition-all duration-300 {activeTab === tab
                                ? 'text-black'
                                : 'text-zinc-400 hover:text-white'}"
                        >
                            {#if activeTab === tab}
                                <div
                                    class="absolute inset-0 rounded-full bg-white shadow-lg"
                                    transition:slide|local={{ axis: 'x', duration: 300, easing: cubicOut }}
                                ></div>
                            {/if}
                            <span class="relative z-10">{tab}</span>
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Manual Lookup Form -->
        <div class="mx-auto mb-12 max-w-2xl">
                {#if verifiedPlatforms.length === 0}
                    <p class="mb-4 text-center text-sm text-gray-400">
                        No verified platforms yet. <a href="/settings" class="text-indigo-400 hover:underline">Verify your accounts</a> for automatic analysis, or search manually below.
                    </p>
                {/if}
                <form
                    method="POST"
                    action="?/getPlatformStats"
                    use:enhance={() => {
                        loading = true;
                        return async ({ update }) => {
                            await update();
                            loading = false;
                            viewingManualSearch = true;
                        };
                    }}
                    class="relative flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/50 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20"
                >
                    <div class="relative shrink-0">
                        <input type="hidden" name="platform" value={selectedPlatform} />

                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger
                                class="flex items-center justify-between gap-2 rounded-xl border border-transparent bg-black/40 py-2.5 pr-3 pl-4 text-sm font-medium text-white ring-1 ring-white/10 transition-colors hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
                            >
                                <span>{selectedLabel}</span>
                                <svg class="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </DropdownMenu.Trigger>
                            
                            <DropdownMenu.Content class="w-[140px] border-white/10 bg-zinc-900/95 text-white backdrop-blur-xl">
                                <DropdownMenu.Group>
                                    <DropdownMenu.Label class="text-xs text-zinc-400">Select Platform</DropdownMenu.Label>
                                    <DropdownMenu.Separator class="bg-white/10" />
                                    {#each platforms as p}
                                        <DropdownMenu.Item
                                            class="cursor-pointer focus:bg-white/10 focus:text-white"
                                            onclick={() => { selectedPlatform = p.id }}
                                        >
                                            <span class={p.id === selectedPlatform ? 'text-indigo-400 font-semibold' : ''}>
                                                {p.label}
                                            </span>
                                        </DropdownMenu.Item>
                                    {/each}
                                </DropdownMenu.Group>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </div>

                    <input
                        type="text"
                        name="username"
                        placeholder="Enter username..."
                        class="w-full bg-transparent px-4 py-2.5 text-white placeholder-zinc-500 outline-none"
                        autocomplete="off"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        class="absolute right-2 shrink-0 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Lookout'}
                    </button>
                </form>

                {#if form?.message}
                    <div transition:fade class="mt-4 text-center text-sm font-medium text-red-400">
                        {form.message}
                    </div>
                {/if}
            </div>


        <!-- Dashboard Display -->
        {#if activePlatformData}
            {#if activePlatformData.platform === 'codeforces'}
                <div transition:fade={{ duration: 400 }}>
                    <CodeforcesDashboard data={activePlatformData.data} {activeTab} />
                </div>
            {:else if activePlatformData.platform === 'leetcode'}
                <div transition:fade={{ duration: 400 }}>
                    <LeetCodeDashboard data={activePlatformData.data} {activeTab} />
                </div>
            {:else if activePlatformData.platform === 'github'}
                <div transition:fade={{ duration: 400 }}>
                    <GithubDashboard data={activePlatformData.data} {activeTab} />
                </div>
            {/if}
        {/if}
    </div>
</div>