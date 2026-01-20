<script lang="ts">
	import { Layers, Brain, Award, Zap, BookOpen, AlertTriangle, ArrowRight } from 'lucide-svelte';
	import { prioritizeSkills } from '$lib/utils/leetcode-insights';

	let { skills } = $props();

	let analysis = $derived(prioritizeSkills(skills));
	function handleyoutubeRedirect(query: string) {
		const url = `https://www.youtube.com/results?search_query=${query}+data+structures+and+algorithms+tutorial`;
		window.open(url, '_blank', 'noopener, noreferrer');
	}
</script>

<div class="space-y-6 pt-6">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<div class="rounded-lg bg-indigo-500/20 p-2">
			<Brain class="h-6 w-6 text-indigo-400" />
		</div>
		<div>
			<h2 class="text-xl font-bold text-white">Skill Analysis</h2>
			<p class="text-sm text-zinc-400">Prescriptive breakdown of your coding strengths & gaps</p>
		</div>
	</div>

	<!-- 1. Top Level Actions (Priority) -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- High ROI Actions -->
		<div
			class="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-zinc-900/50 p-6 backdrop-blur-md"
		>
			<div
				class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-700"
			></div>
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<Zap class="h-5 w-5 text-amber-400" />
					<h3 class="text-lg font-semibold text-white">Interview ROI Priority</h3>
				</div>
				<span class="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400"
					>Action Required</span
				>
			</div>

			<p class="mb-4 text-sm text-zinc-400">
				These intermediate topics are frequent in interviews but you haven't mastered them yet.
			</p>

			<div class="space-y-3">
				{#each analysis.roi as skill}
					<div
						class="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 transition-colors hover:border-amber-500/30 hover:bg-white/10"
					>
						<span class="text-sm font-medium text-white">{skill.tagName}</span>
						<button
							onclick={() => {
								handleyoutubeRedirect(skill.tagName);
							}}
						>
							<div class="flex items-center gap-3">
								<span class="font-mono text-xs text-zinc-500">{skill.problemsSolved} solved</span>
								<ArrowRight class="h-4 w-4 text-amber-500" />
							</div>
						</button>
					</div>
				{:else}
					<p class="text-sm text-zinc-500 italic">No high-priority ROI gaps found. Good job!</p>
				{/each}
			</div>
		</div>

		<!-- Critical Gaps -->
		<div
			class="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-zinc-900/50 p-6 backdrop-blur-md"
		>
			<div
				class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500 to-rose-700"
			></div>
			<div class="mb-6 flex items-center gap-3">
				<AlertTriangle class="h-5 w-5 text-rose-400" />
				<h3 class="text-lg font-semibold text-white">Critical Gaps</h3>
			</div>

			<p class="mb-4 text-sm text-zinc-400">
				Fundamental topics with little to no practice. These are low-hanging fruit.
			</p>

			<div class="space-y-3">
				{#each analysis.gaps as skill}
					<div
						class="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3"
					>
						<span class="text-sm font-medium text-white">{skill.tagName}</span>
						<span class="font-mono text-xs text-rose-300">
							{skill.problemsSolved === 0 ? 'Unexplored' : `Only ${skill.problemsSolved} solved`}
						</span>
					</div>
				{:else}
					<p class="text-sm text-zinc-500 italic">No critical fundamental gaps detected.</p>
				{/each}
			</div>
		</div>
	</div>

	<!-- 2. Strengths & Foundation -->
	<div class="rounded-2xl border border-emerald-500/20 bg-zinc-900/50 p-6 backdrop-blur-md">
		<div class="mb-6 flex items-center gap-3">
			<Award class="h-5 w-5 text-emerald-400" />
			<h3 class="text-lg font-semibold text-white">Your Top Strengths</h3>
		</div>

		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
			{#each analysis.strengths as skill}
				<div class="rounded-xl border border-white/5 bg-emerald-500/5 p-4 text-center">
					<div class="mb-1 text-2xl font-bold text-white">{skill.problemsSolved}</div>
					<div class="truncate text-xs font-medium text-emerald-200">{skill.tagName}</div>
					<div class="mt-1 text-[10px] text-emerald-500/60 uppercase">{skill.category}</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- 3. Concrete Action Plan -->
	<div class="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-md">
		<div class="mb-4 flex items-center gap-2">
			<Layers class="h-5 w-5 text-zinc-400" />
			<h3 class="text-sm font-semibold text-white">Recommended Next Steps</h3>
		</div>
		<div class="prose prose-invert max-w-none">
			<ul class="space-y-2 text-sm text-zinc-400">
				{#if analysis.gaps.length > 0}
					<li>
						<span class="font-medium text-rose-400">Immediate:</span>
						Solve 3 Easy problems for {analysis.gaps[0].tagName} to cover basics.
					</li>
				{/if}
				{#if analysis.roi.length > 0}
					<li>
						<span class="font-medium text-amber-400">Weekly Goal:</span>
						Target {analysis.roi[0].tagName} (Medium) - this is a high-value interview topic.
					</li>
				{/if}
				<li>
					<span class="font-medium text-emerald-400">Maintenance:</span>
					Do one {analysis.strengths[0]?.tagName || 'General'} Check-in problem to keep streaks alive.
				</li>
			</ul>
		</div>
	</div>
</div>
