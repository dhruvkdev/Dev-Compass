<script lang="ts">
	import {
		Trophy,
		Activity,
		Users,
		Award,
		Zap,
		Target,
		CheckCircle,
		BrainCircuit,
		Globe
	} from 'lucide-svelte';

	let { profile } = $props();

	/* -----------------------------
	   Rank Model LeetCode
	------------------------------ */
	// We don't have color tiers like CF, but we can visualize global ranking
	// Top 100k, 50k, 10k, etc.
	let rankTier = $derived.by(() => {
		const r = profile.ranking;
		if (r < 1000) return { name: 'Elite', color: 'text-amber-400', bg: 'bg-amber-500/20' };
		if (r < 10000) return { name: 'Master', color: 'text-purple-400', bg: 'bg-purple-500/20' };
		if (r < 50000) return { name: 'Expert', color: 'text-indigo-400', bg: 'bg-indigo-500/20' };
		if (r < 100000) return { name: 'Advanced', color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
		if (r < 500000) return { name: 'Intermediate', color: 'text-green-400', bg: 'bg-green-500/20' };
		return { name: 'Beginner', color: 'text-zinc-400', bg: 'bg-zinc-500/20' };
	});

	function formatCompact(num: number): string {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toString();
	}
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Profile Summary -->
	<div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 lg:col-span-1">
		<div class="flex items-start gap-4">
			<!-- Avatar Placeholder (LC API doesn't always give avatar reliable) -->
			<div class="relative">
				<div
					class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-zinc-800 bg-zinc-800"
				>
					<span class="text-2xl font-bold text-zinc-500">{profile.username[0]?.toUpperCase()}</span>
				</div>
				<div class="absolute -bottom-2 left-1/2 -translate-x-1/2">
					<div
						class={`rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${rankTier.color} border border-zinc-800 bg-black/80`}
					>
						{rankTier.name}
					</div>
				</div>
			</div>

			<!-- User Info -->
			<div class="min-w-0 flex-1">
				<div class="flex items-center justify-between">
					<h2 class="truncate text-lg font-semibold text-white">{profile.username}</h2>
					<Award class="h-4 w-4 text-zinc-600" />
				</div>
				<div class="mt-1 text-sm text-zinc-400">LeetCode Solver</div>

				<!-- Stats -->
				<div class="mt-3 grid grid-cols-2 gap-3">
					<div>
						<div class="text-xs text-zinc-500">Ranking</div>
						<div class="text-lg font-bold text-white">#{formatCompact(profile.ranking)}</div>
					</div>
					<div>
						<div class="text-xs text-zinc-500">Solved</div>
						<div class="text-lg font-bold text-amber-400">{profile.totalSolved}</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Progress (Completion Rate) -->
		<div class="mt-5">
			<div class="mb-1 flex justify-between text-xs text-zinc-500">
				<span>Completion Rate (of {profile.totalQuestions})</span>
				<span>{((profile.totalSolved / profile.totalQuestions) * 100).toFixed(1)}%</span>
			</div>
			<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
				<div
					class="h-full bg-amber-500 transition-all duration-500"
					style={`width: ${(profile.totalSolved / profile.totalQuestions) * 100}%`}
				></div>
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="lg:col-span-2">
		<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
			<!-- Global Ranking -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-indigo-500/10 p-2">
						<Globe class="h-4 w-4 text-indigo-400" />
					</div>
					<div class="min-w-0 flex-1">
						<div class="truncate text-xs text-zinc-500">Global Rank</div>
						<div class="mt-1 text-xl font-bold text-white">#{formatCompact(profile.ranking)}</div>
					</div>
				</div>
				<div class="mt-3 text-xs text-zinc-500">Top solver</div>
			</div>

			<!-- Total Solved -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-amber-500/10 p-2">
						<CheckCircle class="h-4 w-4 text-amber-400" />
					</div>
					<div class="flex-1">
						<div class="text-xs text-zinc-500">Problems Solved</div>
						<div class="mt-1 text-xl font-bold text-amber-400">{profile.totalSolved}</div>
					</div>
				</div>
				<div class="mt-3 text-xs text-zinc-500">
					{profile.easySolved} E · {profile.mediumSolved} M · {profile.hardSolved} H
				</div>
			</div>

			<!-- Hard Solved (Power Metric) -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-rose-500/10 p-2">
						<Trophy class="h-4 w-4 text-rose-400" />
					</div>
					<div class="flex-1">
						<div class="text-xs text-zinc-500">Hard Solved</div>
						<div class="mt-1 text-xl font-bold text-white">
							{profile.hardSolved}
						</div>
					</div>
				</div>
				<div class="mt-3">
					<div class="text-xs text-zinc-500">
						Beats {((profile.hardSolved / profile.totalSolved) * 100).toFixed(0)}% of self
					</div>
				</div>
			</div>

			<!-- Consistency (Placeholder or calc from elsewhere) -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-emerald-500/10 p-2">
						<Activity class="h-4 w-4 text-emerald-400" />
					</div>
					<div class="flex-1">
						<div class="text-xs text-zinc-500">Active Rate</div>
						<div class="mt-1 text-xl font-bold text-white">N/A</div>
					</div>
				</div>
				<div class="mt-3">
					<div class="text-xs text-zinc-500">Check submissions</div>
				</div>
			</div>
		</div>

		<!-- Quick Actions/Details -->
		<div
			class="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4 text-sm text-zinc-500"
		>
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-1">
					<Zap class="h-3 w-3 text-amber-400" />
					<span>Solved: {profile.totalSolved}</span>
				</div>
				<div class="flex items-center gap-1">
					<div class="h-1 w-1 rounded-full bg-zinc-700"></div>
					<span>Rank: {profile.ranking}</span>
				</div>
			</div>
			<div class="text-xs text-zinc-600">Updated just now</div>
		</div>
	</div>
</div>
