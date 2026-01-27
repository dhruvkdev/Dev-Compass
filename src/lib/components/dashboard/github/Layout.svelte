<script lang="ts">
    import { fade } from 'svelte/transition';
    import Header from './Header.svelte';
    import type { GithubProfile } from './types';
    import { onMount } from 'svelte';

    // Props using runes
    let { data, children, activeTab, onTabChange } = $props<{
        data: GithubProfile;
        children?: any;
        activeTab: string;
        onTabChange: (tab: string) => void;
    }>();

    const tabs = ['Overview', 'Activity', 'Skills', 'OSS', 'Resume'];
</script>

<div class="flex flex-col gap-6" transition:fade>
    <!-- Header Section -->
    <Header profile={data} />

    <!-- Navigation Tabs -->
    <div class="sticky top-0 z-20 -mx-4 bg-[#0d1117]/80 px-4 py-2 backdrop-blur-md sm:mx-0 sm:rounded-lg sm:px-0">
        <nav class="flex space-x-1 overflow-x-auto border-b border-[#30363d] p-1" aria-label="Tabs">
            {#each tabs as tab}
                <button
                    onclick={() => onTabChange(tab)}
                    class="group relative min-w-[100px] whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 {activeTab ===
                    tab
                        ? 'text-white'
                        : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9]'}"
                >
                    {tab}
                    {#if activeTab === tab}
                        <div
                            class="absolute bottom-0 left-0 h-0.5 w-full bg-[#f78166] shadow-[0_0_8px_rgba(247,129,102,0.6)]"
                            transition:fade={{ duration: 200 }}
                        ></div>
                    {/if}
                </button>
            {/each}
        </nav>
    </div>

    <!-- Main Content Area -->
    <main class="min-h-[400px] animate-in fade-in slide-in-from-bottom-2 duration-500">
        {@render children?.()}
    </main>
</div>
