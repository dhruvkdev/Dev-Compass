<script lang="ts">
	import {
		Chart,
		Title,
		Tooltip,
		Legend,
		BarElement,
		CategoryScale,
		LinearScale,
		BarController,
		type TooltipItem,
		ArcElement
	} from 'chart.js';
	import {
		Circle,
		Target,
		Trophy,
		Zap,
		TrendingUp,
		AlertCircle,
		Info,
		Star,
		Award,
		TrendingDown,
		BarChart3,
		ChevronRight,
		Sparkles,
		Brain,
		Target as TargetIcon,
		PieChart,
		Repeat,
		ArrowLeft,
		CheckCircle,
		Clock,
		X
	} from 'lucide-svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { onMount } from 'svelte';

	Chart.register(
		Title,
		Tooltip,
		Legend,
		BarElement,
		CategoryScale,
		LinearScale,
		BarController,
		ArcElement
	);

	interface Submission {
		verdict: string;
		problem: {
			tags?: string[];
			rating?: number;
			name?: string;
		};
	}

	let { submissions = [] }: { submissions: Submission[] } = $props();

	// Helper for Tag Progress Colors
	const tagColors = [
		'from-blue-500 to-cyan-400',
		'from-emerald-500 to-green-400',
		'from-purple-500 to-violet-400',
		'from-amber-500 to-yellow-400',
		'from-rose-500 to-pink-400',
		'from-indigo-500 to-blue-400',
		'from-orange-500 to-amber-400',
		'from-cyan-500 to-teal-400'
	];

	// --- 1. Data Processing ---
	let stats = $derived.by(() => {
		const tCounts: Record<string, number> = {};
		const rCounts: Record<string, number> = {};

		// Detailed stats per tag
		const tagDetails: Record<
			string,
			{
				totalAttempts: number;
				solvedCount: number;
				ratings: number[];
				solvedProblems: Set<string>;
			}
		> = {};

		let totalSolved = 0;

		if (submissions) {
			for (const sub of submissions) {
				const isSolved = sub.verdict === 'OK';

				if (isSolved) {
					totalSolved++;
					// Ratings
					if (sub.problem.rating) {
						rCounts[sub.problem.rating] = (rCounts[sub.problem.rating] || 0) + 1;
					}
				}

				// Tag processing for ALL submissions (to get attempt counts)
				if (sub.problem.tags) {
					for (const tag of sub.problem.tags) {
						if (!tagDetails[tag]) {
							tagDetails[tag] = {
								totalAttempts: 0,
								solvedCount: 0,
								ratings: [],
								solvedProblems: new Set()
							};
						}

						tagDetails[tag].totalAttempts++;

						if (isSolved) {
							tagDetails[tag].solvedCount++;
							tCounts[tag] = (tCounts[tag] || 0) + 1; // Main count only for solved

							if (sub.problem.rating) {
								tagDetails[tag].ratings.push(sub.problem.rating);
							}
							if (sub.problem.name) {
								tagDetails[tag].solvedProblems.add(sub.problem.name);
							}
						}
					}
				}
			}
		}
		return { tagCounts: tCounts, ratingCounts: rCounts, totalSolved, tagDetails };
	});

	// Top Tags (Top 12 for grid)
	let sortedTags = $derived(
		Object.entries(stats.tagCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 12)
			.map(([tag, count], i) => ({
				tag,
				count,
				percent: ((count / (stats.totalSolved || 1)) * 100).toFixed(1),
				color: tagColors[i % tagColors.length],
				details: stats.tagDetails[tag]
			}))
	);

	// --- 2. Interactive Selection ---
	let selectedTagKey = $state<string | null>(null);
	let hoveredTagKey = $state<string | null>(null);

	function selectTag(tag: string) {
		selectedTagKey = selectedTagKey === tag ? null : tag;
		if (selectedTagKey) {
			// Scroll to analysis section
			setTimeout(() => {
				const element = document.getElementById('tag-analysis-section');
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}, 100);
		}
	}

	// Derived Analysis for Selected Tag
	let analysis = $derived.by(() => {
		if (!selectedTagKey || !stats.tagDetails[selectedTagKey]) return null;

		const details = stats.tagDetails[selectedTagKey];
		const avgRating =
			details.ratings.length > 0
				? Math.round(details.ratings.reduce((a, b) => a + b, 0) / details.ratings.length)
				: 0;

		const successRate =
			details.totalAttempts > 0
				? ((details.solvedCount / details.totalAttempts) * 100).toFixed(1)
				: '0';

		const avgAttempts =
			details.solvedCount > 0 ? (details.totalAttempts / details.solvedCount).toFixed(1) : '0';

		// Topic Score: Weighted by rating and success rate
		const baseScore = (avgRating / 3200) * 100;
		const successWeight = Math.min(1, parseFloat(successRate) / 100);
		const volumeWeight = Math.min(1, details.solvedCount / 20);
		const topicScore = Math.min(100, Math.max(0, baseScore * successWeight * volumeWeight)).toFixed(
			1
		);

		// Mastery Level with detailed scoring
		let mastery = 'Beginner';
		let masteryColor = 'text-gray-400';
		let masteryIcon = '🌱';

		if (avgRating > 2400) {
			mastery = 'Legendary';
			masteryColor = 'text-red-500';
			masteryIcon = '👑';
		} else if (avgRating > 2100) {
			mastery = 'Master';
			masteryColor = 'text-orange-500';
			masteryIcon = '⭐';
		} else if (avgRating > 1900) {
			mastery = 'Expert';
			masteryColor = 'text-purple-500';
			masteryIcon = '🎯';
		} else if (avgRating > 1600) {
			mastery = 'Advanced';
			masteryColor = 'text-blue-500';
			masteryIcon = '🚀';
		} else if (avgRating > 1400) {
			mastery = 'Intermediate';
			masteryColor = 'text-cyan-500';
			masteryIcon = '📈';
		} else if (avgRating > 1200) {
			mastery = 'Improver';
			masteryColor = 'text-teal-500';
			masteryIcon = '🔧';
		} else if (avgRating > 1000) {
			mastery = 'Novice';
			masteryColor = 'text-emerald-500';
			masteryIcon = '🧭';
		} else if (avgRating > 0) {
			mastery = 'Beginner';
			masteryColor = 'text-green-500';
			masteryIcon = '🌱';
		}

		// Confidence Score
		const confidence = Math.min(
			100,
			Math.sqrt(details.solvedCount * 5) * Math.min(1, parseFloat(successRate) / 100)
		);

		// Improvement suggestions
		const suggestions = [];
		if (parseFloat(successRate) < 60) suggestions.push('Focus on accuracy');
		if (details.solvedCount < 10) suggestions.push('Solve more problems');
		if (parseFloat(avgAttempts) > 3) suggestions.push('Review solutions before re-attempting');
		if (avgRating < 1400) suggestions.push('Practice easier problems first');

		return {
			tag: selectedTagKey,
			avgRating,
			topicScore,
			mastery,
			masteryColor,
			masteryIcon,
			confidence,
			successRate,
			avgAttempts,
			solvedCount: details.solvedProblems.size,
			ratedProblemsCount: details.ratings.length,
			totalAttempts: details.totalAttempts,
			suggestions
		};
	});

	// Rating Distribution - Grouped by tiers
	const tiers = [
		{
			label: '800-1199',
			min: 800,
			max: 1199,
			color: '#9ca3af',
			labelColor: 'text-gray-400',
			barColor: 'from-gray-500 to-gray-400',
			icon: '🔰'
		},
		{
			label: '1200-1399',
			min: 1200,
			max: 1399,
			color: '#22c55e',
			labelColor: 'text-green-500',
			barColor: 'from-green-500 to-emerald-400',
			icon: '📗'
		},
		{
			label: '1400-1599',
			min: 1400,
			max: 1599,
			color: '#06b6d4',
			labelColor: 'text-cyan-500',
			barColor: 'from-cyan-500 to-sky-400',
			icon: '💠'
		},
		{
			label: '1600-1899',
			min: 1600,
			max: 1899,
			color: '#3b82f6',
			labelColor: 'text-blue-500',
			barColor: 'from-blue-500 to-indigo-400',
			icon: '🎯'
		},
		{
			label: '1900-2099',
			min: 1900,
			max: 2099,
			color: '#a855f7',
			labelColor: 'text-purple-500',
			barColor: 'from-purple-500 to-violet-400',
			icon: '⚡'
		},
		{
			label: '2100-2399',
			min: 2100,
			max: 2399,
			color: '#f97316',
			labelColor: 'text-orange-500',
			barColor: 'from-orange-500 to-amber-400',
			icon: '🔥'
		},
		{
			label: '2400+',
			min: 2400,
			max: 5000,
			color: '#ef4444',
			labelColor: 'text-red-500',
			barColor: 'from-red-500 to-rose-400',
			icon: '👑'
		}
	];

	let tierData = $derived(
		tiers.map((tier) => {
			let count = 0;
			for (const [ratingStr, c] of Object.entries(stats.ratingCounts)) {
				const r = Number(ratingStr);
				if (r >= tier.min && r <= tier.max) count += c;
			}
			return { ...tier, count };
		})
	);

	let maxTierCount = $derived(Math.max(...tierData.map((d) => d.count), 1));

	// Total problems by rating
	let totalRatedProblems = $derived(tierData.reduce((sum, tier) => sum + tier.count, 0));

	// Quick stats
	let quickStats = $derived({
		totalSolved: stats.totalSolved,
		uniqueTags: Object.keys(stats.tagCounts).length,
		avgRating: Math.round(
			Object.entries(stats.ratingCounts).reduce(
				(sum, [rating, count]) => sum + Number(rating) * count,
				0
			) / (totalRatedProblems || 1)
		),
		strongestTag: sortedTags[0]?.tag || 'None',
		weakestTag: sortedTags[sortedTags.length - 1]?.tag || 'None'
	});

	let balanceScore = $derived(((tierData[3]?.count || 0) / (totalRatedProblems || 1)) * 100);
	let progression = $derived(quickStats.avgRating > 1600);
