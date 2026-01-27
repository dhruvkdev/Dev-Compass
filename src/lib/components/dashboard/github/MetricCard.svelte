<script lang="ts">
    import { fade } from 'svelte/transition';

    let { label, value, icon: Icon, trend = undefined, color = "text-[#f0f6fc]" } = $props<{
        label: string;
        value: string | number;
        icon?: any;
        trend?: number; // percentage
        color?: string;
    }>();
</script>

<div 
    class="group reative overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22] p-5 shadow-sm transition-all hover:border-[#58a6ff]/50 hover:shadow-md"
    transition:fade
>
    <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-medium text-[#8b949e]">{label}</span>
        {#if Icon}
            <div class="rounded-md bg-[#0d1117] p-1.5 text-[#c9d1d9] group-hover:text-[#58a6ff] transition-colors">
                <Icon size={16} />
            </div>
        {/if}
    </div>
    
    <div class="flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight {color}">
            {value}
        </span>
        {#if trend !== undefined}
            <span class="text-xs font-medium {trend >= 0 ? 'text-green-400' : 'text-red-400'}">
                {trend > 0 ? '+' : ''}{trend}%
            </span>
        {/if}
    </div>
</div>
