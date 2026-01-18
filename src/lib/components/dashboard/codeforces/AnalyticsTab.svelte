<script lang="ts">
	import { mean } from 'd3-array';
	import {
		Chart,
		RadarController,
		RadialLinearScale,
		PointElement,
		LineElement,
		Filler,
		Tooltip,
		type ChartOptions
	} from 'chart.js';
	import {
		BrainCircuit,
		Zap,
		Timer,
		Target,
		HardDrive,
		Layers,
		TrendingUp,
		TrendingDown,
		AlertTriangle,
		Clock,
		XCircle,
		ChevronLeft,
		ChevronRight,
		ExternalLink,
		FileCode,
		Tag
	} from 'lucide-svelte';

	Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

	let { data } = $props();

	let radarCanvas = $state<HTMLCanvasElement | null>(null);
	let radarChart: Chart | null = null;

	// --- ENHANCED PROFILE LOGIC ---
	let solverProfile = $derived.by(() => {
		const subs = data.submissions || [];
		const ok = subs.filter((s: any) => s.verdict === 'OK');

		// Normalization helper (0-10 scale)
		const norm = (val: number, maxVal: number) => Math.min(10, Math.max(0, (val / maxVal) * 10));
		const invNorm = (val: number, maxVal: number) =>
			Math.max(0, 10 - Math.min(10, (val / maxVal) * 10));

		// Core metrics
		const avgRating = mean(ok, (s: any) => s.problem?.rating) || 800;
		const avgTime = mean(ok, (s: any) => s.timeConsumedMillis) || 500;
		const avgMem = mean(ok, (s: any) => s.memoryConsumedBytes / (1024 * 1024)) || 128;
		const successRate = subs.length ? (ok.length / subs.length) * 100 : 0;

		// Consistency: active days in last 30 days
		const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
		const recentSubs = subs.filter((s: any) => s.creationTimeSeconds * 1000 >= cutoff);
		const activeDays = new Set(
			recentSubs.map((s: any) => new Date(s.creationTimeSeconds * 1000).toDateString())
		).size;

		// Breadth: unique tags solved
		const uniqueTags = new Set<string>();
		ok.forEach((s: any) => s.problem?.tags?.forEach((t: string) => uniqueTags.add(t)));

		return {
			raw: {
				avgRating: Math.round(avgRating),
				avgTime: Math.round(avgTime),
				avgMem: Math.round(avgMem),
				successRate: Math.round(successRate),
				activeDays,
				uniqueTags: uniqueTags.size,
				totalSolved: ok.length
			},
			normalized: {
				Power: norm(avgRating, 2800),
				Speed: invNorm(avgTime, 1500),
				Precision: norm(successRate, 100),
				Consistency: norm(activeDays, 30),
				Efficiency: invNorm(avgMem, 256),
				Breadth: norm(uniqueTags.size, 25)
			}
		};
	});

	// Chart-ready data
	let chartData = $derived({
		labels: ['Power', 'Speed', 'Precision', 'Consistency', 'Efficiency', 'Breadth'],
		datasets: [
			{
				label: 'Your Profile',
				data: [
					solverProfile.normalized.Power,
					solverProfile.normalized.Speed,
					solverProfile.normalized.Precision,
					solverProfile.normalized.Consistency,
					solverProfile.normalized.Efficiency,
					solverProfile.normalized.Breadth
				],
				backgroundColor: 'rgba(99, 102, 241, 0.2)',
				borderColor: 'rgba(99, 102, 241, 0.8)',
				borderWidth: 2,
				pointBackgroundColor: 'rgba(99, 102, 241, 1)',
				pointBorderColor: '#fff',
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
				pointRadius: 4,
				pointHoverRadius: 6
			}
		]
	});

	// --- ARCHETYPE DETECTION ---
	let archetype = $derived.by(() => {
		const m = solverProfile.normalized;
		const archetypes = [
			{
				name: 'The Speed Demon',
				icon: '⚡',
				desc: 'Your solutions are blazingly fast. Execution time optimization is your superpower.',
				color: 'from-yellow-900/40 via-yellow-800/10 to-transparent',
				check: () => m.Speed > 8
			},
			{
				name: 'The Precision Master',
				icon: '🎯',
				desc: 'You rarely fail a submission. Your first attempts are almost always correct.',
				color: 'from-emerald-900/40 via-emerald-800/10 to-transparent',
				check: () => m.Precision > 8.5
			},
			{
				name: 'The Consistent Grinder',
				icon: '🔥',
				desc: 'Your daily dedication is your strongest asset. You show up every day.',
				color: 'from-rose-900/40 via-rose-800/10 to-transparent',
				check: () => m.Consistency > 7
			},
			{
				name: 'The Efficiency Expert',
				icon: '💾',
				desc: 'Memory-optimized code is your signature. You squeeze every byte.',
				color: 'from-cyan-900/40 via-cyan-800/10 to-transparent',
				check: () => m.Efficiency > 8
			},
			{
				name: 'The Polymath',
				icon: '🧠',
				desc: 'You master multiple algorithmic domains. Breadth is your advantage.',
				color: 'from-purple-900/40 via-purple-800/10 to-transparent',
				check: () => m.Breadth > 7
			},
			{
				name: 'The Hard Mode Player',
				icon: '👑',
				desc: 'You tackle the toughest problems. High difficulty is your comfort zone.',
				color: 'from-amber-900/40 via-amber-800/10 to-transparent',
				check: () => m.Power > 7
			},
			{
				name: 'The High-Stakes Gambler',
				icon: '🎲',
				desc: 'You reach for hard problems but often require multiple attempts.',
				color: 'from-orange-900/40 via-orange-800/10 to-transparent',
				check: () => m.Power > 6 && m.Precision < 5
			},
			{
				name: 'The Balanced Competitor',
				icon: '⚖️',
				desc: 'You maintain a steady equilibrium across all technical domains.',
				color: 'from-indigo-900/40 via-indigo-800/10 to-transparent',
				check: () => true
			}
		];

		return archetypes.find((a) => a.check()) || archetypes[archetypes.length - 1];
	});

	// --- ERROR PROFILE ---
	let errorProfile = $derived.by(() => {
		const subs = data.submissions || [];
		const total = subs.length;
		const errors: Record<string, number> = {
			OK: 0,
			WRONG_ANSWER: 0,
			TIME_LIMIT_EXCEEDED: 0,
			MEMORY_LIMIT_EXCEEDED: 0,
			RUNTIME_ERROR: 0,
			OTHER: 0
		};

		subs.forEach((s: any) => {
			if (errors.hasOwnProperty(s.verdict)) {
				errors[s.verdict]++;
			} else {
				errors.OTHER++;
			}
		});

		const failed = total - errors.OK;
		const getPercent = (key: string) => (failed > 0 ? (errors[key] / failed) * 100 : 0);

		// Derive insight
		let insight = '';
		let insightIcon = AlertTriangle;
		const waPercent = getPercent('WRONG_ANSWER');
		const tlePercent = getPercent('TIME_LIMIT_EXCEEDED');
		const mlePercent = getPercent('MEMORY_LIMIT_EXCEEDED');

		if (waPercent > 50) {
			insight = 'Most failures are Wrong Answers—focus on edge cases and correctness testing.';
			insightIcon = XCircle;
		} else if (tlePercent > 30) {
			insight =
				'TLE is a major bottleneck—consider algorithm optimization and complexity analysis.';
			insightIcon = Clock;
		} else if (mlePercent > 20) {
			insight =
				'Memory issues detected—review data structure choices and avoid unnecessary copies.';
			insightIcon = HardDrive;
		} else if (failed === 0) {
			insight = 'Perfect record! No failed submissions to analyze.';
			insightIcon = Target;
		} else {
			insight = 'Errors are well-distributed—no single dominant failure mode.';
		}

		return {
			total,
			ok: errors.OK,
			failed,
			data: [
				{
					key: 'WA',
					label: 'Wrong Answer',
					count: errors.WRONG_ANSWER,
					percent: getPercent('WRONG_ANSWER'),
					color: '#ef4444'
				},
				{
					key: 'TLE',
					label: 'Time Limit',
					count: errors.TIME_LIMIT_EXCEEDED,
					percent: getPercent('TIME_LIMIT_EXCEEDED'),
					color: '#eab308'
				},
				{
					key: 'MLE',
					label: 'Memory Limit',
					count: errors.MEMORY_LIMIT_EXCEEDED,
					percent: getPercent('MEMORY_LIMIT_EXCEEDED'),
					color: '#f97316'
				},
				{
					key: 'RE',
					label: 'Runtime Error',
					count: errors.RUNTIME_ERROR,
					percent: getPercent('RUNTIME_ERROR'),
					color: '#a855f7'
				}
			],
			insight,
			insightIcon
		};
	});

	// --- RATING vs DIFFICULTY DELTA ---
	let ratingDelta = $derived.by(() => {
		const currentRating = data.rating?.[data.rating.length - 1]?.newRating || 1200;
		const avgSolvedDifficulty = solverProfile.raw.avgRating;
		const delta = avgSolvedDifficulty - currentRating;

		let interpretation = '';
		let isPositive = delta >= 0;

		if (delta > 200) {
			interpretation = 'You consistently solve problems harder than your rating—impressive reach!';
		} else if (delta > 0) {
			interpretation = 'Solving slightly above your rating—good challenge level.';
		} else if (delta > -100) {
			interpretation = 'Comfort zone solving—consider pushing to harder problems.';
		} else {
			interpretation = 'Solving well below rating—try more challenging problems.';
		}

		return { currentRating, avgSolvedDifficulty, delta, interpretation, isPositive };
	});

	// --- RECENT ACCEPTED PROBLEMS ---
	let currentPage = $state(1);
	const ITEMS_PER_PAGE = 10;

	let recentProblems = $derived.by(() => {
		const subs = data.submissions || [];
		const accepted = subs
			.filter((s: any) => s.verdict === 'OK')
			.sort((a: any, b: any) => b.creationTimeSeconds - a.creationTimeSeconds)
			.map((s: any) => ({
				platform: 'codeforces' as const,
				problemName: s.problem?.name || 'Unknown',
				problemId: `${s.problem?.contestId}${s.problem?.index}`,
				contestId: s.problem?.contestId,
				index: s.problem?.index,
				rating: s.problem?.rating,
				tags: s.problem?.tags || [],
				submissionId: s.id,
				solvedAt: new Date(s.creationTimeSeconds * 1000),
				executionTime: s.timeConsumedMillis,
				memoryUsed: Math.round(s.memoryConsumedBytes / (1024 * 1024))
			}));

		const totalPages = Math.ceil(accepted.length / ITEMS_PER_PAGE);
		const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
		const paged = accepted.slice(startIdx, startIdx + ITEMS_PER_PAGE);

		return { items: paged, total: accepted.length, totalPages, currentPage };
	});

	function goToPage(page: number) {
		if (page >= 1 && page <= recentProblems.totalPages) {
			currentPage = page;
		}
	}

	// Helper: relative time
	function timeAgo(date: Date): string {
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		const weeks = Math.floor(days / 7);
		if (weeks < 4) return `${weeks}w ago`;
		return date.toLocaleDateString();
	}

	// --- TAG PROFICIENCY ---
	let tagProficiency = $derived.by(() => {
		const subs = data.submissions || [];
		const tagMap: Record<string, { count: number; ratings: number[] }> = {};

		subs
			.filter((s: any) => s.verdict === 'OK')
			.forEach((s: any) => {
				(s.problem?.tags || []).forEach((tag: string) => {
					if (!tagMap[tag]) tagMap[tag] = { count: 0, ratings: [] };
					tagMap[tag].count++;
					if (s.problem?.rating) tagMap[tag].ratings.push(s.problem.rating);
				});
			});

		const allTags = Object.entries(tagMap)
			.map(([tag, data]) => ({
				tag,
				count: data.count,
				avgRating: data.ratings.length
					? Math.round(data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length)
					: 0,
				bucket:
					data.count >= 10
						? ('core' as const)
						: data.count >= 5
							? ('familiar' as const)
							: ('touched' as const)
			}))
			.sort((a, b) => b.count - a.count);

		return {
			core: allTags.filter((t) => t.bucket === 'core'),
			familiar: allTags.filter((t) => t.bucket === 'familiar'),
			touched: allTags.filter((t) => t.bucket === 'touched').slice(0, 12), // Limit touched
			totalTags: allTags.length
		};
	});

	// Rating color helper
	function ratingColor(rating?: number): string {
		if (!rating) return 'text-zinc-500';
		if (rating >= 2400) return 'text-red-500';
		if (rating >= 2100) return 'text-orange-500';
		if (rating >= 1900) return 'text-violet-500';
		if (rating >= 1600) return 'text-blue-500';
		if (rating >= 1400) return 'text-cyan-500';
		if (rating >= 1200) return 'text-green-500';
		return 'text-zinc-400';
	}
	// Radar chart options
	const radarOptions: ChartOptions<'radar'> = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			r: {
				min: 0,
				max: 10,
				beginAtZero: true,
				grid: { color: 'rgba(255,255,255,0.08)' },
				angleLines: { color: 'rgba(255,255,255,0.08)' },
				pointLabels: {
					color: '#a1a1aa',
					font: { size: 11, weight: 500 }
				},
				ticks: {
					stepSize: 2,
					display: false
				}
			}
		},
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(9, 9, 11, 0.95)',
				titleColor: '#fff',
				bodyColor: '#a1a1aa',
				borderColor: 'rgba(255,255,255,0.1)',
				borderWidth: 1,
				padding: 12,
				displayColors: false,
				callbacks: {
					label: (ctx) => `${ctx.label}: ${(ctx.raw as number).toFixed(1)}/10`
				}
			}
		}
	};

	// Create radar chart
	$effect(() => {
		if (radarCanvas && data.submissions?.length > 0) {
			if (radarChart) radarChart.destroy();

			radarChart = new Chart(radarCanvas, {
				type: 'radar',
				data: chartData,
				options: radarOptions
			});

			return () => radarChart?.destroy();
		}
	});
