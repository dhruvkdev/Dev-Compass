<script lang="ts">
    import { Info, Calculator, Target, Lightbulb, Microscope } from 'lucide-svelte';
    import { fade, scale } from 'svelte/transition';

    let {
        title,
        definition,
        calculation,
        weighting,
        whyCare
    }: {
        title: string;
        definition: string;
        calculation: string;
        weighting?: string;
        whyCare: string;
    } = $props();

    let isOpen = $state(false);
    let triggerRef: HTMLButtonElement | undefined = $state();
    let tooltipPosition = $state({ top: 0, left: 0 });

    function portal(node: HTMLElement) {
        document.body.appendChild(node);
        return { destroy() { node.remove(); } };
    }

    function updatePosition() {
        if (triggerRef) {
            const rect = triggerRef.getBoundingClientRect();
            const padding = 12;
            const tooltipWidth = 320; // matched to w-80

            let left = rect.left + rect.width / 2;
            
            // Viewport Clamping
            left = Math.max(padding + tooltipWidth / 2, 
                   Math.min(window.innerWidth - padding - tooltipWidth / 2, left));

            tooltipPosition = {
                top: rect.bottom + 12,
                left
            };
        }
    }

    const open = () => { updatePosition(); isOpen = true; };
    const close = () => { isOpen = false; };
</script>

<svelte:window onscroll={() => isOpen && updatePosition()} onresize={() => isOpen && updatePosition()} />

<div class="relative inline-flex items-center">
    <button
        bind:this={triggerRef}
        type="button"
        class="group flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800/50 ring-1 ring-white/10 transition-all hover:bg-indigo-500/20 hover:ring-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onmouseenter={open}
        onmouseleave={close}
        onfocus={open}
        onblur={close}
        aria-label="More information about {title}"
    >
        <Info class="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-indigo-400" />
    </button>

    {#if isOpen}
        <div
            use:portal
            role="tooltip"
            in:scale={{ start: 0.95, duration: 150 }}
            out:fade={{ duration: 100 }}
            class="fixed z-[9999] w-80 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            style="top: {tooltipPosition.top}px; left: {tooltipPosition.left}px;"
        >
            <div class="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500 opacity-80"></div>

            <div class="p-4 space-y-4">
                <div class="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 class="text-sm font-bold tracking-tight text-white">{title}</h4>
                    <Microscope class="h-4 w-4 text-zinc-600" />
                </div>

                <div class="space-y-1.5">
                    <div class="flex items-center gap-1.5">
                        <div class="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">Definition</div>
                    </div>
                    <p class="text-[13px] leading-relaxed text-zinc-300">
                        {definition}
                    </p>
                </div>

                <div class="space-y-2 rounded-xl bg-black/40 p-3 ring-1 ring-white/5">
                    <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <Calculator class="h-3 w-3" /> 
                        <span>Logic</span>
                    </div>
                    <code class="block font-mono text-[11px] text-indigo-300/90 leading-tight">
                        {calculation}
                    </code>
                </div>

                {#if weighting}
                    <div class="space-y-1.5">
                        <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            <Target class="h-3 w-3" /> 
                            <span>Influencers</span>
                        </div>
                        <p class="text-[12px] text-zinc-400 italic">
                            {weighting}
                        </p>
                    </div>
                {/if}

                <div class="relative overflow-hidden rounded-xl bg-indigo-500/10 p-3 ring-1 ring-indigo-500/20">
                    <div class="relative z-10 space-y-1">
                        <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                            <Lightbulb class="h-3 w-3" />
                            <span>Insight</span>
                        </div>
                        <p class="text-[12px] leading-snug text-indigo-200/90">
                            {whyCare}
                        </p>
                    </div>
                    <div class="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-indigo-500/10 blur-xl"></div>
                </div>
            </div>

            <div
                class="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-white/10 bg-zinc-950"
            ></div>
        </div>
    {/if}
</div>

<style>
    /* Ensure the portal target isn't clipped by any parent overflow */
    :global(body) {
        position: relative;
    }
</style>