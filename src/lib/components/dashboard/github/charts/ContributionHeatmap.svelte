<script lang="ts">
    import { scaleThreshold } from 'd3-scale';

    let { data } = $props<{ data: { date: string; value: number }[] }>();

    // Calculate generic calendar layout
    const today = new Date();
    // Ensure we have last 365 days
    
    // Helper to get week/day indices
    // 53 weeks, 7 days
    
    // We'll render a simple SVG grid
    const cellSize = 10;
    const cellGap = 2;
    const weekWidth = cellSize + cellGap;
    
    // Process data into a map
    let dataMap = $derived(new Map<string, number>(data.map(d => [d.date.split('T')[0], d.value])));

    // Generate last 52 weeks
    let weeks = $derived.by(() => {
        const result = [];
        const endDate = new Date();
        // Align to end of week (Saturday)
        const dayOfWeek = endDate.getDay(); // 0-6
        // shift to Saturday
        // Actually GitHub ends on today? Or fixed grid?
        // Let's perform standard GitHub style: columns are weeks (Sun-Sat or Mon-Sun).
        // Let's assume cols 0-52.
        
        // Let's generate days backwards from today
        let current = new Date(endDate);
        const allDays = [];
        for (let i = 0; i < 365; i++) {
            allDays.unshift(new Date(current));
            current.setDate(current.getDate() - 1);
        }
        
        // Group by week
        // We want 52 columns.
        // We need to figure out x/y for each date.
        // x = week index, y = day index (0=Sun, 6=Sat)
        
        // Start date of the grid
        const start = allDays[0];
        const startDay = start.getDay(); // 0=Sun
        
        // We can just iterate and calculate offset
        return allDays.map((date, i) => {
            // week index relative to start
            // To align properly like GitHub:
            const diff = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const offset = startDay;
            const weekIndex = Math.floor((diff + offset) / 7);
            const dayIndex = date.getDay();
            
            const dateStr = date.toISOString().split('T')[0];
            const val = dataMap.get(dateStr) || 0;
            
            return {
                date,
                dateStr,
                val,
                x: weekIndex,
                y: dayIndex
            };
        });
    });

    function getColor(val: number) {
        if (val === 0) return '#161b22';
        if (val < 3) return '#0e4429';
        if (val < 6) return '#006d32';
        if (val < 10) return '#26a641';
        return '#39d353';
    }
</script>

<div class="w-full overflow-x-auto">
    <div class="min-w-[700px]">
        <svg viewBox="0 0 720 100" class="w-full h-auto">
            {#each weeks as day}
                <rect
                    x={day.x * 12}
                    y={day.y * 12 + 10}
                    width="10"
                    height="10"
                    rx="2"
                    fill={getColor(day.val)}
                    class="transition-colors hover:stroke-white/20 stroke-1"
                >
                    <title>{day.dateStr}: {day.val} contributions</title>
                </rect>
            {/each}
            
            <!-- Month Labels (Simplified) -->
            <text x="0" y="8" class="text-[9px] fill-[#8b949e]">Jan</text>
            <text x="60" y="8" class="text-[9px] fill-[#8b949e]">Feb</text>
            <text x="120" y="8" class="text-[9px] fill-[#8b949e]">Mar</text>
            <text x="180" y="8" class="text-[9px] fill-[#8b949e]">Apr</text>
            <text x="240" y="8" class="text-[9px] fill-[#8b949e]">May</text>
            <text x="300" y="8" class="text-[9px] fill-[#8b949e]">Jun</text>
            <text x="360" y="8" class="text-[9px] fill-[#8b949e]">Jul</text>
            <text x="420" y="8" class="text-[9px] fill-[#8b949e]">Aug</text>
            <text x="480" y="8" class="text-[9px] fill-[#8b949e]">Sep</text>
            <text x="540" y="8" class="text-[9px] fill-[#8b949e]">Oct</text>
            <text x="600" y="8" class="text-[9px] fill-[#8b949e]">Nov</text>
            <text x="660" y="8" class="text-[9px] fill-[#8b949e]">Dec</text>
        </svg>
    </div>
</div>