</script>

<div class="space-y-8 pb-20">
	<!-- Hero Section: Archetype + Radar -->
	<section class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Archetype Card -->
		<div
			class="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/60 p-8 backdrop-blur-sm lg:col-span-1"
		>
			<div
				class="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br {archetype.color}"
			></div>

			<div class="relative z-10 flex h-full flex-col justify-between">
				<div>
					<div class="mb-4 text-5xl opacity-90">{archetype.icon}</div>
					<span class="mb-2 block font-mono text-xs tracking-widest text-zinc-400 uppercase">
						Solver Archetype
					</span>
					<h2 class="mb-3 text-2xl font-bold tracking-tight text-white">{archetype.name}</h2>
					<p class="text-sm leading-relaxed text-zinc-400">{archetype.desc}</p>
				</div>

				<div class="mt-6 grid grid-cols-2 gap-3">
					<div class="rounded-xl bg-white/5 p-3">
						<div class="mb-1 text-xs text-zinc-500">Problems Solved</div>
						<div class="text-lg font-bold text-white">{solverProfile.raw.totalSolved}</div>
					</div>
					<div class="rounded-xl bg-white/5 p-3">
						<div class="mb-1 text-xs text-zinc-500">Success Rate</div>
						<div class="text-lg font-bold text-emerald-400">{solverProfile.raw.successRate}%</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Radar Chart -->
		<div
			class="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-6 lg:col-span-2"
		>
			<div class="mb-4 flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
					<BrainCircuit class="h-5 w-5 text-indigo-400" />
				</div>
				<div>
					<h3 class="text-lg font-semibold text-white">Problem Solver Profile</h3>
					<p class="text-xs text-zinc-500">6-axis skill analysis (normalized 0-10)</p>
				</div>
			</div>

			<div class="h-[280px]">
				{#if data.submissions?.length > 0}
					<canvas bind:this={radarCanvas}></canvas>
				{:else}
					<div class="flex h-full items-center justify-center text-sm text-zinc-500">
						No submission data available
					</div>
				{/if}
			</div>

			<!-- Axis Legend -->
			<div class="mt-4 flex flex-wrap gap-3 text-xs text-zinc-400">
				<span><strong class="text-zinc-200">Power:</strong> Avg difficulty</span>
				<span><strong class="text-zinc-200">Speed:</strong> Execution time</span>
				<span><strong class="text-zinc-200">Precision:</strong> Success rate</span>
				<span><strong class="text-zinc-200">Consistency:</strong> Active days</span>
				<span><strong class="text-zinc-200">Efficiency:</strong> Memory usage</span>
				<span><strong class="text-zinc-200">Breadth:</strong> Tag diversity</span>
			</div>
		</div>
	</section>

	<!-- Secondary Metrics Row -->
	<section class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- Rating vs Difficulty Delta -->
		<div class="rounded-2xl border border-white/5 bg-zinc-900/40 p-6">
			<div class="mb-4 flex items-center gap-3">
				<div
					class="rounded-lg p-2 {ratingDelta.isPositive ? 'bg-emerald-500/10' : 'bg-amber-500/10'}"
				>
					{#if ratingDelta.isPositive}
						<TrendingUp class="h-5 w-5 text-emerald-400" />
					{:else}
						<TrendingDown class="h-5 w-5 text-amber-400" />
					{/if}
				</div>
				<div>
					<h3 class="text-sm font-semibold text-white">Rating vs Difficulty</h3>
					<p class="text-xs text-zinc-500">Are you challenging yourself?</p>
				</div>
			</div>

			<div class="mb-3 flex items-end gap-4">
				<div>
					<div class="text-xs text-zinc-500">Your Rating</div>
					<div class="text-2xl font-bold text-white">{ratingDelta.currentRating}</div>
				</div>
				<div class="mb-1 text-xl text-zinc-600">→</div>
				<div>
					<div class="text-xs text-zinc-500">Avg Solved</div>
					<div class="text-2xl font-bold text-indigo-400">{ratingDelta.avgSolvedDifficulty}</div>
				</div>
				<div
					class="ml-auto rounded-full px-3 py-1 text-sm font-bold {ratingDelta.isPositive
						? 'bg-emerald-500/20 text-emerald-400'
						: 'bg-amber-500/20 text-amber-400'}"
				>
					{ratingDelta.delta > 0 ? '+' : ''}{ratingDelta.delta}
				</div>
			</div>

			<p class="text-xs leading-relaxed text-zinc-400">{ratingDelta.interpretation}</p>
		</div>

		<!-- Error Profile -->
		<div class="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 lg:col-span-2">
			<div class="mb-4 flex items-center gap-3">
				<div class="rounded-lg bg-rose-500/10 p-2">
					<AlertTriangle class="h-5 w-5 text-rose-400" />
				</div>
				<div>
					<h3 class="text-sm font-semibold text-white">Error Profile</h3>
					<p class="text-xs text-zinc-500">
						Failure distribution ({errorProfile.failed} failed of {errorProfile.total})
					</p>
				</div>
			</div>

			{#if errorProfile.failed > 0}
				<!-- Error Bars -->
				<div class="mb-4 grid grid-cols-4 gap-3">
					{#each errorProfile.data as error}
						<div class="text-center">
							<div class="mb-2 text-xs text-zinc-500">{error.key}</div>
							<div class="flex h-20 flex-col-reverse overflow-hidden rounded-lg bg-zinc-800/50">
								<div
									class="rounded-lg transition-all duration-500"
									style="height: {error.percent}%; background-color: {error.color}"
								></div>
							</div>
							<div class="mt-2 text-xs font-medium text-zinc-400">{error.percent.toFixed(0)}%</div>
							<div class="text-[10px] text-zinc-600">{error.count}</div>
						</div>
					{/each}
				</div>

				<!-- Insight -->
				<div class="flex items-start gap-3 rounded-xl bg-white/5 p-4">
					{#if errorProfile.insightIcon}
						{@const InsightIcon = errorProfile.insightIcon}
						<InsightIcon class="mt-0.5 h-4 w-4 text-amber-400" />
					{/if}
					<p class="text-xs leading-relaxed text-zinc-300">{errorProfile.insight}</p>
				</div>
			{:else}
				<div class="py-8 text-center text-sm text-zinc-500">
					🎉 No failed submissions to analyze!
				</div>
			{/if}
		</div>
	</section>

	<!-- Raw Metrics Grid -->
	<section>
		<h3 class="mb-4 text-sm font-semibold tracking-wider text-zinc-400 uppercase">
			Detailed Metrics
		</h3>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
			{#each [{ label: 'Avg Rating', value: solverProfile.raw.avgRating, icon: Target, color: 'text-indigo-400' }, { label: 'Avg Time', value: `${solverProfile.raw.avgTime}ms`, icon: Timer, color: 'text-yellow-400' }, { label: 'Avg Memory', value: `${solverProfile.raw.avgMem}MB`, icon: HardDrive, color: 'text-cyan-400' }, { label: 'Success Rate', value: `${solverProfile.raw.successRate}%`, icon: Target, color: 'text-emerald-400' }, { label: 'Active Days', value: `${solverProfile.raw.activeDays}/30`, icon: Zap, color: 'text-rose-400' }, { label: 'Tags Covered', value: solverProfile.raw.uniqueTags, icon: Layers, color: 'text-purple-400' }] as metric}
				{@const Icon = metric.icon}
				<div class="rounded-xl border border-white/5 bg-zinc-900/40 p-4">
					<div class="mb-2 flex items-center gap-2">
						<Icon class="h-4 w-4 {metric.color}" />
						<span class="text-xs text-zinc-500">{metric.label}</span>
					</div>
					<div class="text-xl font-bold text-white">{metric.value}</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Recent Accepted Problems -->
	<section>
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-emerald-500/10 p-2">
					<FileCode class="h-5 w-5 text-emerald-400" />
				</div>
				<div>
					<h3 class="text-sm font-semibold text-white">Recent Solves</h3>
					<p class="text-xs text-zinc-500">{recentProblems.total} accepted submissions</p>
				</div>
			</div>
			{#if recentProblems.totalPages > 1}
				<span class="text-xs text-zinc-500">
					Page {recentProblems.currentPage} of {recentProblems.totalPages}
				</span>
			{/if}
		</div>

		<div class="space-y-2">
			{#each recentProblems.items as problem}
				<div
					class="group flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-white/10 hover:bg-zinc-900/60"
				>
					<div class="flex min-w-0 items-center gap-4">
						<!-- Platform Badge -->
						<div
							class="flex-shrink-0 rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-bold tracking-wider text-blue-400 uppercase"
						>
							CF
						</div>

						<!-- Problem Info -->
						<div class="min-w-0">
							<div class="truncate text-sm font-medium text-white">
								{problem.problemName}
							</div>
							<div class="flex items-center gap-2 text-xs text-zinc-500">
								{#if problem.rating}
									<span class="font-medium {ratingColor(problem.rating)}">⭐ {problem.rating}</span>
									<span class="text-zinc-700">·</span>
								{/if}
								<span>{timeAgo(problem.solvedAt)}</span>
							</div>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
						<a
							href="https://codeforces.com/contest/{problem.contestId}/problem/{problem.index}"
							target="_blank"
							rel="noopener noreferrer"
							class="rounded-lg bg-white/5 px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
						>
							Problem
						</a>
						<a
							href="https://codeforces.com/contest/{problem.contestId}/submission/{problem.submissionId}"
							target="_blank"
							rel="noopener noreferrer"
							class="rounded-lg bg-white/5 px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
						>
							Submission
						</a>
					</div>
				</div>
			{:else}
				<div class="py-8 text-center text-sm text-zinc-500">No accepted submissions yet</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if recentProblems.totalPages > 1}
			<div class="mt-4 flex items-center justify-center gap-2">
				<button
					onclick={() => goToPage(currentPage - 1)}
					disabled={currentPage === 1}
					class="rounded-lg bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
				>
					<ChevronLeft class="h-4 w-4" />
				</button>

				{#each Array.from({ length: Math.min(5, recentProblems.totalPages) }, (_, i) => {
					const start = Math.max(1, Math.min(currentPage - 2, recentProblems.totalPages - 4));
					return start + i;
				}).filter((p) => p <= recentProblems.totalPages) as page}
					<button
						onclick={() => goToPage(page)}
						class="h-8 w-8 rounded-lg text-xs font-medium transition-colors {page === currentPage
							? 'bg-indigo-500 text-white'
							: 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}"
					>
						{page}
					</button>
				{/each}

				<button
					onclick={() => goToPage(currentPage + 1)}
					disabled={currentPage === recentProblems.totalPages}
					class="rounded-lg bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		{/if}
	</section>

	<!-- Tag Proficiency -->
	<section>
		<div class="mb-4 flex items-center gap-3">
			<div class="rounded-lg bg-purple-500/10 p-2">
				<Tag class="h-5 w-5 text-purple-400" />
			</div>
			<div>
				<h3 class="text-sm font-semibold text-white">Tag Proficiency</h3>
				<p class="text-xs text-zinc-500">{tagProficiency.totalTags} unique tags practiced</p>
			</div>
		</div>

		<div class="space-y-6">
			<!-- Core Tags -->
			{#if tagProficiency.core.length > 0}
				<div>
					<div class="mb-3 flex items-center gap-2">
						<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
						<span class="text-xs font-medium tracking-wider text-emerald-400 uppercase">Core</span>
						<span class="text-xs text-zinc-600">· 10+ problems</span>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each tagProficiency.core as tag}
							<div
								class="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
							>
								<span class="text-sm font-medium text-white capitalize">{tag.tag}</span>
								<span class="text-xs text-zinc-400">{tag.count}</span>
								{#if tag.avgRating}
									<span class="text-xs {ratingColor(tag.avgRating)}">⭐{tag.avgRating}</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Familiar Tags -->
			{#if tagProficiency.familiar.length > 0}
				<div>
					<div class="mb-3 flex items-center gap-2">
						<span class="h-2 w-2 rounded-full bg-blue-500"></span>
						<span class="text-xs font-medium tracking-wider text-blue-400 uppercase">Familiar</span>
						<span class="text-xs text-zinc-600">· 5-9 problems</span>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each tagProficiency.familiar as tag}
							<div
								class="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2"
							>
								<span class="text-sm font-medium text-white capitalize">{tag.tag}</span>
								<span class="text-xs text-zinc-400">{tag.count}</span>
								{#if tag.avgRating}
									<span class="text-xs {ratingColor(tag.avgRating)}">⭐{tag.avgRating}</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Touched Tags -->
			{#if tagProficiency.touched.length > 0}
				<div>
					<div class="mb-3 flex items-center gap-2">
						<span class="h-2 w-2 rounded-full bg-zinc-500"></span>
						<span class="text-xs font-medium tracking-wider text-zinc-400 uppercase">Touched</span>
						<span class="text-xs text-zinc-600">· 1-4 problems</span>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each tagProficiency.touched as tag}
							<div
								class="flex items-center gap-2 rounded-lg border border-white/5 bg-zinc-800/40 px-3 py-2"
							>
								<span class="text-sm font-medium text-zinc-300 capitalize">{tag.tag}</span>
								<span class="text-xs text-zinc-500">{tag.count}</span>
								{#if tag.avgRating}
									<span class="text-xs {ratingColor(tag.avgRating)}">⭐{tag.avgRating}</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</section>
</div>
