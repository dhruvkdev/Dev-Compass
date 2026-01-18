<script lang="ts">
	import Activity from '@tabler/icons-svelte/icons/activity';
    import {
        Flame,
        Zap,
        Trophy,
        Calendar,
        TrendingUp,
        Award,
        Target as TargetIcon,
        BarChart3,
        ChevronRight,
        ChevronLeft
    } from 'lucide-svelte';

    interface Submission {
        creationTimeSeconds: number;
        verdict: string;
        problem: {
            rating?: number;
            contestId?: number;
            index?: string;
        };
    }

    let { submissions = [] }: { submissions: Submission[] } = $props();

    // --- Data Processing ---
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d);
    }
    dates.reverse();

    let data = $derived.by(() => {
        const activityMap = new Map<string, { count: number; maxRating: number }>();
        let totalSubmissions = 0;
        let acceptedCount = 0;
        let fireDays = 0;
        const uniqueSolved = new Set<string>();
        let maxStreak = 0;

        if (!submissions || submissions.length === 0) 
            return { activityMap, stats: { totalSubmissions: 0, fireDays: 0, acceptanceRate: 0, totalSolved: 0, currentStreak: 0, maxStreak: 0 }};

        totalSubmissions = submissions.length;

        for (const sub of submissions) {
            const date = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
            const current = activityMap.get(date) || { count: 0, maxRating: 0 };

            activityMap.set(date, {
                count: current.count + 1,
                maxRating: sub.verdict === 'OK' ? Math.max(current.maxRating, sub.problem.rating || 0) : current.maxRating
            });

            if (sub.verdict === 'OK') {
                acceptedCount++;
                if (sub.problem.contestId && sub.problem.index) uniqueSolved.add(`${sub.problem.contestId}-${sub.problem.index}`);
            }
        }

        const sortedDates = Array.from(activityMap.keys()).sort();
        let tempStreak = 0;
        let prevDate: Date | null = null;
        let activeStreak = 0;

        for (const dateStr of sortedDates) {
            const d = new Date(dateStr);
            const info = activityMap.get(dateStr)!;
            if (info.count >= 8) fireDays++;

            if (prevDate) {
                const diff = (d.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
                tempStreak = Math.round(diff) === 1 ? tempStreak + 1 : 1;
            } else {
                tempStreak = 1;
            }
            if (tempStreak > maxStreak) maxStreak = tempStreak;
            prevDate = d;
            activeStreak = tempStreak;
        }

        return {
            activityMap,
            stats: {
                totalSubmissions,
                fireDays,
                acceptanceRate: totalSubmissions > 0 ? ((acceptedCount / totalSubmissions) * 100).toFixed(1) : 0,
                totalSolved: uniqueSolved.size,
                currentStreak: activeStreak,
                maxStreak
            }
        };
    });

    // --- Visual Helpers ---
    function getIntensityColor(count: number) {
        if (count === 0) return 'bg-zinc-800/40';
        if (count <= 2) return 'bg-orange-900/40';
        if (count <= 5) return 'bg-orange-700/60';
        if (count <= 9) return 'bg-orange-500';
        return 'bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]';
    }

    function getRatingColor(rating: number) {
        if (rating === 0) return 'bg-zinc-800/40';
        if (rating < 1200) return 'bg-gray-500';
        if (rating < 1400) return 'bg-green-500';
        if (rating < 1600) return 'bg-cyan-500';
        if (rating < 1900) return 'bg-blue-500';
        if (rating < 2100) return 'bg-violet-500';
        if (rating < 2300) return 'bg-orange-500';
        return 'bg-red-500';
    }

    // --- Tooltip State ---
    let hoveredData = $state<{ date: string; info: any; x: number; y: number } | null>(null);

    function showTooltip(e: MouseEvent | FocusEvent, dateStr: string, info: any) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const tooltipWidth = 160;
        const padding = 12;

        // Clamp X to viewport
        let x = rect.left + rect.width / 2;
        x = Math.max(padding + tooltipWidth / 2, 
            Math.min(window.innerWidth - padding - tooltipWidth / 2, x));

        hoveredData = {
            date: dateStr,
            info,
            x,
            y: rect.top - 8
        };
    }
