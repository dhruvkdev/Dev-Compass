<script lang="ts">
	import {
		Flame,
		Zap,
		Trophy,
		Target,
		Calendar,
		Activity,
		TrendingUp,
		Award,
		Target as TargetIcon,
		BarChart3
	} from 'lucide-svelte';
	import { formatDistanceToNow } from 'date-fns';

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
	// 1. Generate Calendar (Last 365 Days)
	const dates: Date[] = [];
	const today = new Date();
	for (let i = 0; i < 365; i++) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		dates.push(d);
	}
	dates.reverse();

	// 2. Process Submissions
	let data = $derived.by(() => {
		const activityMap = new Map<string, { count: number; maxRating: number }>();
		let totalSubmissions = 0;
		let acceptedCount = 0;
		let fireDays = 0;
		const uniqueSolved = new Set<string>();
		let maxStreak = 0;
		let currentStreak = 0;

		if (!submissions)
			return {
				activityMap,
				stats: {
					totalSubmissions: 0,
					fireDays: 0,
					acceptanceRate: 0,
					totalSolved: 0,
					currentStreak: 0,
					maxStreak: 0
				}
			};

		totalSubmissions = submissions.length;

		// Populate Map & Counts
		for (const sub of submissions) {
			const date = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
			const current = activityMap.get(date) || { count: 0, maxRating: 0 };

			activityMap.set(date, {
				count: current.count + 1,
				maxRating:
					sub.verdict === 'OK'
						? Math.max(current.maxRating, sub.problem.rating || 0)
						: current.maxRating
			});

			if (sub.verdict === 'OK') {
				acceptedCount++;
				if (sub.problem.contestId && sub.problem.index) {
					uniqueSolved.add(`${sub.problem.contestId}-${sub.problem.index}`);
				}
			}
		}

		// Calculate Streaks & Fire Days
		const sortedDates = Array.from(activityMap.keys()).sort();
		let tempStreak = 0;
		let prevDate: Date | null = null;
		let activeStreak = 0;

		for (const dateStr of sortedDates) {
			const d = new Date(dateStr);
			const info = activityMap.get(dateStr)!;

			// Fire Day
			if (info.count >= 8) fireDays++;

			// Streak (only count active days)
			if (prevDate) {
				const diff = (d.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
				if (Math.round(diff) === 1) {
					tempStreak++;
				} else {
					tempStreak = 1;
				}
			} else {
				tempStreak = 1;
			}
			if (tempStreak > maxStreak) maxStreak = tempStreak;
			prevDate = d;
			activeStreak = tempStreak; // Track last running streak
		}

		// Check current streak (is today/yesterday active?)
		const todayStr = new Date().toISOString().split('T')[0];
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = yesterday.toISOString().split('T')[0];

		const lastActive = sortedDates[sortedDates.length - 1];
		if (lastActive === todayStr || lastActive === yesterdayStr) {
			currentStreak = activeStreak;
		}

		return {
			activityMap,
			stats: {
				totalSubmissions,
				fireDays,
				acceptanceRate:
					totalSubmissions > 0 ? ((acceptedCount / totalSubmissions) * 100).toFixed(1) : 0,
				totalSolved: uniqueSolved.size,
				currentStreak,
				maxStreak
			}
		};
	});

	// --- Visual Helpers ---
	function getIntensityColor(count: number) {
		if (count === 0) return 'bg-zinc-800/40';
		if (count <= 2) return 'bg-gradient-to-br from-orange-900/60 to-orange-800/40';
		if (count <= 5) return 'bg-gradient-to-br from-orange-700/70 to-orange-600/50';
		if (count <= 9) return 'bg-gradient-to-br from-orange-500 to-orange-400';
		return 'bg-gradient-to-br from-orange-400 to-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.7)]';
	}

	function getRatingColor(rating: number) {
		if (rating === 0) return 'bg-zinc-800/40';
		if (rating < 1200) return 'bg-gradient-to-br from-gray-600 to-gray-500';
		if (rating < 1400) return 'bg-gradient-to-br from-green-600 to-green-500';
		if (rating < 1600) return 'bg-gradient-to-br from-cyan-600 to-cyan-500';
		if (rating < 1900) return 'bg-gradient-to-br from-blue-600 to-blue-500';
		if (rating < 2100) return 'bg-gradient-to-br from-violet-600 to-violet-500';
		if (rating < 2300) return 'bg-gradient-to-br from-orange-600 to-orange-500';
		if (rating < 2400) return 'bg-gradient-to-br from-red-500 to-red-400';
		return 'bg-gradient-to-br from-red-600 to-red-500';
	}
</script>

<div class="space-y-8 p-4 md:p-6">
	<!-- Header -->
	<div class="mb-10 flex items-start justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-white">Codeforces Dashboard</h1>
			<p class="mt-1 text-sm text-zinc-400">Performance insights, ratings, and activity overview</p>
		</div>

		<div class="rounded-xl bg-white/5 px-4 py-2 text-xs text-zinc-400">Updated today</div>
	</div>

	<!-- 1. Grind Mode Card -->
	<div
		class="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 p-6 shadow-2xl backdrop-blur-xl"
	>
		<!-- Header -->
		<div class="mb-8">
			<div class="mb-4 flex items-center gap-3">
				<div class="rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 p-2.5">
					<Flame class="h-6 w-6 text-orange-400" />
				</div>
				<div>
					<h3 class="text-xl font-bold text-white">Grind Mode Intensity</h3>
					<p class="text-sm text-zinc-400">Submission heatmap - More submissions = Hotter color</p>
				</div>
			</div>

			<!-- Stats Grid -->
			<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="rounded-xl bg-gradient-to-br from-black/60 to-black/40 p-4 backdrop-blur-sm">
					<div class="mb-1 flex items-center gap-2 text-zinc-400">
						<Zap class="h-4 w-4" />
						<div class="text-xs font-semibold tracking-wider uppercase">Total Submissions</div>
					</div>
					<div class="text-2xl font-bold text-blue-300">{data.stats.totalSubmissions}</div>
				</div>
				<div class="rounded-xl bg-gradient-to-br from-black/60 to-black/40 p-4 backdrop-blur-sm">
					<div class="mb-1 flex items-center gap-2 text-zinc-400">
						<Flame class="h-4 w-4 text-orange-500" />
						<div class="text-xs font-semibold tracking-wider uppercase">Fire Days</div>
					</div>
					<div class="text-2xl font-bold text-orange-400">{data.stats.fireDays}</div>
				</div>
				<div class="rounded-xl bg-gradient-to-br from-black/60 to-black/40 p-4 backdrop-blur-sm">
					<div class="mb-1 flex items-center gap-2 text-zinc-400">
						<TargetIcon class="h-4 w-4 text-green-500" />
						<div class="text-xs font-semibold tracking-wider uppercase">Acceptance</div>
					</div>
					<div class="text-2xl font-bold text-green-400">{data.stats.acceptanceRate}%</div>
				</div>
				<div class="rounded-xl bg-gradient-to-br from-black/60 to-black/40 p-4 backdrop-blur-sm">
					<div class="mb-1 flex items-center gap-2 text-zinc-400">
						<TrendingUp class="h-4 w-4 text-purple-500" />
						<div class="text-xs font-semibold tracking-wider uppercase">Activity Level</div>
					</div>
					<div class="text-2xl font-bold text-purple-400">
						{Math.round(data.stats.totalSubmissions / 365)}
						<span class="text-sm text-zinc-500">/day</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Heatmap Container -->
		<div class="relative rounded-xl bg-black/30 p-4 backdrop-blur-sm">
			<div class="mb-3 flex items-center justify-between">
				<div class="text-sm font-medium text-zinc-300">One Year Activity Calendar</div>
				<div class="flex items-center gap-2 text-xs text-zinc-500">
					<div class="flex items-center gap-1">
						<div class="h-2 w-2 rounded-full bg-orange-900/40"></div>
						<span>Less</span>
					</div>
					<div class="flex items-center gap-1">
						<div class="h-2 w-2 rounded-full bg-orange-500"></div>
						<span>More</span>
					</div>
					<div class="flex items-center gap-1">
						<div
							class="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]"
						></div>
						<span>🔥 Fire</span>
					</div>
				</div>
			</div>

			<!-- Heatmap Grid -->
			<div
				class="scrollbar-thin scrollbar-track-zinc-800/50 scrollbar-thumb-zinc-600 flex w-full overflow-x-auto pb-4"
			>
				<div class="grid grid-flow-col grid-rows-7 gap-1.5">
					{#each dates as date}
						{@const dateStr = date.toISOString().split('T')[0]}
						{@const info = data.activityMap.get(dateStr) || { count: 0 }}

						<div
							class="group relative h-3 w-3 rounded-md {getIntensityColor(
								info.count
							)} transition-all duration-200 hover:scale-125 hover:shadow-lg"
						>
							{#if info.count >= 10}
								<div class="absolute -inset-0.5 animate-pulse rounded-md bg-orange-400/20"></div>
							{/if}
							<!-- Tooltip -->
							<div
								class="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 group-hover:block"
							>
								<div class="rounded-lg bg-zinc-900 px-3 py-2 text-xs whitespace-nowrap shadow-xl">
									<div class="font-semibold text-white">{dateStr}</div>
									<div class="mt-1 text-zinc-300">
										{info.count} submission{info.count !== 1 ? 's' : ''}
									</div>
									{#if info.count >= 10}
										<div class="mt-1 text-orange-400">🔥 Fire Day!</div>
									{/if}
								</div>
								<div
									class="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-900"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Month Labels -->
			<div class="mt-2 flex justify-between text-xs text-zinc-500">
				{#each ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as month}
					<div>{month}</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- 2. Daily Top-Rated Card -->
	<div
		class="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 p-6 shadow-2xl backdrop-blur-xl"
	>
		<!-- Header -->
		<div class="mb-8">
			<div class="mb-4 flex items-center gap-3">
				<div class="rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-2.5">
					<Trophy class="h-6 w-6 text-emerald-400" />
				</div>
				<div>
					<h3 class="text-xl font-bold text-white">Problem Progress</h3>
					<p class="text-sm text-zinc-400">Highest rated problem solved each day</p>
				</div>
			</div>

			<!-- Stats Grid -->
			<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="rounded-xl bg-gradient-to-br from-black/60 to-black/40 p-4 backdrop-blur-sm">
					<div class="mb-1 flex items-center gap-2 text-zinc-400">
						<Award class="h-4 w-4 text-indigo-400" />
						<div class="text-xs font-semibold tracking-wider uppercase">Problems Solved</div>
					</div>
					<div class="text-2xl font-bold text-indigo-300">{data.stats.totalSolved}</div>
				</div>
				<div class="rounded-xl bg-gradient-to-br from-black/60 to-black/40 p-4 backdrop-blur-sm">
					<div class="mb-1 flex items-center gap-2 text-zinc-400">
						<BarChart3 class="h-4 w-4 text-green-400" />
						<div class="text-xs font-semibold tracking-wider uppercase">Current Streak</div>
					</div>
					<div class="text-2xl font-bold text-green-400">{data.stats.currentStreak} days</div>
				</div>
				<div class="rounded-xl bg-gradient-to-br from-black/60 to-black/40 p-4 backdrop-blur-sm">
					<div class="mb-1 flex items-center gap-2 text-zinc-400">
						<TrendingUp class="h-4 w-4 text-yellow-500" />
						<div class="text-xs font-semibold tracking-wider uppercase">Best Streak</div>
					</div>
					<div class="text-2xl font-bold text-yellow-400">{data.stats.maxStreak} days</div>
				</div>
				<div class="rounded-xl bg-gradient-to-br from-black/60 to-black/40 p-4 backdrop-blur-sm">
					<div class="mb-1 flex items-center gap-2 text-zinc-400">
						<Target class="h-4 w-4 text-red-400" />
						<div class="text-xs font-semibold tracking-wider uppercase">Max Rating</div>
					</div>
					<div class="text-2xl font-bold text-red-400">
						{(() => {
							const ratings = Array.from(data.activityMap.values()).map((d) => d.maxRating);
							return Math.max(...ratings, 0);
						})()}
					</div>
				</div>
			</div>
		</div>

		<!-- Heatmap Container -->
		<div class="relative rounded-xl bg-black/30 p-4 backdrop-blur-sm">
			<div class="mb-3 flex items-center justify-between">
				<div class="text-sm font-medium text-zinc-300">Highest Rating Achieved Daily</div>
				<div class="flex items-center gap-2">
					<Calendar class="h-4 w-4 text-zinc-500" />
					<span class="text-xs text-zinc-500">Last 365 Days</span>
				</div>
			</div>

			<!-- Heatmap Grid -->
			<div
				class="scrollbar-thin scrollbar-track-zinc-800/50 scrollbar-thumb-zinc-600 flex w-full overflow-x-auto pb-4"
			>
				<div class="grid grid-flow-col grid-rows-7 gap-1.5">
					{#each dates as date}
						{@const dateStr = date.toISOString().split('T')[0]}
						{@const info = data.activityMap.get(dateStr) || { maxRating: 0 }}

						<div
							class="group relative h-3 w-3 rounded-md {getRatingColor(
								info.maxRating
							)} transition-all duration-200 hover:scale-125 hover:shadow-lg"
						>
							<!-- Tooltip -->
							<div
								class="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 group-hover:block"
							>
								<div class="rounded-lg bg-zinc-900 px-3 py-2 text-xs whitespace-nowrap shadow-xl">
									<div class="font-semibold text-white">{dateStr}</div>
									<div class="mt-1">
										<span class="text-zinc-400">Max Rating: </span>
										<span class="font-bold text-white">{info.maxRating || 'None'}</span>
									</div>
									{#if info.maxRating >= 2400}
										<div class="mt-1 text-red-400">🎯 Legendary!</div>
									{/if}
								</div>
								<div
									class="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-900"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Month Labels -->
			<div class="mt-2 flex justify-between text-xs text-zinc-500">
				{#each ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as month}
					<div>{month}</div>
				{/each}
			</div>
		</div>

		<!-- Legend -->
		<div class="mt-6 flex flex-wrap items-center justify-center gap-4 rounded-xl bg-black/20 p-4">
			<div class="text-xs font-medium text-zinc-400">Rating Legend:</div>
			<div class="flex flex-wrap items-center gap-3">
				{#each [{ color: 'bg-gray-500', label: '800+' }, { color: 'bg-green-500', label: '1200+' }, { color: 'bg-cyan-500', label: '1400+' }, { color: 'bg-blue-500', label: '1600+' }, { color: 'bg-violet-500', label: '1900+' }, { color: 'bg-orange-500', label: '2100+' }, { color: 'bg-red-600', label: '2400+' }] as item}
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-full {item.color}"></div>
						<span class="text-xs text-zinc-400">{item.label}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Summary Footer -->
	<div class="mt-8 text-center text-sm text-zinc-500">
		<p>
			Data updated • {new Date().toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}
		</p>
	</div>
</div>

<style>
	/* Custom Scrollbar */
	.scrollbar-thin::-webkit-scrollbar {
		height: 6px;
	}
	.scrollbar-thin::-webkit-scrollbar-track {
		background: rgba(39, 39, 42, 0.5);
		border-radius: 3px;
	}
	.scrollbar-thin::-webkit-scrollbar-thumb {
		background: rgba(113, 113, 122, 0.7);
		border-radius: 3px;
	}
	.scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background: rgba(161, 161, 170, 0.8);
	}
</style>
