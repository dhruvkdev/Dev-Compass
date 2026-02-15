<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Toast from '$lib/components/Toast.svelte';
	import LeetCodeImportModal from '$lib/components/LeetCodeImportModal.svelte';
	import RecommendationCard from '$lib/components/dashboard/RecommendationCard.svelte';
	import PlatformSection from '$lib/components/dashboard/PlatformSection.svelte';
	import PlatformStatusPill from '$lib/components/dashboard/PlatformStatusPill.svelte';
	import type { PageData } from './$types';
	import type { PlatformData, RecommendedProblem, GithubRecommendation } from '$lib/types';
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { ChevronDown } from "lucide-svelte";

	let { data }: { data: PageData } = $props();

	// --- Platform data ---
	let platforms = $derived(data.platforms as PlatformData[]);

	let codeforcesData = $derived(
		platforms.find(
			(p): p is Extract<PlatformData, { platform: 'codeforces' }> => p.platform === 'codeforces'
		)
	);

	let leetcodeData = $derived(
		platforms.find(
			(p): p is Extract<PlatformData, { platform: 'leetcode' }> => p.platform === 'leetcode'
		)
	);

	let githubData = $derived(
		platforms.find(
			(p): p is Extract<PlatformData, { platform: 'github' }> => p.platform === 'github'
		)
	);

	// --- LeetCode sync state ---
	let leetcodeSync = $derived((data as any).leetcodeSync as { gapDetected: boolean; lastSyncedAt: string | null; needsInitialImport: boolean } | null);
	let showImportModal = $state(false);
	let showGapToast = $state(false);
	let importModalDismissed = $state(false);

	$effect(() => {
		if (leetcodeData && leetcodeSync) {
			if (leetcodeSync.needsInitialImport && !importModalDismissed) showImportModal = true;
			if (leetcodeSync.gapDetected) showGapToast = true;
		}
	});

	// --- Unified recommendations (merge CF + LC, sorted by score desc) ---
	let allRecommendations = $derived.by(() => {
		const recs: RecommendedProblem[] = [];

		if (codeforcesData) {
			for (const p of codeforcesData.data.cfProblemsByRating) {
				recs.push(p as RecommendedProblem);
			}
		}
		if (leetcodeData) {
			for (const p of leetcodeData.recommendedProblems) {
				recs.push(p as RecommendedProblem);
			}
		}

		return recs.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
	});

	let showAllRecs = $state(false);
	let visibleRecs = $derived(showAllRecs ? allRecommendations : allRecommendations.slice(0, 6));

	// --- CF problem browser state ---
	let cfSortBy = $state<'rating' | 'difficulty' | 'title'>('rating');
	let cfSortOrder = $state<'asc' | 'desc'>('desc');
	let cfFilterText = $state('');
	let cfSelectedTags = $state<string[]>([]);
	let cfShowFilters = $state(false);
  let displayLabel = $derived(cfSortBy.charAt(0).toUpperCase() + cfSortBy.slice(1));

	let cfProblems = $derived(codeforcesData ? codeforcesData.data.cfProblemsByRating : []);
	let cfAllTags = $derived([...new Set(cfProblems.flatMap((p) => p.tags || []))].sort());

	let cfFilteredProblems = $derived(
		cfProblems
			.filter((problem) => {
				const matchesSearch =
					!cfFilterText ||
					problem.title.toLowerCase().includes(cfFilterText.toLowerCase()) ||
					problem.tags?.some((tag: string) => tag.toLowerCase().includes(cfFilterText.toLowerCase()));
				const matchesTags =
					cfSelectedTags.length === 0 ||
					cfSelectedTags.every((tag: string) => problem.tags?.includes(tag));
				return matchesSearch && matchesTags;
			})
			.sort((a, b) => {
				let comparison = 0;
				if (cfSortBy === 'rating') {
					comparison = (a.rating || 0) - (b.rating || 0);
				} else if (cfSortBy === 'difficulty') {
					const order: Record<string, number> = { easy: 1, medium: 2, hard: 3, 'very-hard': 4 };
					comparison =
						(a.difficulty ? order[a.difficulty.toLowerCase()] || 0 : 0) -
						(b.difficulty ? order[b.difficulty.toLowerCase()] || 0 : 0);
				} else {
					comparison = a.title.localeCompare(b.title);
				}
				return cfSortOrder === 'asc' ? comparison : -comparison;
			})
	);

	// --- Helpers ---
	function clearCfFilters() {
		cfFilterText = '';
		cfSelectedTags = [];
		cfSortBy = 'rating';
		cfSortOrder = 'desc';
	}

	function toggleCfTag(tag: string) {
		cfSelectedTags = cfSelectedTags.includes(tag)
			? cfSelectedTags.filter((t) => t !== tag)
			: [...cfSelectedTags, tag];
	}

	// --- Styles ---
	const diffColors: Record<string, string> = {
		easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
		medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
		hard: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
		'very-hard': 'text-purple-400 bg-purple-400/10 border-purple-400/20'
	};

	function getRatingColor(rating: number): string {
		if (rating >= 2400) return 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]';
		if (rating >= 2100) return 'text-orange-400';
		if (rating >= 1900) return 'text-purple-400';
		if (rating >= 1600) return 'text-blue-400';
		if (rating >= 1400) return 'text-cyan-400';
		if (rating >= 1200) return 'text-emerald-400';
		return 'text-zinc-500';
	}
