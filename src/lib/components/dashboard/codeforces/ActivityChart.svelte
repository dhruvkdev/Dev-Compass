<script lang="ts">
    import { Chart, Svg, Axis, Bars, Tooltip } from 'layerchart';
    import { scaleBand } from 'd3-scale';

    let { data, xKey, title, subtitle, barColor } = $props();
</script>

<div class="rounded-2xl border border-white/8 bg-zinc-900/40 p-6">
    <div class="mb-6">
        <h3 class="text-md font-bold text-white">{title}</h3>
        <p class="text-xs text-zinc-500">{subtitle}</p>
    </div>

    <div class="h-[180px]">
        <Chart
            {data}
            x={xKey}
            y="value"
            xScale={scaleBand().padding(0.4)}
            yDomain={[0, null]}
            padding={{ left: 30, bottom: 30 }}
            tooltip={{ mode: 'bisect-x' }}
        >
            <Svg>
                <Axis placement="left" grid={{ class: 'stroke-zinc-800/50' }} tickLabelProps={{ class: 'fill-zinc-600 text-[10px]' }} />
                <Axis placement="bottom" tickLabelProps={{ class: 'fill-zinc-400 text-[10px] font-bold' }} />
                <Bars radius={4} class="fill-current transition-opacity hover:opacity-100 opacity-60" style="color: {barColor}" />
            </Svg>
            <Tooltip.Root let:data>
                <div class="text-xs bg-zinc-950 border border-white/10 rounded px-3 py-2 shadow-xl">
                    <div class="font-bold text-white mb-1">{data[xKey]}</div>
                    <div class="flex justify-between gap-4 text-zinc-400">
                        <span>Total:</span> <span class="text-white">{data.value}</span>
                    </div>
                    <div class="flex justify-between gap-4 text-zinc-400">
                        <span>Success:</span> <span class="text-emerald-400">{data.successRate}%</span>
                    </div>
                </div>
            </Tooltip.Root>
        </Chart>
    </div>
</div>