<script lang="ts">
	import { Trophy, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-svelte';

	interface Contest {
		contestName: string;
		rank: number;
		oldRating: number;
		newRating: number;
		contestId: number;
		ratingUpdateTimeSeconds: number;
	}

	let { history = [] }: { history: Contest[] } = $props();

	// FIXED: Use $derived so this updates when 'history' prop changes
	// Take last 4 for the row view as per design
	let recent = $derived([...history].reverse().slice(0, 4));

	function getDeltaColor(delta: number) {
		if (delta > 0) return 'text-green-400';
		if (delta < 0) return 'text-red-400';
		return 'text-zinc-500';
	}
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
	{#each recent as contest}
		{@const delta = contest.newRating - contest.oldRating}

		<div
			class="group relative overflow-hidden rounded-xl border border-white/5 bg-black/20 p-4 transition-all hover:border-white/10 hover:bg-black/40"
		>
			<!-- Decoration -->
			<div
				class="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-indigo-500/5 transition-all group-hover:bg-indigo-500/10"
			></div>

			<div class="relative z-10 flex h-full flex-col justify-between space-y-4">
				<!-- Header -->
				<div class="flex items-start justify-between gap-2">
					<div class="flex items-center gap-2">
						<span class="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400"
							>CF</span
						>
						<span class="text-[10px] text-zinc-500"
							>{new Date(contest.ratingUpdateTimeSeconds * 1000).toLocaleDateString()}</span
						>
					</div>
					{#if delta !== 0}
						<div class="flex items-center gap-0.5 text-xs font-bold {getDeltaColor(delta)}">
							{#if delta > 0}<TrendingUp class="h-3 w-3" />{/if}
							{#if delta < 0}<TrendingDown class="h-3 w-3" />{/if}
							{delta > 0 ? '+' : ''}{delta}
						</div>
					{:else}
						<Minus class="h-3 w-3 text-zinc-600" />
					{/if}
				</div>

				<!-- Content -->
				<div>
					<h4 class="line-clamp-2 text-sm font-medium text-white" title={contest.contestName}>
						{contest.contestName.replace('Codeforces Round ', '#').replace(' (Div. ', ' ')}
					</h4>
				</div>

				<!-- Footer Stats -->
				<div class="flex items-center justify-between border-t border-white/5 pt-3">
					<div class="flex flex-col">
						<span class="flex items-center gap-1 text-[10px] text-zinc-500 uppercase">
							<Trophy class="h-3 w-3" /> Rank
						</span>
						<span class="text-sm font-bold text-yellow-500">#{contest.rank}</span>
					</div>
					<div class="flex flex-col items-end">
						<span class="text-[10px] text-zinc-500 uppercase">Rating</span>
						<span class="text-sm font-bold text-white">{contest.newRating}</span>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
