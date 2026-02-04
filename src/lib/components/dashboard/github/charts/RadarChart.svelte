<script lang="ts">
  import { Chart, Svg, Spline, Axis, Text } from 'layerchart';
  import { scaleLinear } from 'd3-scale';

  let { 
    data, 
    x = 'label', 
    y = 'score',
    max = 100 
  } = $props<{
    data: any[];
    x?: string;
    y?: string;
    max?: number;
  }>();

  // Radar chart implementation in LayerChart usually requires a custom radial line generator but let's try standard components overlaid
  // Actually LayerChart has limited built-in Radar support compared to basic charts
  // We'll treat this as a "circular" plot using Svg and Paths if needed, or if LayerChart supports radial scales.
  // Standard LayerChart doesn't explicitly have a "Radar" primitive, so we build it with Svg Group and Lines.

  // Simplified approach: Coordinate conversion
  const width = 300;
  const height = 300;
  const radius = Math.min(width, height) / 2 - 40;
  
  // Helper to get coordinates
  function getCoordinates(index: number, total: number, value: number, maxVal: number) {
      const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
      const r = (value / maxVal) * radius;
      return {
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          angle,
          r
      };
  }

  // Generate grid lines (web)
  let ticks = [20, 40, 60, 80, 100];
  
  let points = $derived(data.map((d: any, i: number) => {
      const coords = getCoordinates(i, data.length, d[y], max);
      return { ...coords, ...d };
  }));

  let pathData = $derived(points.map((p: { x: number; y: number }, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z');
</script>

<div class="h-[300px] w-full flex justify-center items-center">
    <svg viewBox="-150 -150 300 300" class="overflow-visible w-full h-full max-w-[300px]">
        <!-- Grid -->
        {#each ticks as tick}
            <g class="opacity-10">
                <circle cx="0" cy="0" r={(tick / max) * radius} fill="none" stroke="currentColor" stroke-width="1" class="text-white" />
            </g>
        {/each}
        
        <!-- Axes -->
        {#each points as p}
            <line x1="0" y1="0" x2={Math.cos(p.angle) * radius} y2={Math.sin(p.angle) * radius} stroke="currentColor" stroke-width="1" class="text-white/10" />
            
            <!-- Labels -->
            <text 
                x={Math.cos(p.angle) * (radius + 20)} 
                y={Math.sin(p.angle) * (radius + 20)} 
                text-anchor="middle" 
                dominant-baseline="middle"
                class="fill-[#8b949e] text-[10px] font-medium"
            >
                {p[x]}
            </text>
        {/each}

        <!-- Data Path -->
        <path d={pathData} fill="rgba(88, 166, 255, 0.2)" stroke="#58a6ff" stroke-width="2" />
        
        <!-- Data Points -->
        {#each points as p}
            <circle cx={p.x} cy={p.y} r="3" class="fill-[#58a6ff] stroke-[#0d1117] stroke-2" />
        {/each}
    </svg>
</div>
