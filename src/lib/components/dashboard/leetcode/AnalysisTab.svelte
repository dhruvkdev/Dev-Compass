<script lang="ts">
	import { Layers, Brain, Award, Zap, BookOpen } from 'lucide-svelte';

	let { skills } = $props();

	// Helper to sort and pick top skills
	function topSkills(list: any[], limit = 5) {
		return (list || []).sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, limit);
	}

	let advanced = $derived(topSkills(skills?.advanced || []));
	let intermediate = $derived(topSkills(skills?.intermediate || []));
	let fundamental = $derived(topSkills(skills?.fundamental || []));
</script>

<div class="space-y-8 pt-6">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<div class="rounded-lg bg-indigo-500/20 p-2">
			<Brain class="h-6 w-6 text-indigo-400" />
		</div>
		<div>
			<h2 class="text-xl font-bold text-white">Skill Analysis</h2>
			<p class="text-sm text-zinc-400">Topic mastery based on problem difficulty</p>
		</div>
	</div>

	<!-- Skill Pyramid (Visualized as Cards for clarity) -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Advanced (Top Tier) -->
		<div
			class="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-zinc-900/50 p-6 backdrop-blur-md"
		>
			<div
				class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500 to-rose-700"
			></div>
			<div class="mb-6 flex items-center gap-3">
				<Award class="h-5 w-5 text-rose-400" />
				<h3 class="text-lg font-semibold text-white">Advanced</h3>
			</div>

			<div class="space-y-3">
				{#each advanced as skill}
					<div
						class="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2"
					>
						<span class="text-sm font-medium text-white">{skill.tagName}</span>
						<span class="font-mono text-xs text-rose-300">x{skill.problemsSolved}</span>
					</div>
				{:else}
					<p class="text-sm text-zinc-500 italic">No advanced problems solved yet.</p>
				{/each}
			</div>
			<div class="mt-4 text-xs text-zinc-500">Complex DP, Hard Graph Theory, etc.</div>
		</div>

		<!-- Intermediate (Mid Tier) -->
		<div
			class="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-zinc-900/50 p-6 backdrop-blur-md"
		>
			<div
				class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-700"
			></div>
			<div class="mb-6 flex items-center gap-3">
				<Zap class="h-5 w-5 text-amber-400" />
				<h3 class="text-lg font-semibold text-white">Intermediate</h3>
			</div>

			<div class="space-y-3">
				{#each intermediate as skill}
					<div
						class="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2"
					>
						<span class="text-sm font-medium text-white">{skill.tagName}</span>
						<span class="font-mono text-xs text-amber-300">x{skill.problemsSolved}</span>
					</div>
				{:else}
					<p class="text-sm text-zinc-500 italic">No intermediate problems solved yet.</p>
				{/each}
			</div>
			<div class="mt-4 text-xs text-zinc-500">Standard Algorithms, Optimization stats.</div>
		</div>

		<!-- Fundamental (Base Tier) -->
		<div
			class="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-zinc-900/50 p-6 backdrop-blur-md"
		>
			<div
				class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-700"
			></div>
			<div class="mb-6 flex items-center gap-3">
				<BookOpen class="h-5 w-5 text-emerald-400" />
				<h3 class="text-lg font-semibold text-white">Fundamental</h3>
			</div>

			<div class="space-y-3">
				{#each fundamental as skill}
					<div
						class="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2"
					>
						<span class="text-sm font-medium text-white">{skill.tagName}</span>
						<span class="font-mono text-xs text-emerald-300">x{skill.problemsSolved}</span>
					</div>
				{:else}
					<p class="text-sm text-zinc-500 italic">No foundational problems solved yet.</p>
				{/each}
			</div>
			<div class="mt-4 text-xs text-zinc-500">Core Data Structures, Basic Logic.</div>
		</div>
	</div>

	<!-- Additional Analysis (Tag Cloud / All Skills) could go here -->
	<div class="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-md">
		<div class="mb-4 flex items-center gap-2">
			<Layers class="h-5 w-5 text-zinc-400" />
			<h3 class="text-sm font-semibold text-white">Analysis Insight</h3>
		</div>
		<p class="text-sm text-zinc-400">
			Skills are categorized by LeetCode into Fundamental, Intermediate, and Advanced based on
			problem tags. Focus on moving skills from Fundamental to Intermediate to increase your
			interview readiness.
		</p>
	</div>
</div>
