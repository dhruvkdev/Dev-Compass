<script lang="ts">
	import type { RecommendedProblem } from '$lib/types';

	type Props = {
		problem: RecommendedProblem;
	};

	let { problem }: Props = $props();

	const platformColors: Record<string, string> = {
		codeforces: 'from-zinc-700/20 to-zinc-800/10',
		leetcode: 'from-zinc-700/20 to-zinc-800/10',
		github: 'from-zinc-700/20 to-zinc-800/10'
	};


	const platformLabels: Record<string, string> = {
		codeforces: 'CF',
		leetcode: 'LC',
		github: 'GH'
	};

	const platformTextColors: Record<string, string> = {
		codeforces: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20',
		leetcode: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20',
		github: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20'
	};


	const diffColors: Record<string, string> = {
		easy: 'text-teal-300 bg-teal-500/10',
		medium: 'text-sky-300 bg-sky-500/10',
		hard: 'text-rose-300 bg-rose-500/10'
	};
	

</script>

<a
	href={problem.url}
	target="_blank"
	rel="noopener noreferrer"
	class="group relative flex flex-col p-5 h-full rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm
		hover:bg-zinc-800/40 hover:border-white/10 hover:-translate-y-0.5 hover:shadow-xl
		transition-all duration-300"
>
	<!-- Platform accent glow on hover -->
	<div
		class="absolute -inset-px rounded-2xl bg-gradient-to-br {platformColors[problem.platform] ?? ''} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
	></div>

	<div class="relative flex-1 flex flex-col gap-3">
		<!-- Header: platform badge + title + difficulty -->
		<div class="flex items-start justify-between gap-3">
			<div class="flex items-center gap-2.5 min-w-0">
				<span
					class="shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border {platformTextColors[problem.platform] ?? 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'}"
				>
					{platformLabels[problem.platform] ?? '?'}
				</span>
				<h3
					class="text-base font-medium text-zinc-200 group-hover:text-white transition-colors line-clamp-2"
				>
					{problem.title}
				</h3>
			</div>
			{#if problem.difficulty}
				<span
					class="shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full {diffColors[problem.difficulty] ?? 'text-zinc-400 bg-zinc-400/10'}"
				>
					{problem.difficulty}
				</span>
			{/if}
		</div>

		<!-- Tags -->
		{#if problem.tags?.length}
			<div class="flex flex-wrap gap-1.5">
				{#each problem.tags.slice(0, 3) as tag}
					<span
						class="px-2 py-0.5 text-[11px] bg-zinc-800/60 text-zinc-400 rounded-md border border-white/5"
					>
						{tag}
					</span>
				{/each}
				{#if problem.tags.length > 3}
					<span class="text-[10px] text-zinc-600 self-center">+{problem.tags.length - 3}</span>
				{/if}
			</div>
		{/if}

		<!-- Footer: score + rating + link icon -->
		<div class="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
			<div class="flex items-center gap-3 text-sm">
				<span class="font-mono text-emerald-400 text-xs">
					{Math.round(problem.score * 10)}% match
				</span>
				{#if problem.rating}
					<span class="font-mono text-zinc-500 text-xs">{problem.rating}</span>
				{/if}
			</div>
			<svg
				class="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
				/>
			</svg>
		</div>
	</div>
</a>
