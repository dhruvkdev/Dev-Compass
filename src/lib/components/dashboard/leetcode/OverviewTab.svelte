<script lang="ts">
	import ProfileHeader from './ProfileHeader.svelte';
	import DifficultyBreakdown from './DifficultyBreakdown.svelte';
	import RecentActivity from './RecentActivity.svelte';
	import { Code2, Zap, TrendingUp, AlertTriangle, Target } from 'lucide-svelte';
	import { getCoachSummary } from '$lib/utils/leetcode-insights';
	import ContestRatingGraph from './ContestRatingGraph.svelte';

	let { data } = $props();

	let summary = $derived(getCoachSummary(data));
</script>

<div class="space-y-6 pt-6">
	<!-- 0. Coach's Note (New Prescriptive Section) -->
	<div class="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 backdrop-blur-md">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Zap class="h-5 w-5 text-indigo-400" />
				<h3 class="text-lg font-bold text-white">Coach's Insight</h3>
			</div>
			<!-- Momentum Tag -->
			<div
				class="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1"
			>
				<TrendingUp
					class="h-3 w-3 {summary.momentum === 'high' ? 'text-green-400' : 'text-zinc-400'}"
				/>
				<span class="text-xs font-medium tracking-wider text-zinc-300 uppercase">
					Momentum: <span class={summary.momentum === 'high' ? 'text-green-400' : 'text-white'}
						>{summary.momentum}</span
					>
				</span>
			</div>
		</div>

		<div class="grid gap-6 md:grid-cols-3">
			<div class="space-y-2 md:col-span-2">
				<p class="text-lg font-medium text-white">
					{summary.levelSummary}
				</p>
				<p class="text-sm text-zinc-400">
					{summary.focusRecommendation}
				</p>
			</div>

			<!-- Quick Actions / Warnings -->
			<div class="space-y-3 border-l border-white/10 pl-6">
				{#if summary.imbalance}
					<div class="flex items-start gap-3">
						<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
						<div>
							<p class="text-sm font-medium text-amber-200">{summary.imbalance.title}</p>
							<p class="text-xs text-amber-500/80">{summary.imbalance.action}</p>
						</div>
					</div>
				{/if}
				<div class="flex items-start gap-3">
					<Target class="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
					<div>
						<p class="text-sm font-medium text-emerald-200">Primary Focus</p>
						<p class="text-xs text-emerald-500/80">{summary.focusRecommendation.split('.')[0]}</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- 0.5. Contest Rating Graph -->
	{#if data.contestHistory && data.contestHistory.length > 0}
		<div class="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-md">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<TrendingUp class="h-5 w-5 text-indigo-400" />
					<h3 class="text-lg font-bold text-white">Contest Rating</h3>
				</div>
				<div class="text-xs text-zinc-500">
					Current Rating: <span class="font-medium text-white"
						>{data.contestHistory[data.contestHistory.length - 1].rating}</span
					>
				</div>
			</div>

			<ContestRatingGraph
				datasets={[{ label: data.profile.username, color: '#6366f1', data: data.contestHistory }]}
				variant="overview"
			/>
		</div>
	{/if}

	<!-- 1. Profile Section -->
	<ProfileHeader profile={data.profile} />

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- 2. Solved Stats (Difficulty) -->
		<div class="lg:col-span-1">
			<DifficultyBreakdown
				easy={data.profile.easySolved}
				medium={data.profile.mediumSolved}
				hard={data.profile.hardSolved}
				total={data.profile.totalSolved}
			/>
		</div>

		<!-- 3. Recent Activity & Languages -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Languages -->
			<div class="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-md">
				<h3 class="mb-4 text-lg font-bold text-white">Languages</h3>
				<div class="flex flex-wrap gap-2">
					{#each data.languages as lang}
						<div
							class="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2"
						>
							<Code2 class="h-4 w-4 text-zinc-500" />
							<span class="text-sm font-medium text-white">{lang.languageName}</span>
							<span class="text-xs text-zinc-500">{lang.problemsSolved} solved</span>
						</div>
					{:else}
						<p class="text-sm text-zinc-500">No language data available</p>
					{/each}
				</div>
			</div>

			<!-- Activity -->
			<RecentActivity submissions={data.recentSubmissions} />
		</div>
	</div>
</div>
