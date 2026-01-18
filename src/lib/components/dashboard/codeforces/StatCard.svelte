<script lang="ts">
    import { Trophy } from 'lucide-svelte';
    import MetricTooltip from './MetricTooltip.svelte';
    import { fade } from 'svelte/transition';

    let { 
        title, value, subtext, icon: Icon, colorClass, 
        tooltipProps 
    } = $props();
</script>

<div
    class="rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-md transition-all hover:border-white/20 hover:bg-zinc-900/60"
    in:fade
>
    <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <div class="rounded-lg {colorClass} p-2 bg-opacity-20">
                <Icon class="h-5 w-5" />
            </div>
            <span class="text-sm font-medium text-zinc-300">{title}</span>
        </div>
        <MetricTooltip {...tooltipProps} />
    </div>
    <div class="text-4xl font-bold text-white tracking-tight">{value}</div>
    <div class="mt-2 text-sm text-zinc-500 font-medium">{subtext}</div>
</div>