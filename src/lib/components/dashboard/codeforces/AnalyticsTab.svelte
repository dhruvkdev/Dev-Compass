<script lang="ts">
	import { Chart, Svg, Axis, Area, Bars, Spline, Points, Highlight, Tooltip } from 'layerchart';
	import { scaleBand, scaleTime } from 'd3-scale';
	import { max, mean, groups, sum } from 'd3-array';
	import { curveCardinalClosed } from 'd3-shape';
	import { format } from 'date-fns';
	import {
		Calendar,
		Clock,
		Zap,
		Database,
		Activity,
		Target,
		TrendingUp,
		Trophy,
		Flame,
		Award,
		CheckCircle,
		XCircle,
		Timer,
		HardDrive
	} from 'lucide-svelte';
	import MetricTooltip from './MetricTooltip.svelte';

	interface Submission {
		creationTimeSeconds: number;
		verdict: string;
		timeConsumedMillis: number;
		memoryConsumedBytes: number;
		problem: {
			rating?: number;
			tags?: string[];
			contestId?: number;
			index?: string;
		};
	}

	let { data }: { data: { submissions: Submission[]; rating?: any[]; info?: any } } = $props();

	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// Tooltip context for charts
	let activityTooltipContext: any = $state(null);
	let performanceTooltipContext: any = $state(null);
	let memoryTooltipContext: any = $state(null);

	// --- Core Stats ---
	let coreStats = $derived.by(() => {
		const subs = data.submissions || [];
		const accepted = subs.filter((s) => s.verdict === 'OK');
		const uniqueSolved = new Set(accepted.map((s) => `${s.problem?.contestId}-${s.problem?.index}`))
			.size;
		const avgRating = Math.round(
			mean(
				accepted.filter((s) => s.problem?.rating),
				(s) => s.problem?.rating || 0
			) || 0
		);
		const maxRating = max(
			accepted.filter((s) => s.problem?.rating),
			(s) => s.problem?.rating || 0
		);
		const totalTags = new Set(subs.flatMap((s) => s.problem?.tags || [])).size;

		return {
			totalSubmissions: subs.length,
			accepted: accepted.length,
			uniqueSolved,
			avgRating,
			maxRating: maxRating || 0,
			successRate: subs.length > 0 ? Math.round((accepted.length / subs.length) * 100) : 0,
			contests: (data.rating || []).length,
			totalTags
		};
	});

	// --- Activity by Day ---
	let activityByDay = $derived.by(() => {
		const counts = new Array(7).fill(0);
		for (const sub of data.submissions || []) {
			const day = new Date(sub.creationTimeSeconds * 1000).getDay();
			counts[day]++;
		}
		return dayNames.map((name, i) => ({ name, value: counts[i] }));
	});

	let mostActiveDay = $derived(
		activityByDay.reduce((a, b) => (b.value > a.value ? b : a), { name: '-', value: 0 })
	);

	// --- Activity by Hour ---
	let activityByHour = $derived.by(() => {
		const counts = new Array(24).fill(0);
		for (const sub of data.submissions || []) {
			const hour = new Date(sub.creationTimeSeconds * 1000).getHours();
			counts[hour]++;
		}
		return counts.map((value, hour) => ({ hour: `${hour}:00`, value }));
	});

	let mostActiveHour = $derived(
		activityByHour.reduce((a, b) => (b.value > a.value ? b : a), { hour: '-', value: 0 })
	);

	// --- Performance Trends (Time Series) ---
	let performanceTrends = $derived.by(() => {
		const subs = data.submissions || [];
		if (subs.length === 0) return [];

		const byMonth = groups(subs, (s: Submission) => {
			const d = new Date(s.creationTimeSeconds * 1000);
			return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		});

		return byMonth
			.map(([month, submissions]: [string, Submission[]]) => {
				const acceptedSubs = submissions.filter((s: Submission) => s.verdict === 'OK');
				const avgTime =
					acceptedSubs.length > 0
						? mean(acceptedSubs, (s: Submission) => s.timeConsumedMillis) || 0
						: 0;
				const avgMemory =
					acceptedSubs.length > 0
						? mean(acceptedSubs, (s: Submission) => s.memoryConsumedBytes / (1024 * 1024)) || 0
						: 0;
				const [year, mon] = month.split('-').map(Number);
				return {
					date: new Date(year, mon - 1, 1),
					month,
					avgTime: Math.round(avgTime),
					avgMemory: Math.round(avgMemory * 100) / 100,
					submissions: submissions.length,
					accepted: acceptedSubs.length
				};
			})
			.sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
			.slice(-12);
	});

	// --- Consistency Score ---
	let consistencyData = $derived.by(() => {
		const subs = data.submissions || [];
		if (subs.length === 0) return [];

		const byMonth = groups(subs, (s: Submission) => {
			const d = new Date(s.creationTimeSeconds * 1000);
			return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		});

		return byMonth
			.map(([month, submissions]: [string, Submission[]]) => {
				const activeDays = new Set(
					submissions.map((s: Submission) => new Date(s.creationTimeSeconds * 1000).toDateString())
				).size;
				const [year, mon] = month.split('-').map(Number);
				const daysInMonth = new Date(year, mon, 0).getDate();
				const consistency = Math.round((activeDays / daysInMonth) * 100);
				return { month, activeDays, daysInMonth, consistency };
			})
			.sort((a: any, b: any) => a.month.localeCompare(b.month))
			.slice(-12);
	});

	let avgConsistency = $derived(
		consistencyData.length > 0
			? Math.round(mean(consistencyData, (d: any) => d.consistency) || 0)
			: 0
	);

	// --- Skill Radar Data (Top 8 Tags for Radar) ---
	let skillRadarData = $derived.by(() => {
		const tagCounts: Record<string, { solved: number; attempted: number }> = {};

		for (const sub of data.submissions || []) {
			const tags = sub.problem.tags || [];
			for (const tag of tags) {
				if (!tagCounts[tag]) tagCounts[tag] = { solved: 0, attempted: 0 };
				tagCounts[tag].attempted++;
				if (sub.verdict === 'OK') tagCounts[tag].solved++;
			}
		}

		const sorted = Object.entries(tagCounts)
			.map(([tag, counts]) => ({
				name: tag.replace(/-/g, ' '),
				value: counts.solved,
				attempted: counts.attempted,
				successRate: Math.round((counts.solved / counts.attempted) * 100)
			}))
			.sort((a, b) => b.value - a.value)
			.slice(0, 8);

		// Normalize to 0-10 scale for radar
		const maxVal = max(sorted, (d: any) => d.value) || 1;
		return sorted.map((d) => ({ ...d, value: Math.round((d.value / maxVal) * 10) }));
	});

	// --- Rating Distribution ---
	let ratingDistribution = $derived.by(() => {
		const solved = (data.submissions || []).filter((s) => s.verdict === 'OK' && s.problem?.rating);
		const ranges = [
			{ range: '800-1000', min: 800, max: 1000, count: 0, color: 'bg-gray-500' },
			{ range: '1100-1300', min: 1100, max: 1300, count: 0, color: 'bg-green-500' },
			{ range: '1400-1600', min: 1400, max: 1600, count: 0, color: 'bg-cyan-500' },
			{ range: '1700-1900', min: 1700, max: 1900, count: 0, color: 'bg-blue-500' },
			{ range: '2000-2200', min: 2000, max: 2200, count: 0, color: 'bg-violet-500' },
			{ range: '2300+', min: 2300, max: 9999, count: 0, color: 'bg-orange-500' }
		];

		for (const sub of solved) {
			const rating = sub.problem?.rating || 0;
			for (const r of ranges) {
				if (rating >= r.min && rating <= r.max) {
					r.count++;
					break;
				}
			}
		}

		const total = sum(ranges, (r: any) => r.count) || 1;
		return ranges.map((r) => ({ ...r, percent: Math.round((r.count / total) * 100) }));
	});

	// --- Recent Activity Summary ---
	let recentActivity = $derived.by(() => {
		const subs = (data.submissions || []).slice(0, 50);
		const last7Days = subs.filter(
			(s) => Date.now() - s.creationTimeSeconds * 1000 < 7 * 24 * 60 * 60 * 1000
		);
		const last30Days = subs.filter(
			(s) => Date.now() - s.creationTimeSeconds * 1000 < 30 * 24 * 60 * 60 * 1000
		);

		return {
			last7Days: last7Days.length,
			last30Days: last30Days.length,
			last7DaysAccepted: last7Days.filter((s) => s.verdict === 'OK').length,
			last30DaysAccepted: last30Days.filter((s) => s.verdict === 'OK').length
		};
	});
