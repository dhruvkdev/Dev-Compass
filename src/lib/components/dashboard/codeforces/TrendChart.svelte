<script lang="ts">
    import { Chart, Svg, Axis, Area, Highlight, Tooltip } from 'layerchart';
    import { scaleTime } from 'd3-scale';
    import { format } from 'date-fns';

    let { data, yKey, title, unit, color, icon: Icon } = $props();
</script>

<div class="group relative">
    <div class="mb-4 flex items-center gap-3">
        <div class="rounded-md p-1.5 bg-zinc-800">
            <Icon class="h-4 w-4" style="color: {color}" />
        </div>
        <span class="text-sm font-bold text-zinc-200 uppercase tracking-tighter">{title}</span>
    </div>

    <div class="h-[150px]">
        <Chart
            {data}
            x="date"
            y={yKey}
            xScale={scaleTime()}
            yDomain={[0, null]}
            padding={{ left: 35, bottom: 20 }}
            tooltip={{ mode: 'bisect-x' }}
        >
            <Svg>
                <Axis placement="left" grid={{ class: 'stroke-zinc-800/30' }} tickLabelProps={{ class: 'fill-zinc-600 text-[10px]' }} />
                <Area class="opacity-10" fill={color} line={{ class: 'stroke-2', stroke: color }} />
                <Highlight 
                    points={{ r: 4, fill: color, stroke: '#000', strokeWidth: 2 }} 
                    lines={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} 
                />
            </Svg>
            <Tooltip.Root let:data>
                <div class="rounded border border-white/10 bg-zinc-900 p-2 text-[11px]">
                    <div class="text-zinc-500">{format(data.date, 'MMM yyyy')}</div>
                    <div class="font-bold text-white">{data[yKey]} {unit}</div>
                </div>
            </Tooltip.Root>
        </Chart>
    </div>
</div>