</script>

<div class="space-y-8 p-4 md:p-6 bg-black text-zinc-100 font-sans selection:bg-orange-500/30">
    <div class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
		<!-- Title Row -->
		<div class="flex items-center gap-4">
			<div class="rounded-xl border border-white/10 bg-indigo-500/10 p-3">
				<Activity class="h-6 w-6 text-indigo-400" />
			</div>

			<div>
				<h1 class="text-2xl font-semibold text-zinc-100">Dashboard</h1>
				<p class="mt-0.5 text-sm text-zinc-500">
					Codeforces activity & performance insights
				</p>
			</div>
		</div>
        <div class="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            <span class="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Live Data • Last 365 Days
        </div>
    </div>

    {#if data.stats.totalSubmissions === 0}
        <div class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 bg-zinc-900/20 py-20 text-center">
            <div class="mb-4 rounded-full bg-zinc-800/50 p-6">
                <BarChart3 class="h-12 w-12 text-zinc-600" />
            </div>
            <h3 class="text-xl font-bold text-white">No activity detected</h3>
            <p class="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
                We couldn't find any submissions for this handle. Start solving problems on Codeforces to see your heatmaps!
            </p>
        </div>
    {:else}
        <div class="group relative rounded-3xl border border-white/10 bg-zinc-900/30 p-6 md:p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-orange-500/20">
            <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div class="flex items-center gap-4">
                    <div class="rounded-2xl bg-orange-500/10 p-3 ring-1 ring-orange-500/20">
                        <Flame class="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold tracking-tight text-white">Grind Mode</h3>
                        <div class="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            <span>Less</span>
                            <div class="flex gap-1">
                                <div class="h-2 w-2 rounded-sm bg-zinc-800/40"></div>
                                <div class="h-2 w-2 rounded-sm bg-orange-900/40"></div>
                                <div class="h-2 w-2 rounded-sm bg-orange-700/60"></div>
                                <div class="h-2 w-2 rounded-sm bg-orange-500"></div>
                                <div class="h-2 w-2 rounded-sm bg-orange-400"></div>
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap gap-8">
                    <div class="flex items-center gap-3">
                        <Zap class="h-5 w-5 text-blue-400" />
                        <div>
                            <div class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Submissions</div>
                            <div class="text-xl font-bold leading-none text-white">{data.stats.totalSubmissions}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <Flame class="h-5 w-5 text-orange-500" />
                        <div>
                            <div class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fire Days</div>
                            <div class="text-xl font-bold leading-none text-white">{data.stats.fireDays}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="relative">
                <div class="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-zinc-950/50 to-transparent z-10"></div>
                <div class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-zinc-950/50 to-transparent z-10"></div>
                
                <div class="scrollbar-thin flex w-full overflow-x-auto pb-4 scroll-smooth">
                    <div class="grid grid-flow-col grid-rows-7 gap-1.5 px-4">
                        {#each dates as date}
                            {@const dateStr = date.toISOString().split('T')[0]}
                            {@const info = data.activityMap.get(dateStr) || { count: 0 }}
                            <div
                                tabindex="0"
                                role="gridcell"
                                class="relative h-5 w-5 -m-1 flex items-center justify-center outline-none group/cell focus-visible:ring-2 ring-white/50 rounded-sm"
                                onmouseenter={(e) => showTooltip(e, dateStr, info)}
                                onmouseleave={() => hoveredData = null}
                                onfocus={(e) => showTooltip(e as any, dateStr, info)}
                                onblur={() => hoveredData = null}
                            >
                                <div class="h-3 w-3 rounded-sm {getIntensityColor(info.count)} transition-all group-hover/cell:scale-125 group-focus/cell:scale-125">
                                    {#if info.count >= 10}
                                        <div class="absolute inset-0 animate-pulse bg-white/20 rounded-sm"></div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
                <div class="hidden md:flex items-center justify-center gap-2 mt-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    <ChevronLeft class="h-3 w-3" /> Scroll for history <ChevronRight class="h-3 w-3" />
                </div>
            </div>
        </div>

        <div class="group relative rounded-3xl border border-white/10 bg-zinc-900/30 p-6 md:p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-emerald-500/20">
            <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div class="flex items-center gap-4">
                    <div class="rounded-2xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
                        <Trophy class="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold tracking-tight text-white">Problem Progress</h3>
                        <div class="mt-1 flex flex-wrap gap-2 text-[9px] font-bold uppercase text-zinc-500">
                            <div class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-gray-500"></span> <span>&lt;1.2k</span></div>
                            <div class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-green-500"></span> <span>1.2k</span></div>
                            <div class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-cyan-500"></span> <span>1.4k</span></div>
                            <div class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-blue-500"></span> <span>1.6k</span></div>
                            <div class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-red-500"></span> <span>Expert+</span></div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap gap-8">
                    <div class="flex items-center gap-3">
                        <TrendingUp class="h-5 w-5 text-emerald-400" />
                        <div>
                            <div class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Acceptance</div>
                            <div class="text-xl font-bold leading-none text-white">{data.stats.acceptanceRate}%</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <BarChart3 class="h-5 w-5 text-purple-400" />
                        <div>
                            <div class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Max Streak</div>
                            <div class="text-xl font-bold leading-none text-white">{data.stats.maxStreak}d</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="relative rounded-2xl bg-black/40 p-4 ring-1 ring-white/5">
                <div class="scrollbar-thin flex w-full overflow-x-auto pb-4 scroll-smooth">
                    <div class="grid grid-flow-col grid-rows-7 gap-1.5 px-4">
                        {#each dates as date}
                            {@const dateStr = date.toISOString().split('T')[0]}
                            {@const info = data.activityMap.get(dateStr) || { count: 0, maxRating: 0 }}
                            <div
                                tabindex="0"
                                role="gridcell"
                                class="relative h-5 w-5 -m-1 flex items-center justify-center outline-none group/cell focus-visible:ring-2 ring-white/50 rounded-sm"
                                onmouseenter={(e) => showTooltip(e, dateStr, info)}
                                onmouseleave={() => hoveredData = null}
                                onfocus={(e) => showTooltip(e as any, dateStr, info)}
                                onblur={() => hoveredData = null}
                            >
                                <div class="h-3 w-3 rounded-sm {getRatingColor(info.maxRating)} transition-all group-hover/cell:scale-125 group-focus/cell:scale-125"></div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

{#if hoveredData}
    <div
        class="fixed z-[9999] pointer-events-none -translate-x-1/2 -translate-y-full pb-3 transition-all duration-200 ease-out"
        style="left: {hoveredData.x}px; top: {hoveredData.y}px;"
    >
        <div class="bg-zinc-950 border border-white/20 px-3 py-2.5 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md min-w-[140px]">
            <div class="flex items-center justify-between mb-2">
                <div class="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{hoveredData.date}</div>
                <Calendar class="h-3 w-3 text-zinc-600" />
            </div>
            
            <div class="space-y-1.5">
                {#if hoveredData.info.count !== undefined}
                    <div class="flex items-center justify-between gap-4">
                        <span class="text-[10px] text-zinc-400 font-medium">Activity</span>
                        <span class="text-xs text-white font-bold">{hoveredData.info.count} <small class="text-zinc-500 font-normal">subs</small></span>
                    </div>
                {/if}

                {#if hoveredData.info.maxRating > 0}
                    <div class="flex items-center justify-between gap-4">
                        <span class="text-[10px] text-zinc-400 font-medium">Peak</span>
                        <span class="text-xs text-emerald-400 font-black">{hoveredData.info.maxRating}</span>
                    </div>
                {/if}
            </div>

            {#if hoveredData.info.count >= 10}
                <div class="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-orange-400 text-[10px] font-bold italic">
                    <Flame class="h-3 w-3" /> OVERHEAT!
                </div>
            {/if}

            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-zinc-950 border-r border-b border-white/20 rotate-45"></div>
        </div>
    </div>
{/if}

<style>
    /* Custom Scrollbar for X-overflow */
    .scrollbar-thin::-webkit-scrollbar { height: 5px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
</style>