</script>

<div class="space-y-6">
	<!-- Primary KPIs - Large Cards (2x2 grid) -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
		<!-- Problems Solved -->
		<div
			class="rounded-2xl border border-white/8 bg-gradient-to-br from-indigo-900/20 to-indigo-950/40 p-6 backdrop-blur-md transition-all hover:border-white/12"
		>
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-indigo-500/20 p-2">
						<Trophy class="h-5 w-5 text-indigo-400" />
					</div>
					<span class="text-sm font-medium text-indigo-300">Problems Solved</span>
				</div>
				<MetricTooltip
					title="Problems Solved"
					definition="Total number of unique problems you've solved with an accepted (AC) verdict."
					calculation="COUNT(DISTINCT problems WHERE verdict = 'OK')"
					weighting="Only counts problems solved at least once, not total AC submissions"
					whyCare="This is your core achievement metric. More solved problems = broader problem-solving experience."
				/>
			</div>
			<div class="text-4xl font-bold text-white">{coreStats.uniqueSolved}</div>
			<div class="mt-2 text-sm text-indigo-400/70">
				{coreStats.accepted} total accepted
			</div>
		</div>

		<!-- Success Rate -->
		<div
			class="rounded-2xl border border-white/8 bg-gradient-to-br from-green-900/20 to-green-950/40 p-6 backdrop-blur-md transition-all hover:border-white/12"
		>
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-green-500/20 p-2">
						<CheckCircle class="h-5 w-5 text-green-400" />
					</div>
					<span class="text-sm font-medium text-green-300">Success Rate</span>
				</div>
				<MetricTooltip
					title="Success Rate"
					definition="Percentage of your submissions that were accepted on the platform."
					calculation="(Accepted Submissions ÷ Total Submissions) × 100"
					weighting="Both correct and incorrect submissions count. Practice problems and contest submissions are weighted equally"
					whyCare="Higher success rates indicate efficient problem-solving and fewer wrong attempts. Target 50%+ for consistent growth."
				/>
			</div>
			<div class="text-4xl font-bold text-white">{coreStats.successRate}%</div>
			<div class="mt-2 text-sm text-green-400/70">
				{coreStats.accepted} / {coreStats.totalSubmissions} submissions
			</div>
		</div>

		<!-- Average Rating -->
		<div
			class="rounded-2xl border border-white/8 bg-gradient-to-br from-orange-900/20 to-orange-950/40 p-6 backdrop-blur-md transition-all hover:border-white/12"
		>
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-orange-500/20 p-2">
						<Flame class="h-5 w-5 text-orange-400" />
					</div>
					<span class="text-sm font-medium text-orange-300">Avg Rating</span>
				</div>
				<MetricTooltip
					title="Average Problem Rating"
					definition="Mean difficulty rating of all problems you've successfully solved."
					calculation="SUM(problem.rating WHERE verdict='OK') ÷ COUNT(solved problems)"
					weighting="Only includes problems with assigned rating values. Unrated problems are excluded from this calculation"
					whyCare="Shows your current skill level. Progressively solve harder problems to increase this metric."
				/>
			</div>
			<div class="text-4xl font-bold text-white">{coreStats.avgRating}</div>
			<div class="mt-2 text-sm text-orange-400/70">max: {coreStats.maxRating}</div>
		</div>

		<!-- Consistency Score -->
		<div
			class="rounded-2xl border border-white/8 bg-gradient-to-br from-cyan-900/20 to-cyan-950/40 p-6 backdrop-blur-md transition-all hover:border-white/12"
		>
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-cyan-500/20 p-2">
						<Activity class="h-5 w-5 text-cyan-400" />
					</div>
					<span class="text-sm font-medium text-cyan-300">Consistency</span>
				</div>
				<MetricTooltip
					title="Consistency Score"
					definition="Percentage of days you were active each month, averaged over the last 12 months."
					calculation="AVG((Active Days in Month ÷ Total Days in Month) × 100)"
					weighting="Each month weighted equally. A day is 'active' if you made at least one submission"
					whyCare="Consistency beats intensity. Regular practice (even 30min/day) compounds faster than sporadic marathons."
				/>
			</div>
			<div class="text-4xl font-bold text-white">{avgConsistency}%</div>
			<div class="mt-2 text-sm text-cyan-400/70">12-month average</div>
		</div>
	</div>

	<!-- Secondary Metrics - Compact Row -->
	<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
		<!-- Contests -->
		<div class="rounded-xl border border-white/8 bg-zinc-900/40 p-4 backdrop-blur-sm">
			<div class="mb-2 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Award class="h-4 w-4 text-purple-400" />
					<span class="text-xs font-medium text-purple-300">Contests</span>
				</div>
				<MetricTooltip
					title="Contest Participation"
					definition="Total number of rated contests you've participated in."
					calculation="COUNT(contests participated)"
					whyCare="Contests test your speed and accuracy under pressure. They're the best way to track competitive growth."
				/>
			</div>
			<div class="text-2xl font-bold text-white">{coreStats.contests}</div>
		</div>

		<!-- Topics Covered -->
		<div class="rounded-xl border border-white/8 bg-zinc-900/40 p-4 backdrop-blur-sm">
			<div class="mb-2 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Target class="h-4 w-4 text-rose-400" />
					<span class="text-xs font-medium text-rose-300">Topics</span>
				</div>
				<MetricTooltip
					title="Topics Covered"
					definition="Number of unique algorithmic topics/tags you've encountered across all submissions."
					calculation="COUNT(DISTINCT problem.tags)"
					whyCare="Breadth matters. Wide topic coverage makes you a versatile problem solver and prepares you for any contest."
				/>
			</div>
			<div class="text-2xl font-bold text-white">{coreStats.totalTags}</div>
		</div>

		<!-- Recent Activity (7-day) -->
		<div class="rounded-xl border border-white/8 bg-zinc-900/40 p-4 backdrop-blur-sm">
			<div class="mb-2 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Zap class="h-4 w-4 text-yellow-400" />
					<span class="text-xs font-medium text-yellow-300">7-Day Streak</span>
				</div>
				<MetricTooltip
					title="Recent Activity (7 Days)"
					definition="Your submission activity in the last 7 days."
					calculation="COUNT(submissions WHERE date >= NOW() - 7 days)"
					whyCare="Shows your current momentum. Daily practice builds habits that lead to long-term success."
				/>
			</div>
			<div class="text-2xl font-bold text-white">
				{recentActivity.last7DaysAccepted}/{recentActivity.last7Days}
			</div>
			<div class="text-xs text-zinc-500">accepted / total</div>
		</div>
	</div>

	<!-- Activity Pattern Section -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Weekly Activity Pattern -->
		<div class="rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold text-white">Weekly Pattern</h3>
					<p class="text-sm text-zinc-500">Your most productive days</p>
				</div>
				<div class="rounded-xl bg-blue-500/10 px-4 py-2 text-right">
					<div class="text-xl font-bold text-blue-400">{mostActiveDay.name}</div>
					<div class="text-xs text-blue-400/60">{mostActiveDay.value} submissions</div>
				</div>
			</div>

			{#if activityByDay.some((d) => d.value > 0)}
				<div class="h-[200px]">
					<Chart
						data={activityByDay}
						x="name"
						y="value"
						xScale={scaleBand().padding(0.4)}
						yDomain={[0, null]}
						yNice
						padding={{ left: 40, bottom: 32, right: 16, top: 16 }}
					>
						<Svg>
							<Axis
								placement="left"
								rule={{ class: 'stroke-zinc-700' }}
								grid={{ class: 'stroke-zinc-800/30' }}
								tickLabelProps={{ class: 'fill-zinc-500 text-xs' }}
							/>
							<Axis
								placement="bottom"
								rule={{ class: 'stroke-zinc-700' }}
								tickLabelProps={{ class: 'fill-zinc-400 text-xs font-medium' }}
							/>
							<Bars radius={6} class="fill-blue-500/70 transition-colors hover:fill-blue-400" />
						</Svg>
					</Chart>
				</div>
			{:else}
				<div class="flex h-[200px] items-center justify-center text-sm text-zinc-500">
					No activity data yet. Start solving to see your weekly patterns!
				</div>
			{/if}
		</div>

		<!-- Hourly Activity Pattern -->
		<div class="rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold text-white">Daily Rhythm</h3>
					<p class="text-sm text-zinc-500">Peak productivity hours</p>
				</div>
				<div class="rounded-xl bg-purple-500/10 px-4 py-2 text-right">
					<div class="text-xl font-bold text-purple-400">{mostActiveHour.hour}</div>
					<div class="text-xs text-purple-400/60">{mostActiveHour.value} submissions</div>
				</div>
			</div>

			{#if activityByHour.some((d) => d.value > 0)}
				<div class="h-[200px]">
					<Chart
						data={activityByHour}
						x="hour"
						y="value"
						xScale={scaleBand().padding(0.15)}
						yDomain={[0, null]}
						yNice
						padding={{ left: 40, bottom: 32, right: 16, top: 16 }}
					>
						<Svg>
							<Axis
								placement="left"
								rule={{ class: 'stroke-zinc-700' }}
								grid={{ class: 'stroke-zinc-800/30' }}
								tickLabelProps={{ class: 'fill-zinc-500 text-xs' }}
							/>
							<Axis
								placement="bottom"
								rule={{ class: 'stroke-zinc-700' }}
								ticks={['0:00', '6:00', '12:00', '18:00', '23:00']}
								tickLabelProps={{ class: 'fill-zinc-400 text-xs' }}
							/>
							<Bars radius={3} class="fill-purple-500/70" />
						</Svg>
					</Chart>
				</div>
			{:else}
				<div class="flex h-[200px] items-center justify-center text-sm text-zinc-500">
					No activity data yet. Start solving to discover your peak hours!
				</div>
			{/if}
		</div>
	</div>

	<!-- Performance Trends (Area Charts) -->
	<div class="rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm">
		<div class="mb-6">
			<h3 class="text-lg font-semibold text-white">Performance Over Time</h3>
			<p class="text-sm text-zinc-500">Monthly execution time and memory trends</p>
		</div>

		{#if performanceTrends.length > 0}
			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Execution Time Area Chart -->
				<div class="rounded-xl border border-white/5 bg-black/20 p-4">
					<div class="mb-4 flex items-center gap-3">
						<div class="rounded-lg bg-orange-500/20 p-2">
							<Timer class="h-4 w-4 text-orange-400" />
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<div class="text-sm font-medium text-white">Execution Time</div>
								<MetricTooltip
									title="Average Execution Time"
									definition="Mean time taken by your accepted solutions each month."
									calculation="AVG(timeConsumedMillis WHERE verdict='OK') per month"
									weighting="Only counts accepted submissions. Faster is better, but correctness comes first"
									whyCare="Track optimization skills. Lower trends show you're writing more efficient code over time."
								/>
							</div>
							<div class="text-xs text-zinc-500">Average ms per solution</div>
						</div>
						<div class="text-right">
							<div class="text-xl font-bold text-orange-400">
								{performanceTrends[performanceTrends.length - 1]?.avgTime || 0}ms
							</div>
							<div class="text-xs text-zinc-500">latest</div>
						</div>
					</div>

					<div class="h-[180px]">
						<Chart
							data={performanceTrends}
							x="date"
							y="avgTime"
							xScale={scaleTime()}
							yDomain={[0, null]}
							yNice
							padding={{ left: 48, bottom: 32, right: 16, top: 8 }}
							tooltip={{ mode: 'bisect-x' }}
							bind:tooltipContext={performanceTooltipContext}
						>
							<Svg>
								<Axis
									placement="left"
									rule={{ class: 'stroke-zinc-700' }}
									grid={{ class: 'stroke-zinc-800/20' }}
									tickLabelProps={{ class: 'fill-zinc-500 text-xs' }}
								/>
								<Axis
									placement="bottom"
									rule={{ class: 'stroke-zinc-700' }}
									format={(d) => format(d, 'MMM')}
									tickLabelProps={{ class: 'fill-zinc-500 text-xs' }}
								/>
								<Area class="fill-orange-500/15" line={{ class: 'stroke-orange-500 stroke-2' }} />
								<Highlight points lines={{ class: 'stroke-orange-400' }} />
							</Svg>
							<Tooltip.Root>
								<Tooltip.Header
									>{performanceTooltipContext?.data
										? format(performanceTooltipContext.data.date, 'MMM yyyy')
										: ''}</Tooltip.Header
								>
								<Tooltip.List>
									<Tooltip.Item
										label="Avg Time"
										value="{performanceTooltipContext?.data?.avgTime || 0}ms"
									/>
								</Tooltip.List>
							</Tooltip.Root>
						</Chart>
					</div>
				</div>

				<!-- Memory Usage Area Chart -->
				<div class="rounded-xl border border-white/5 bg-black/20 p-4">
					<div class="mb-4 flex items-center gap-3">
						<div class="rounded-lg bg-cyan-500/20 p-2">
							<HardDrive class="h-4 w-4 text-cyan-400" />
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<div class="text-sm font-medium text-white">Memory Usage</div>
								<MetricTooltip
									title="Average Memory Usage"
									definition="Mean memory consumed by your accepted solutions each month."
									calculation="AVG(memoryConsumedBytes WHERE verdict='OK') per month"
									weighting="Only counts accepted submissions. Lower memory = more space-efficient algorithms"
									whyCare="Memory optimization is crucial for competitive programming. Efficient solutions use less space."
								/>
							</div>
							<div class="text-xs text-zinc-500">Average MB per solution</div>
						</div>
						<div class="text-right">
							<div class="text-xl font-bold text-cyan-400">
								{performanceTrends[performanceTrends.length - 1]?.avgMemory?.toFixed(1) || 0}MB
							</div>
							<div class="text-xs text-zinc-500">latest</div>
						</div>
					</div>

					<div class="h-[180px]">
						<Chart
							data={performanceTrends}
							x="date"
							y="avgMemory"
							xScale={scaleTime()}
							yDomain={[0, null]}
							yNice
							padding={{ left: 48, bottom: 32, right: 16, top: 8 }}
							tooltip={{ mode: 'bisect-x' }}
							bind:tooltipContext={memoryTooltipContext}
						>
							<Svg>
								<Axis
									placement="left"
									rule={{ class: 'stroke-zinc-700' }}
									grid={{ class: 'stroke-zinc-800/20' }}
									tickLabelProps={{ class: 'fill-zinc-500 text-xs' }}
								/>
								<Axis
									placement="bottom"
									rule={{ class: 'stroke-zinc-700' }}
									format={(d) => format(d, 'MMM')}
									tickLabelProps={{ class: 'fill-zinc-500 text-xs' }}
								/>
								<Area class="fill-cyan-500/15" line={{ class: 'stroke-cyan-500 stroke-2' }} />
								<Highlight points lines={{ class: 'stroke-cyan-400' }} />
							</Svg>
							<Tooltip.Root>
								<Tooltip.Header
									>{memoryTooltipContext?.data
										? format(memoryTooltipContext.data.date, 'MMM yyyy')
										: ''}</Tooltip.Header
								>
								<Tooltip.List>
									<Tooltip.Item
										label="Avg Memory"
										value="{memoryTooltipContext?.data?.avgMemory?.toFixed(1) || 0}MB"
									/>
								</Tooltip.List>
							</Tooltip.Root>
						</Chart>
					</div>
				</div>
			</div>
		{:else}
			<div
				class="flex h-40 items-center justify-center rounded-xl bg-white/5 text-sm text-zinc-500"
			>
				No performance data yet. Solve some problems to track your optimization trends!
			</div>
		{/if}
	</div>

	<!-- Skills & Distribution Row -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Skill Radar Chart -->
		<div class="rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold text-white">Skill Proficiency</h3>
					<p class="text-sm text-zinc-500">Topic mastery by problem count</p>
				</div>
				<MetricTooltip
					title="Skill Proficiency Radar"
					definition="Your top 8 algorithmic topics, normalized by solved problem count."
					calculation="Solved problems per tag, scaled 0-10 (10 = your most-solved topic)"
					weighting="Higher values = more problems solved in that category"
					whyCare="Identify your strengths and gaps. Balance specialization with breadth for well-rounded skills."
				/>
			</div>

			{#if skillRadarData.length > 0}
				<div class="h-[280px]">
					<Chart
						data={skillRadarData}
						x="name"
						xScale={scaleBand()}
						y="value"
						yPadding={[0, 2]}
						padding={{ top: 40, bottom: 16 }}
						radial
					>
						<Svg center>
							<Axis
								placement="radius"
								grid={{ class: 'stroke-zinc-700/40 fill-zinc-900/20' }}
								ticks={[0, 5, 10]}
								format={() => ''}
							/>
							<Axis
								placement="angle"
								grid={{ class: 'stroke-zinc-700/30' }}
								tickLabelProps={{ class: 'fill-zinc-400 text-xs' }}
							/>
							<Spline
								curve={curveCardinalClosed}
								class="fill-rose-500/15 stroke-rose-500 stroke-2"
							/>
							<Points class="fill-rose-400 stroke-zinc-900" />
						</Svg>
					</Chart>
				</div>

				<!-- Legend -->
				<div class="mt-4 grid grid-cols-2 gap-2 text-xs">
					{#each skillRadarData as skill}
						<div
							class="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
						>
							<span class="text-zinc-300 capitalize">{skill.name}</span>
							<span class="font-medium text-rose-400">{skill.successRate}%</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex h-64 items-center justify-center text-sm text-zinc-500">
					Solve problems to build your skill radar!
				</div>
			{/if}
		</div>

		<!-- Rating Distribution -->
		<div class="rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold text-white">Difficulty Distribution</h3>
					<p class="text-sm text-zinc-500">Problems solved by rating range</p>
				</div>
				<MetricTooltip
					title="Rating Distribution"
					definition="Breakdown of solved problems across difficulty ranges."
					calculation="COUNT(problems WHERE verdict='OK') grouped by rating ranges"
					weighting="Each range weighted equally. Shows your comfort zones and challenge areas"
					whyCare="A balanced distribution shows well-rounded skills. Push into higher ranges to grow."
				/>
			</div>

			{#if ratingDistribution.some((r) => r.count > 0)}
				<div class="space-y-4">
					{#each ratingDistribution as item}
						<div>
							<div class="mb-2 flex items-center justify-between text-sm">
								<span class="font-medium text-zinc-300">{item.range}</span>
								<span class="text-zinc-500">{item.count} ({item.percent}%)</span>
							</div>
							<div class="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800/50">
								<div
									class="h-full rounded-full {item.color} transition-all duration-700"
									style="width: {item.percent}%"
								></div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Growth Suggestion -->
				<div class="mt-6 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4">
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-indigo-500/20 p-2">
							<TrendingUp class="h-4 w-4 text-indigo-400" />
						</div>
						<div>
							<div class="text-sm font-medium text-white">Growth Suggestion</div>
							<div class="text-xs text-zinc-400">
								Focus on {coreStats.avgRating < 1600 ? '1400-1600' : '1700-1900'} rated problems to level
								up
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="flex h-64 items-center justify-center text-sm text-zinc-500">
					No rating data yet. Solve rated problems to see your distribution!
				</div>
			{/if}
		</div>
	</div>

	<!-- Recent Activity Summary -->
	<div class="rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm">
		<div class="mb-6">
			<h3 class="text-lg font-semibold text-white">Recent Momentum</h3>
			<p class="text-sm text-zinc-500">Your activity in the last 30 days</p>
		</div>

		<div class="grid gap-6 md:grid-cols-4">
			<div class="rounded-xl bg-white/5 p-4 text-center">
				<div class="text-3xl font-bold text-white">{recentActivity.last7Days}</div>
				<div class="mt-1 text-xs text-zinc-500">Submissions (7d)</div>
			</div>
			<div class="rounded-xl bg-white/5 p-4 text-center">
				<div class="text-3xl font-bold text-green-400">{recentActivity.last7DaysAccepted}</div>
				<div class="mt-1 text-xs text-zinc-500">Accepted (7d)</div>
			</div>
			<div class="rounded-xl bg-white/5 p-4 text-center">
				<div class="text-3xl font-bold text-white">{recentActivity.last30Days}</div>
				<div class="mt-1 text-xs text-zinc-500">Submissions (30d)</div>
			</div>
			<div class="rounded-xl bg-white/5 p-4 text-center">
				<div class="text-3xl font-bold text-green-400">{recentActivity.last30DaysAccepted}</div>
				<div class="mt-1 text-xs text-zinc-500">Accepted (30d)</div>
			</div>
		</div>

		<!-- Consistency Bars -->
		{#if consistencyData.length > 0}
			<div class="mt-6">
				<div class="mb-3 text-sm font-medium text-zinc-400">Monthly Consistency Trend</div>
				<div class="flex h-16 items-end gap-1">
					{#each consistencyData as month}
						<div class="group relative flex-1">
							<div
								class="rounded-t bg-gradient-to-t from-green-600/80 to-green-400/80 transition-all hover:from-green-500 hover:to-green-300"
								style="height: {(month.consistency / 100) * 64}px"
							></div>
							<div
								class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-black/90 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100"
							>
								{month.month}: {month.consistency}%
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-2 flex justify-between text-xs text-zinc-600">
					<span>{consistencyData[0]?.month || '-'}</span>
					<span>{consistencyData[consistencyData.length - 1]?.month || '-'}</span>
				</div>
			</div>
		{/if}
	</div>
</div>