</script>

<!-- Modals & Toasts -->
{#if showImportModal}
	<LeetCodeImportModal
		open={showImportModal}
		onClose={() => {
			showImportModal = false;
			importModalDismissed = true;
		}}
	/>
{/if}

{#if showGapToast}
	<Toast
		message="Some older LeetCode submissions may be missing. Use bulk import to fill gaps."
		type="warning"
		onClose={() => (showGapToast = false)}
	/>
{/if}

<div class="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
	<!-- Background fx -->
	<div
		class="fixed top-0 left-0 w-full h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 pointer-events-none"
	></div>
	<div
		class="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"
	></div>

	<main class="relative max-w-7xl mx-auto px-6 py-24">
		<!-- ===== ZONE 1: HERO ===== -->
		<header class="mb-12" in:fade={{ duration: 300, delay: 100 }}>
			<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
				<div>
					<h1
						class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400"
					>
						Dashboard
					</h1>
					<p class="text-zinc-500 mt-2">Here's what to work on next.</p>
				</div>
			</div>

			<!-- Platform status pills -->
			<div class="flex flex-wrap gap-2">
				<PlatformStatusPill
					platform="codeforces"
					connected={!!codeforcesData}
					handle={codeforcesData?.handle}
				/>
				<PlatformStatusPill
					platform="leetcode"
					connected={!!leetcodeData}
					handle={leetcodeData?.handle}
				/>
				<PlatformStatusPill
					platform="github"
					connected={!!githubData}
					handle={githubData?.handle}
				/>
			</div>
		</header>

		<!-- ===== ZONE 2: RECOMMENDATIONS ===== -->
		{#if allRecommendations.length > 0}
			<section class="mb-12" in:fly={{ y: 20, duration: 400, delay: 200, easing: cubicOut }}>
				<div class="flex items-center justify-between mb-6">
					<div>
						<h2 class="text-xl font-semibold text-zinc-200">Recommended for You</h2>
						<p class="text-sm text-zinc-500 mt-1">
							Personalized picks based on your weak areas · {allRecommendations.length} problems
						</p>
					</div>
					{#if allRecommendations.length > 6}
						<button
							onclick={() => (showAllRecs = !showAllRecs)}
							class="text-sm text-blue-400 hover:text-blue-300 transition-colors"
						>
							{showAllRecs ? 'Show less' : `Show all ${allRecommendations.length}`}
						</button>
					{/if}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each visibleRecs as problem (problem.id)}
						<div in:fade={{ duration: 200 }}>
							<RecommendationCard {problem} />
						</div>
					{/each}
				</div>
			</section>
		{:else}
			<section
				class="mb-12 border border-white/5 rounded-2xl bg-zinc-900/30 p-12 text-center"
				in:fade={{ duration: 300 }}
			>
				<div class="text-4xl mb-4">🧭</div>
				<h2 class="text-lg font-semibold text-zinc-300 mb-2">No recommendations yet</h2>
				<p class="text-sm text-zinc-500 max-w-md mx-auto">
					Connect a platform and solve some problems. We'll analyze your weak areas and suggest what
					to practice next.
				</p>
				<a
					href="/verify"
					class="inline-block mt-6 px-5 py-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-sm font-medium"
				>
					Connect a platform
				</a>
			</section>
		{/if}

		<!-- ===== ZONE 3: PLATFORM SECTIONS ===== -->
		<div class="space-y-4" in:fly={{ y: 20, duration: 400, delay: 300, easing: cubicOut }}>
			<!-- Codeforces Section -->
			{#if codeforcesData}
				<PlatformSection
					title="Codeforces"
					subtitle="{codeforcesData.handle} · {cfProblems.length} problems in range"
					platform="codeforces"
				>
					{#snippet children()}
						<!-- Inline stats -->
						<div class="flex flex-wrap gap-3 mb-4">
							<div
								class="px-3 py-2 bg-zinc-800/50 rounded-lg border border-white/5 text-sm"
							>
								<span class="text-zinc-500">Rating:</span>
								<span class="font-mono {getRatingColor(Number(codeforcesData?.data?.info?.rating ?? 0))}">
									{codeforcesData?.data?.info?.rating ?? '—'}
								</span>
							</div>
							<div
								class="px-3 py-2 bg-zinc-800/50 rounded-lg border border-white/5 text-sm"
							>
								<span class="text-zinc-500">Showing:</span>
								<span class="text-zinc-200 font-mono">{cfFilteredProblems.length}</span>
								<span class="text-zinc-600">/ {cfProblems.length}</span>
							</div>
							{#if codeforcesData?.data?.weakTags?.length}
								<div
									class="px-3 py-2 bg-zinc-800/50 rounded-lg border border-white/5 text-sm flex items-center gap-2"
								>
									<span class="text-zinc-500">Weak:</span>
									{#each codeforcesData.data.weakTags.slice(0, 3) as wt}
										<span class="text-rose-400 text-xs">{wt.tag}</span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Controls row -->
						<div
							class="flex flex-col sm:flex-row gap-2 mb-4 p-3 bg-zinc-800/30 rounded-xl border border-white/5"
						>
							<div class="flex-1 relative">
								<svg
									class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
								<input
									type="text"
									placeholder="Search Codeforces problems..."
									bind:value={cfFilterText}
									class="w-full pl-9 pr-4 py-2 bg-zinc-900/50 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 rounded-lg border border-white/5"
								/>
							</div>
							<div class="flex gap-2 items-center">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="inline-flex w-[140px] items-center justify-between rounded-md border border-white/5 bg-zinc-900/50 px-3 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus:outline-none cursor-pointer"
									>
										{displayLabel}
										<ChevronDown class="ml-2 h-4 w-4 opacity-50" />
									</DropdownMenu.Trigger>

									<DropdownMenu.Content class="w-40 bg-zinc-950 border-white/10 text-zinc-300">
										<DropdownMenu.Group>
											<DropdownMenu.Label>Sort By</DropdownMenu.Label>
											<DropdownMenu.Separator class="bg-white/5" />
											<DropdownMenu.Item onclick={() => cfSortBy = "rating"}>
												Rating
											</DropdownMenu.Item>
											<DropdownMenu.Item onclick={() => cfSortBy = "difficulty"}>
												Difficulty
											</DropdownMenu.Item>
											<DropdownMenu.Item onclick={() => cfSortBy = "title"}>
												Title
											</DropdownMenu.Item>
										</DropdownMenu.Group>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
								<button
									onclick={() => (cfSortOrder = cfSortOrder === 'asc' ? 'desc' : 'asc')}
									class="p-2 bg-zinc-900/50 rounded-lg border border-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
									aria-label="Toggle sort order"
								>
									<svg
										class="w-4 h-4 transition-transform {cfSortOrder === 'asc' ? 'rotate-180' : ''}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>
								<button
									onclick={() => (cfShowFilters = !cfShowFilters)}
									class="p-2 bg-zinc-900/50 rounded-lg border border-white/5 text-zinc-400 hover:text-zinc-200 transition-colors {cfSelectedTags.length > 0 ? 'ring-1 ring-blue-500/30' : ''}"
									aria-label="Toggle tag filters"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
										/>
									</svg>
								</button>
								{#if cfFilterText || cfSelectedTags.length > 0}
									<button
										onclick={clearCfFilters}
										class="px-3 py-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
									>
										Clear
									</button>
								{/if}
							</div>
						</div>

						<!-- Tag filter chips -->
						{#if cfShowFilters && cfAllTags.length > 0}
							<div class="flex flex-wrap gap-1.5 mb-4 p-3 bg-zinc-800/20 rounded-xl border border-white/5">
								{#each cfAllTags as tag}
									<button
										onclick={() => toggleCfTag(tag)}
										class="px-2.5 py-1 text-xs rounded-md border transition-colors
											{cfSelectedTags.includes(tag)
											? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
											: 'bg-zinc-800/50 text-zinc-400 border-white/5 hover:bg-zinc-700/50'}"
									>
										{tag}
									</button>
								{/each}
							</div>
						{/if}

						<!-- Problem list -->
						{#if cfFilteredProblems.length === 0}
							<div class="text-center py-8 text-zinc-500">
								<p>No problems match your filters.</p>
								{#if cfFilterText || cfSelectedTags.length > 0}
									<button
										onclick={clearCfFilters}
										class="mt-2 text-sm text-blue-400 hover:text-blue-300"
									>
										Clear all filters
									</button>
								{/if}
							</div>
						{:else}
							<div class="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden">
								{#each cfFilteredProblems as problem (problem.id)}
									<a
										href={problem.url}
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors group"
									>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span
													class="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate"
												>
													{problem.title}
												</span>
												{#if problem.difficulty}
													<span
														class="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded border
															{diffColors[problem.difficulty.toLowerCase()] ?? 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'}"
													>
														{problem.difficulty}
													</span>
												{/if}
											</div>
											{#if problem.tags?.length}
												<div class="flex gap-1 mt-1">
													{#each problem.tags.slice(0, 4) as tag}
														<span class="text-[10px] text-zinc-500">{tag}</span>
													{/each}
												</div>
											{/if}
										</div>
										<div class="flex items-center gap-3 shrink-0 ml-4">
											{#if problem.rating}
												<span class="font-mono text-sm {getRatingColor(problem.rating)}">{problem.rating}</span>
											{/if}
											<svg
												class="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors"
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
									</a>
								{/each}
							</div>
						{/if}
					{/snippet}
				</PlatformSection>
			{/if}

			<!-- LeetCode Section -->
			{#if leetcodeData}
				<PlatformSection
					title="LeetCode"
					subtitle="{leetcodeData.handle} · {leetcodeData.recommendedProblems.length} recommendations"
					platform="leetcode"
				>
					{#snippet children()}
						<div class="flex flex-wrap gap-3 mb-4">
							<div
								class="px-3 py-2 bg-zinc-800/50 rounded-lg border border-white/5 text-sm"
							>
								<span class="text-zinc-500">Synced:</span>
								<span class="text-zinc-200">
									{leetcodeSync?.lastSyncedAt
										? new Date(leetcodeSync.lastSyncedAt).toLocaleDateString()
										: 'Never'}
								</span>
							</div>
							{#if leetcodeSync?.needsInitialImport}
								<button
									onclick={() => (showImportModal = true)}
									class="px-3 py-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 text-sm font-medium hover:bg-amber-500/20 transition-colors"
								>
									Import submission history →
								</button>
							{/if}
						</div>

						{#if leetcodeData.recommendedProblems.length === 0}
							<p class="text-zinc-500 text-sm py-4">
								No LeetCode recommendations available. Import your submissions to get started.
							</p>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
								{#each leetcodeData.recommendedProblems as problem (problem.id)}
									<RecommendationCard {problem} />
								{/each}
							</div>
						{/if}
					{/snippet}
				</PlatformSection>
			{/if}

			<!-- GitHub Section -->
			{#if githubData}
				<!-- svelte-ignore attribute_quoted -->
				<PlatformSection title="GitHub" subtitle="{githubData.handle} · {githubData.githubRecommendations.length} recommendations" platform="github">
					{#snippet children()}
						{#if githubData.githubRecommendations.length === 0}
							<p class="text-zinc-500 text-sm py-4">
								No GitHub recommendations yet. Keep contributing and we'll generate personalized suggestions.
							</p>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
								{#each githubData.githubRecommendations as rec}
									{@const categoryColors = {
										reinforcement: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
										depth: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
										maintenance: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
										micro_collaboration: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
									}}
									<div class="p-4 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
										<div class="flex items-center gap-2 mb-3">
											<span class="px-2 py-0.5 text-[10px] font-semibold uppercase rounded border {categoryColors[rec.category] ?? 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'}">
												{rec.category.replace('_', ' ')}
											</span>
											<span class="text-[10px] text-zinc-600 font-mono">{rec.axisTargeted}</span>
										</div>
										<h4 class="text-sm font-medium text-zinc-200 mb-1.5">{rec.title}</h4>
										<p class="text-xs text-zinc-500 leading-relaxed">{rec.description}</p>
									</div>
								{/each}
							</div>
						{/if}
					{/snippet}
				</PlatformSection>
			{/if}
		</div>

		<!-- ===== ZONE 4: SYNC STATUS ===== -->
		<footer
			class="mt-12 pt-8 border-t border-white/5"
			in:fade={{ duration: 300, delay: 400 }}
		>
			<div class="flex flex-wrap items-center gap-6 text-xs text-zinc-600">
				{#if codeforcesData}
					<span>⚡ Codeforces: connected as <span class="text-zinc-400">{codeforcesData.handle}</span></span>
				{/if}
				{#if leetcodeData}
					<span>
						🧩 LeetCode: last synced
						<span class="text-zinc-400">
							{leetcodeSync?.lastSyncedAt
								? new Date(leetcodeSync.lastSyncedAt).toLocaleDateString()
								: 'never'}
						</span>
					</span>
				{/if}
				{#if githubData}
					<span>🐙 GitHub: connected as <span class="text-zinc-400">{githubData.handle}</span></span>
				{/if}
				{#if !codeforcesData && !leetcodeData && !githubData}
					<span>No platforms connected. <a href="/verify" class="text-blue-400 hover:text-blue-300">Connect one →</a></span>
				{/if}
			</div>
		</footer>
	</main>
</div>