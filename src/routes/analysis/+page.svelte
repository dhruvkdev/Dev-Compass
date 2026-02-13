<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
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
    let viewingManualSearch = $derived(!!form?.success);

    // Get data for currently active platform
    const activePlatformData = $derived(
        viewingManualSearch && form?.success
            ? { platform: form.platform, data: form.data }
            : verifiedPlatforms.find((p: { platform: string }) => p.platform === activePlatformId)
    );

    const tabs = ['Overview', 'Analytics', 'Compare'];
    const platforms = [
        { id: 'codeforces', label: 'Codeforces', color: 'text-red-500'},
        { id: 'leetcode', label: 'LeetCode', color: 'text-yellow-500' },
        { id: 'github', label: 'GitHub', color: 'text-white' }
    ];

    let selectedLabel = $derived(platforms.find(p => p.id === selectedPlatform)?.label ?? 'Select Platform');
</script>

<div class="relative min-h-screen bg-black pb-20 pt-30">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <RisingParticles particleCount={40} className="z-0" />
            <div class="absolute top-[-20%] left-[-10%] h-125 w-125 rounded-full bg-indigo-600/20 blur-[120px]"></div>
            <div class="absolute right-[-10%] bottom-[-20%] h-125 w-125 rounded-full bg-purple-600/20 blur-[120px]"></div>
        </div>

        <!-- Header Section with Platform Selection -->
        <div class="relative z-10 mb-8">
            <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
                <!-- Platform Tabs (for verified platforms) -->
                {#if verifiedPlatforms.length > 0}
                        <div class="flex flex-wrap items-center gap-2">
                        <div class="flex flex-wrap gap-2">
                            {#each verifiedPlatforms as platform}
                                {@const p = platforms.find(pl => pl.id === platform.platform)}
                                <button
                                    onclick={() => { 
                                        activePlatformId = platform.platform;
                                        viewingManualSearch = false; 
                                    }}
                                    class="group relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200
                                        {activePlatformId === platform.platform
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}"
                                >
                                    <span>{p?.label ?? platform.platform}</span>
                                    {#if activePlatformId === platform.platform}
                                        <span class="absolute -bottom-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-indigo-400"></span>
                                    {/if}
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- Dashboard Navigation Tabs - Redesigned as modern segmented control -->
                {#if activePlatformData?.platform !== 'github'}
                    <div class="flex items-center gap-3 rounded-xl bg-white/5 p-1.5 backdrop-blur-sm ring-1 ring-white/10">
                        {#each tabs as tab}
                            <button
                                onclick={() => (activeTab = tab)}
                                class="relative px-5 py-2 text-sm font-medium transition-all duration-200 rounded-lg
                                    {activeTab === tab
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'}"
                            >
                                {tab}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Manual Lookup Form - Enhanced with better visual design -->
        <div class="relative z-10 mx-auto mb-16 max-w-3xl">
            {#if verifiedPlatforms.length === 0}
                <div class="mb-6 text-center">
                    <p class="text-sm text-zinc-400">
                        No verified platforms yet. 
                        <a href="/verify" class="font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
                            Verify your accounts →
                        </a>
                    </p>
                </div>
            {/if}

            <div class="group relative">
                <!-- Glow effect on focus -->
                <div class="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 blur transition duration-500 group-focus-within:opacity-30"></div>
                
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
                    class="relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/90 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-indigo-500/50 sm:flex-row"
                >
                    <div class="relative flex-1">
                        <input
                            type="text"
                            name="username"
                            placeholder="Enter username to analyze..."
                            class="h-12 w-full rounded-xl bg-black/40 px-12 text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition-all focus:ring-2 focus:ring-indigo-500"
                            autocomplete="off"
                        />
                        <div class="absolute left-4 top-1/2 -translate-y-1/2">
                            <svg class="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <input type="hidden" name="platform" value={selectedPlatform} />

                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger
                            class="flex h-12 items-center justify-between gap-2 rounded-xl border border-transparent bg-black/40 px-4 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-black/60 hover:ring-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
                        >
                            <span class="flex items-center gap-2">
                                <span>{selectedLabel}</span>
                            </span>
                            <svg class="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </DropdownMenu.Trigger>
                        
                        <DropdownMenu.Content class="w-[160px] border-white/10 bg-zinc-900 text-white backdrop-blur-xl">
                            <DropdownMenu.Group>
                                <DropdownMenu.Label class="px-2 py-1.5 text-xs text-zinc-400">Select Platform</DropdownMenu.Label>
                                <DropdownMenu.Separator class="bg-white/10" />
                                {#each platforms as p}
                                    <DropdownMenu.Item
                                        class="flex cursor-pointer items-center gap-2 focus:bg-indigo-600/20 focus:text-white"
                                        onclick={() => { selectedPlatform = p.id }}
                                    >
                                        <span class={p.id === selectedPlatform ? 'font-semibold text-indigo-400' : ''}>
                                            {p.label}
                                        </span>
                                    </DropdownMenu.Item>
                                {/each}
                            </DropdownMenu.Group>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>

                    <button
                        type="submit"
                        disabled={loading}
                        class="relative h-12 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-600/40 disabled:opacity-50"
                    >
                        <span class="relative z-10 flex items-center gap-2">
                            {#if loading}
                                <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Searching...</span>
                            {:else}
                                <span>Analyze</span>
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            {/if}
                        </span>
                    </button>
                </form>
            </div>

            {#if form?.message}
                <div transition:fade class="mt-4 text-center text-sm font-medium text-red-400">
                    {form.message}
                </div>
            {/if}
        </div>

        <!-- Dashboard Display -->
        {#if activePlatformData}
            <div class="relative z-10">
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
            </div>
        {:else}
            <!-- Empty State -->
            <div class="relative z-10 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-20 backdrop-blur-sm">
                <div class="mb-4 text-6xl opacity-50">📊</div>
                <h3 class="mb-2 text-xl font-semibold text-white">No Data to Display</h3>
                <p class="text-zinc-400">Select a platform or search for a user to view analytics</p>
            </div>
        {/if}
    </div>
</div>