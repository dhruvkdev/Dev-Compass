<script lang="ts">
    import { Chart, Svg, Area, Axis, LinearGradient, Spline } from 'layerchart';
    import { scaleTime } from 'd3-scale';
    import { curveMonotoneX } from 'd3-shape';

    let { data } = $props<{ data: { date: Date; value: number }[] }>();

    // Process data to be sure
    let chartData = $derived(data.sort((a, b) => a.date.getTime() - b.date.getTime()));
</script>

<div class="h-[200px] w-full p-4 rounded-xl border border-[#30363d] bg-[#161b22]">
    <Chart 
        data={chartData} 
        x="date" 
        y="value" 
        xScale={scaleTime()}
        padding={{ top: 10, bottom: 20, left: 20, right: 10 }}
    >
        <Svg>
            <Axis placement="bottom" rule class="stroke-[#30363d]" tickLabelProps={{ class: "fill-[#8b949e] text-[10px]", dy: 10 }} />
            <Axis placement="left" rule class="stroke-[#30363d]" tickLabelProps={{ class: "fill-[#8b949e] text-[10px]", dx: -5 }} />
            
            <LinearGradient id="area-gradient" stops={[
                ["0%", "rgba(88, 166, 255, 0.5)"],
                ["100%", "rgba(88, 166, 255, 0)"]
            ]} vertical />

            <Area 
                line={{ class: "stroke-[#58a6ff] stroke-2" }} 
                fill="url(#area-gradient)" 
                curve={curveMonotoneX}
            />
        </Svg>
    </Chart>
</div>