</script>

<div class="space-y-8 p-4 md:p-6">
	<!-- Header -->
	<!-- Header -->
	<div class="mb-10">
		<!-- Title Row -->
		<div class="mb-6 flex items-center gap-4">
			<div class="rounded-xl border border-white/10 bg-indigo-500/10 p-3">
				<Brain class="h-6 w-6 text-indigo-400" />
			</div>

			<div>
				<h1 class="text-2xl font-semibold text-zinc-100">Problem Analysis</h1>
				<p class="mt-0.5 text-sm text-zinc-500">
					Insights into your solving patterns and tag mastery
				</p>
			</div>
		</div>

		<!-- Quick Stats -->
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<!-- Stat -->
			<div
				class="rounded-xl border border-white/10 bg-gradient-to-b from-zinc-950/90 to-black/85 p-4"
			>
				<div class="text-xs font-medium tracking-wide text-zinc-500">Total Solved</div>
				<div class="mt-1 text-2xl font-semibold text-emerald-400">
					{quickStats.totalSolved}
				</div>
			</div>

			<div
				class="rounded-xl border border-white/10 bg-gradient-to-b from-zinc-950/90 to-black/85 p-4"
			>
				<div class="text-xs font-medium tracking-wide text-zinc-500">Avg Rating</div>
				<div class="mt-1 text-2xl font-semibold text-blue-400">
					{quickStats.avgRating}
				</div>
			</div>

			<div
				class="rounded-xl border border-white/10 bg-gradient-to-b from-zinc-950/90 to-black/85 p-4"
			>
				<div class="text-xs font-medium tracking-wide text-zinc-500">Tags Covered</div>
				<div class="mt-1 text-2xl font-semibold text-purple-400">
					{quickStats.uniqueTags}
				</div>
			</div>

			<div
				class="rounded-xl border border-white/10 bg-gradient-to-b from-zinc-950/90 to-black/85 p-4"
			>
				<div class="text-xs font-medium tracking-wide text-zinc-500">Strongest Tag</div>
				<div
					class="mt-1 truncate text-lg font-semibold text-emerald-300 capitalize"
					title={quickStats.strongestTag}
				>
					{quickStats.strongestTag}
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="grid gap-8 lg:grid-cols-2">
		<!-- Left Column: Rating Distribution -->
		<div class="space-y-8">
			<!-- Rating Distribution Card -->
			<div
				class="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-950/90 to-black/85 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl"
			>
				<!-- Header -->
				<div class="mb-6 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-blue-500/10 p-2">
							<BarChart3 class="h-5 w-5 text-blue-400" />
						</div>
						<div>
							<h3 class="text-sm font-semibold tracking-wide text-zinc-100">Rating Distribution</h3>
							<p class="text-xs text-zinc-500">Solved problems by difficulty</p>
						</div>
					</div>

					<div class="text-right">
						<div class="text-xs text-zinc-500">Total Rated</div>
						<div class="text-lg font-semibold text-zinc-100">
							{totalRatedProblems}
						</div>
					</div>
				</div>

				<!-- Distribution Rows -->
				<div class="space-y-4">
					{#each tierData as tier}
						<div class="space-y-1">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="text-base">{tier.icon}</span>
									<span class="text-sm text-zinc-300">
										{tier.label}
									</span>
								</div>

								<div class="text-right">
									<div class="text-sm font-medium text-zinc-100">
										{tier.count}
									</div>
									<div class="text-xs text-zinc-500">
										{((tier.count / (totalRatedProblems || 1)) * 100).toFixed(1)}%
									</div>
								</div>
							</div>

							<!-- Progress Bar -->
							<div class="h-1.5 overflow-hidden rounded-full bg-white/10">
								<div
									class="h-full rounded-full bg-gradient-to-r {tier.barColor}"
									style="width: {(tier.count / maxTierCount) * 100}%"
								></div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Summary -->
				<div class="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center gap-2 text-zinc-400">
							<Sparkles class="h-4 w-4 text-yellow-400" />
							<span>Distribution Balance</span>
						</div>
						<div class="font-medium {balanceScore > 30 ? 'text-emerald-400' : 'text-amber-400'}">
							{balanceScore > 30 ? 'Well Balanced' : 'Needs Focus'}
						</div>
					</div>

					<p class="mt-1 text-xs text-zinc-500">
						Aim to solve more problems in your target rating band.
					</p>
				</div>
			</div>

			<!-- Performance Insights -->
			<div
				class="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-950/90 to-black/85 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl"
			>
				<div class="mb-6 flex items-center gap-3">
					<div class="rounded-lg bg-purple-500/10 p-2">
						<TargetIcon class="h-5 w-5 text-purple-400" />
					</div>
					<div>
						<h3 class="text-sm font-semibold tracking-wide text-zinc-100">Performance Insights</h3>
						<p class="text-xs text-zinc-500">Key metrics & recommendations</p>
					</div>
				</div>

				<div class="grid gap-4">
					<!-- Rating Progress -->
					<div class="rounded-lg border border-white/10 bg-white/5 p-4">
						<div class="mb-1 flex items-center justify-between text-xs text-zinc-400">
							<span>Rating Progression</span>
							<span
								class="flex items-center gap-1 font-medium {progression
									? 'text-emerald-400'
									: 'text-amber-400'}"
							>
								{#if progression}
									<TrendingUp class="h-3.5 w-3.5" />
									Good Pace
								{:else}
									<TrendingDown class="h-3.5 w-3.5" />
									Needs Push
								{/if}
							</span>
						</div>

						<div class="text-xl font-semibold text-zinc-100">
							{quickStats.avgRating}
						</div>
					</div>

					<!-- Strengths -->
					<div class="rounded-lg border border-white/10 bg-white/5 p-4">
						<div class="mb-2 text-xs text-zinc-400">Top Strengths</div>
						<div class="flex flex-wrap gap-2">
							{#each sortedTags.slice(0, 3) as tag}
								<span class="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200">
									{tag.tag}
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Column: Tag Mastery Grid -->
		<div
			class="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 p-6 shadow-2xl backdrop-blur-xl"
		>
			<div class="mb-6">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-2">
							<Award class="h-5 w-5 text-emerald-400" />
						</div>
						<div>
							<h3 class="text-lg font-bold text-white">Tag Mastery</h3>
							<p class="text-sm text-zinc-500">Click on any tag for detailed analysis</p>
						</div>
					</div>
					<div class="text-sm text-zinc-500">
						<span class="font-bold text-white">{sortedTags.length}</span> tags analyzed
					</div>
				</div>

				<!-- Tag Grid -->
				<!-- Tag Grid -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each sortedTags as tag}
						<button
							onclick={() => selectTag(tag.tag)}
							class="
								group relative z-0
								overflow-hidden rounded-xl
								border border-white/10
								bg-gradient-to-b from-zinc-950/90 to-black/80
								p-4 text-left

		transition-[transform,box-shadow] duration-300 ease-out
		hover:z-30 hover:scale-[1.04]
		hover:border-white/20
		hover:shadow-2xl hover:shadow-black/60

		focus-visible:z-30 focus-visible:scale-[1.04]

		{selectedTagKey === tag.tag ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-900' : ''}
	"
						>
							<!-- Subtle glow -->
							<div
								class="absolute -inset-0.5 bg-gradient-to-br {tag.color} opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-10"
							></div>

							<div class="relative flex flex-col">
								<!-- Header -->
								<div class="mb-3 flex items-start justify-between">
									<div>
										<div class="text-sm font-semibold text-white capitalize">
											{tag.tag}
										</div>
										<div class="mt-0.5 text-xs text-zinc-500">
											{tag.count} problems solved
										</div>
									</div>

									<div class="rounded-lg bg-white/5 p-1.5">
										<Award class="h-4 w-4 text-yellow-500" />
									</div>
								</div>

								<!-- Core Stats -->
								<div class="mb-3 flex items-end justify-between">
									<div class="text-3xl font-bold text-zinc-100">
										{tag.count}
									</div>

									<div class="text-right">
										<div class="text-sm font-semibold text-zinc-300">
											{tag.percent}%
										</div>
										<div class="text-xs text-zinc-500">of total</div>
									</div>
								</div>

								<!-- Progress -->
								<div>
									<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
										<div
											class="h-full rounded-full bg-gradient-to-r {tag.color} transition-all duration-700"
											style="width: {tag.percent}%"
										></div>
									</div>
									<div class="mt-1 text-right text-xs text-zinc-500">
										Mastery {Math.round(tag.percent)}%
									</div>
								</div>

								<!-- Expandable Hover Section -->
								<div
									class="mt-3 grid max-h-0 translate-y-2
					       grid-cols-2 gap-2 overflow-hidden
					       opacity-0
					       transition-all duration-300 ease-out
					       group-hover:max-h-24
					       group-hover:translate-y-0
					       group-hover:opacity-100"
								>
									<div class="rounded-lg bg-white/5 p-2">
										<div class="text-xs text-zinc-400">Avg Rating</div>
										<div class="mt-0.5 font-semibold text-white">
											{tag.details?.ratings.length > 0
												? Math.round(
														tag.details.ratings.reduce((a, b) => a + b, 0) /
															tag.details.ratings.length
													)
												: 'N/A'}
										</div>
									</div>

									<div class="rounded-lg bg-white/5 p-2">
										<div class="text-xs text-zinc-400">Success Rate</div>
										<div class="mt-0.5 font-semibold text-emerald-400">
											{tag.details?.totalAttempts > 0
												? ((tag.details.solvedCount / tag.details.totalAttempts) * 100).toFixed(1)
												: '0'}%
										</div>
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>

				<!-- Legend -->
				<div class="mt-6 flex flex-wrap items-center gap-3 rounded-lg bg-black/20 p-4">
					<div class="text-xs font-medium text-zinc-400">Mastery Levels:</div>
					<div class="flex flex-wrap gap-2">
						{#each [{ label: 'Beginner', color: 'from-gray-500 to-gray-400' }, { label: 'Intermediate', color: 'from-green-500 to-emerald-400' }, { label: 'Advanced', color: 'from-blue-500 to-indigo-400' }, { label: 'Expert', color: 'from-purple-500 to-violet-400' }] as level}
							<div class="flex items-center gap-1.5">
								<div class="h-2 w-2 rounded-full bg-gradient-to-r {level.color}"></div>
								<span class="text-xs text-zinc-400">{level.label}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Detailed Tag Analysis -->
	{#if analysis}
		<div
			id="tag-analysis-section"
			transition:slide={{ duration: 400 }}
			class="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-950/90 to-black/85 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl"
		>
			<!-- Header with improved hierarchy -->
			<div class="mb-8 flex items-start justify-between">
				<div class="flex items-center gap-4">
					<div class="rounded-xl bg-indigo-500/10 p-3">
						<Target class="h-6 w-6 text-indigo-400" />
					</div>

					<div>
						<div class="flex items-center gap-2">
							<h3 class="text-xl font-semibold text-zinc-100 capitalize">
								{analysis.tag} Analysis
							</h3>
							<span class="rounded-md bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
								{analysis.solvedCount} problems
							</span>
						</div>
						<p class="mt-1 text-sm text-zinc-500">Performance overview & improvement insights</p>
					</div>
				</div>

				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
						<span class="text-lg">{analysis.masteryIcon}</span>
						<span class="text-sm font-medium text-zinc-100">{analysis.mastery}</span>
					</div>

					<button
						onclick={() => (selectedTagKey = null)}
						class="rounded-lg p-2 hover:bg-white/10"
						aria-label="Close analysis"
					>
						<X class="h-5 w-5 text-zinc-400 hover:text-white" />
					</button>
				</div>
			</div>

			<!-- Main Stats Grid with improved cards -->
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{#each [{ label: 'Topic Score', value: `${analysis.topicScore}%`, color: 'blue', bar: analysis.topicScore }, { label: 'Confidence', value: `${analysis.confidence.toFixed(0)}%`, color: 'emerald', bar: analysis.confidence }, { label: 'Success Rate', value: `${analysis.successRate}%`, color: 'rose', bar: analysis.successRate }, { label: 'Avg Rating', value: analysis.avgRating, color: 'amber', bar: Math.min(100, (analysis.avgRating / 3200) * 100) }] as stat}
					<div class="rounded-xl border border-white/5 bg-white/5 p-4">
						<div class="mb-1 flex justify-between text-xs text-zinc-400">
							<span>{stat.label}</span>
							<span>{stat.value}</span>
						</div>

						<div class="h-1.5 overflow-hidden rounded-full bg-white/10">
							<div
								class="h-full rounded-full bg-gradient-to-r from-{stat.color}-500 to-{stat.color}-400"
								style="width: {stat.bar}%"
							></div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Detailed Metrics -->
			<div class="mt-8 grid gap-6 md:grid-cols-2">
				<!-- Performance Metrics -->
				<div
					class="rounded-xl border border-white/10 bg-gradient-to-b from-zinc-950/90 to-black/85 p-5"
				>
					<div class="mb-4 flex items-center justify-between">
						<h4 class="text-sm font-semibold tracking-wide text-zinc-100">Performance Metrics</h4>
						<span class="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
							DETAILS
						</span>
					</div>

					<div class="divide-y divide-white/5">
						<!-- Metric Item -->
						<div class="flex items-center justify-between py-3">
							<div class="flex items-center gap-3">
								<div class="rounded-md bg-blue-500/10 p-2">
									<CheckCircle class="h-4 w-4 text-blue-400" />
								</div>
								<div>
									<div class="text-sm font-medium text-zinc-300">Problems Solved</div>
									<div class="text-xs text-zinc-500">Successful submissions</div>
								</div>
							</div>
							<div class="text-lg font-semibold text-zinc-100">
								{analysis.solvedCount}
							</div>
						</div>

						<div class="flex items-center justify-between py-3">
							<div class="flex items-center gap-3">
								<div class="rounded-md bg-purple-500/10 p-2">
									<Repeat class="h-4 w-4 text-purple-400" />
								</div>
								<div>
									<div class="text-sm font-medium text-zinc-300">Total Attempts</div>
									<div class="text-xs text-zinc-500">Across all problems</div>
								</div>
							</div>
							<div class="text-lg font-semibold text-purple-300">
								{analysis.totalAttempts}
							</div>
						</div>

						<div class="flex items-center justify-between py-3">
							<div class="flex items-center gap-3">
								<div class="rounded-md bg-rose-500/10 p-2">
									<TrendingUp class="h-4 w-4 text-rose-400" />
								</div>
								<div>
									<div class="text-sm font-medium text-zinc-300">Avg Attempts</div>
									<div class="text-xs text-zinc-500">Per problem</div>
								</div>
							</div>
							<div class="text-lg font-semibold text-rose-300">
								{analysis.avgAttempts}
							</div>
						</div>

						<div class="flex items-center justify-between py-3">
							<div class="flex items-center gap-3">
								<div class="rounded-md bg-indigo-500/10 p-2">
									<Award class="h-4 w-4 text-indigo-400" />
								</div>
								<div>
									<div class="text-sm font-medium text-zinc-300">Rated Problems</div>
									<div class="text-xs text-zinc-500">With difficulty</div>
								</div>
							</div>
							<div class="text-lg font-semibold text-indigo-300">
								{analysis.ratedProblemsCount}
							</div>
						</div>
					</div>
				</div>

				<!-- Improvement Plan -->
				<div class="space-y-3">
					{#if analysis.suggestions.length > 0}
						{#each analysis.suggestions as suggestion, i}
							<div class="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
								<div class="text-xs font-semibold text-zinc-400">{i + 1}</div>
								<p class="text-sm leading-relaxed text-zinc-300">
									{suggestion}
								</p>
							</div>
						{/each}
					{:else}
						<div class="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
							<Trophy class="mx-auto mb-3 h-8 w-8 text-emerald-400" />
							<div class="text-sm font-semibold text-emerald-300">Excellent Performance</div>
							<p class="mt-1 text-xs text-emerald-300/70">You’re ready for harder challenges.</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Action Button -->
			<div class="mt-8 flex items-center justify-between">
				<div class="text-xs text-zinc-500">
					Last updated: {new Date().toLocaleDateString()}
				</div>

				<button
					onclick={() => (selectedTagKey = null)}
					class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white hover:bg-white/10"
				>
					<ArrowLeft class="h-3 w-3" />
					Back to Overview
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Smooth transitions */
	* {
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease;
	}
</style>
