<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { invalidateAll } from '$app/navigation';
	import LeetCodeImportModal from '$lib/components/LeetCodeImportModal.svelte';
	import RecommendationCard from '$lib/components/dashboard/RecommendationCard.svelte';
	import PlatformSection from '$lib/components/dashboard/PlatformSection.svelte';
	import PlatformStatusPill from '$lib/components/dashboard/PlatformStatusPill.svelte';
	import type { PageData } from './$types';
	import type { PlatformData, RecommendedProblem, GithubRecommendation } from '$lib/types';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { ChevronDown } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

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
	let leetcodeSync = $derived(
		(data as any).leetcodeSync as {
			gapDetected: boolean;
			lastSyncedAt: string | null;
			needsInitialImport: boolean;
			isSynced: boolean;
		} | null
	);
	let showImportModal = $state(false);

	// --- Unified recommendations (merge CF + LC, sorted by score desc) ---
	let allRecommendations = $derived.by(() => {
		const recs: RecommendedProblem[] = [];

		if (codeforcesData) {
			for (const p of codeforcesData.data.cfProblemsByRating) {
				recs.push(p as RecommendedProblem);
			}
		}
		if (leetcodeData && leetcodeSync?.isSynced) {
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
					problem.tags?.some((tag: string) =>
						tag.toLowerCase().includes(cfFilterText.toLowerCase())
					);
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

	onMount(() => {
    if (data.isGuest) {
      toast.info(
        "You're not logged in.",
        {
          description: "You can analyze accounts for now — log in to get personalized recommendations.",
          action: {
            label: "Login",
            onClick: () => window.location.href = "/signup"
          },
          duration: 8000,
        }
      );
    }
  });
</script>

<!-- Modals & Toasts -->
{#if showImportModal}
	<LeetCodeImportModal
		open={showImportModal}
		onClose={() => {
			showImportModal = false;
		}}
		onSuccess={() => {
			invalidateAll();
		}}
	/>
{/if}

<div class="min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-blue-500/30">
	<!-- Background fx -->
	<div
		class="pointer-events-none fixed top-0 left-0 h-96 w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950"
	></div>
	<div
		class="pointer-events-none fixed right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-900/10 blur-[120px]"
	></div>

	<main class="relative mx-auto max-w-7xl px-6 py-24">
		<!-- ===== ZONE 1: HERO ===== -->
		<header class="mb-12" in:fade={{ duration: 300, delay: 100 }}>
			<div class="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
				<div>
					<h1
						class="bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-3xl font-bold text-transparent md:text-4xl"
					>
						Dashboard
					</h1>
					<p class="mt-2 text-zinc-500">Here's what to work on next.</p>
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
				<div class="mb-6 flex items-center justify-between">
					<div>
						<h2 class="text-xl font-semibold text-zinc-200">Recommended for You</h2>
						<p class="mt-1 text-sm text-zinc-500">
							Personalized picks based on your weak areas · {allRecommendations.length} problems
						</p>
					</div>
					{#if allRecommendations.length > 6}
						<button
							onclick={() => (showAllRecs = !showAllRecs)}
							class="text-sm text-blue-400 transition-colors hover:text-blue-300"
						>
							{showAllRecs ? 'Show less' : `Show all ${allRecommendations.length}`}
						</button>
					{/if}
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each visibleRecs as problem (problem.id)}
						<div in:fade={{ duration: 200 }}>
							<RecommendationCard {problem} />
						</div>
					{/each}
				</div>
			</section>
		{:else}
			<section
				class="mb-12 rounded-2xl border border-white/5 bg-zinc-900/30 p-12 text-center"
				in:fade={{ duration: 300 }}
			>
				<div class="mb-4 text-4xl">🧭</div>
				<h2 class="mb-2 text-lg font-semibold text-zinc-300">No recommendations yet</h2>
				<p class="mx-auto max-w-md text-sm text-zinc-500">
					Connect a platform and solve some problems. We'll analyze your weak areas and suggest what
					to practice next.
				</p>
				<a
					href="/verify"
					class="mt-6 inline-block rounded-xl border border-blue-500/20 bg-blue-500/10 px-5 py-2.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
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
						<div class="mb-4 flex flex-wrap gap-3">
							<div class="rounded-lg border border-white/5 bg-zinc-800/50 px-3 py-2 text-sm">
								<span class="text-zinc-500">Rating:</span>
								<span
									class="font-mono {getRatingColor(
										Number(codeforcesData?.data?.info?.rating ?? 0)
									)}"
								>
									{codeforcesData?.data?.info?.rating ?? '—'}
								</span>
							</div>
							<div class="rounded-lg border border-white/5 bg-zinc-800/50 px-3 py-2 text-sm">
								<span class="text-zinc-500">Showing:</span>
								<span class="font-mono text-zinc-200">{cfFilteredProblems.length}</span>
								<span class="text-zinc-600">/ {cfProblems.length}</span>
							</div>
							{#if codeforcesData?.data?.weakTags?.length}
								<div
									class="flex items-center gap-2 rounded-lg border border-white/5 bg-zinc-800/50 px-3 py-2 text-sm"
								>
									<span class="text-zinc-500">Weak:</span>
									{#each codeforcesData.data.weakTags.slice(0, 3) as wt}
										<span class="text-xs text-rose-400">{wt.tag}</span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Controls row -->
						<div
							class="mb-4 flex flex-col gap-2 rounded-xl border border-white/5 bg-zinc-800/30 p-3 sm:flex-row"
						>
							<div class="relative flex-1">
								<svg
									class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500"
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
									class="w-full rounded-lg border border-white/5 bg-zinc-900/50 py-2 pr-4 pl-9 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-1 focus:ring-blue-500/30 focus:outline-none"
								/>
							</div>
							<div class="flex items-center gap-2">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="inline-flex w-[140px] cursor-pointer items-center justify-between rounded-md border border-white/5 bg-zinc-900/50 px-3 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus:outline-none"
									>
										{displayLabel}
										<ChevronDown class="ml-2 h-4 w-4 opacity-50" />
									</DropdownMenu.Trigger>

									<DropdownMenu.Content class="w-40 border-white/10 bg-zinc-950 text-zinc-300">
										<DropdownMenu.Group>
											<DropdownMenu.Label>Sort By</DropdownMenu.Label>
											<DropdownMenu.Separator class="bg-white/5" />
											<DropdownMenu.Item onclick={() => (cfSortBy = 'rating')}>
												Rating
											</DropdownMenu.Item>
											<DropdownMenu.Item onclick={() => (cfSortBy = 'difficulty')}>
												Difficulty
											</DropdownMenu.Item>
											<DropdownMenu.Item onclick={() => (cfSortBy = 'title')}>
												Title
											</DropdownMenu.Item>
										</DropdownMenu.Group>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
								<button
									onclick={() => (cfSortOrder = cfSortOrder === 'asc' ? 'desc' : 'asc')}
									class="rounded-lg border border-white/5 bg-zinc-900/50 p-2 text-zinc-400 transition-colors hover:text-zinc-200"
									aria-label="Toggle sort order"
								>
									<svg
										class="h-4 w-4 transition-transform {cfSortOrder === 'asc' ? 'rotate-180' : ''}"
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
									class="rounded-lg border border-white/5 bg-zinc-900/50 p-2 text-zinc-400 transition-colors hover:text-zinc-200 {cfSelectedTags.length >
									0
										? 'ring-1 ring-blue-500/30'
										: ''}"
									aria-label="Toggle tag filters"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
										class="px-3 py-2 text-xs text-blue-400 transition-colors hover:text-blue-300"
									>
										Clear
									</button>
								{/if}
							</div>
						</div>

						<!-- Tag filter chips -->
						{#if cfShowFilters && cfAllTags.length > 0}
							<div
								class="mb-4 flex flex-wrap gap-1.5 rounded-xl border border-white/5 bg-zinc-800/20 p-3"
							>
								{#each cfAllTags as tag}
									<button
										onclick={() => toggleCfTag(tag)}
										class="rounded-md border px-2.5 py-1 text-xs transition-colors
											{cfSelectedTags.includes(tag)
											? 'border-blue-500/30 bg-blue-500/20 text-blue-300'
											: 'border-white/5 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'}"
									>
										{tag}
									</button>
								{/each}
							</div>
						{/if}

						<!-- Problem list -->
						{#if cfFilteredProblems.length === 0}
							<div class="py-8 text-center text-zinc-500">
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
							<div class="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5">
								{#each cfFilteredProblems as problem (problem.id)}
									<a
										href={problem.url}
										target="_blank"
										rel="noopener noreferrer"
										class="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.02]"
									>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<span
													class="truncate text-sm font-medium text-zinc-200 transition-colors group-hover:text-white"
												>
													{problem.title}
												</span>
												{#if problem.difficulty}
													<span
														class="shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase
															{diffColors[problem.difficulty.toLowerCase()] ?? 'border-zinc-400/20 bg-zinc-400/10 text-zinc-400'}"
													>
														{problem.difficulty}
													</span>
												{/if}
											</div>
											{#if problem.tags?.length}
												<div class="mt-1 flex gap-1">
													{#each problem.tags.slice(0, 4) as tag}
														<span class="text-[10px] text-zinc-500">{tag}</span>
													{/each}
												</div>
											{/if}
										</div>
										<div class="ml-4 flex shrink-0 items-center gap-3">
											{#if problem.rating}
												<span class="font-mono text-sm {getRatingColor(problem.rating)}"
													>{problem.rating}</span
												>
											{/if}
											<svg
												class="h-4 w-4 text-zinc-600 transition-colors group-hover:text-zinc-400"
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
					subtitle="{leetcodeData.handle} · {leetcodeData.recommendedProblems
						.length} recommendations"
					platform="leetcode"
				>
					{#snippet children()}
						{#if !leetcodeSync?.isSynced}
							<div
								class="flex flex-col items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-12 text-center"
							>
								<div
									class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20"
								>
									<svg
										class="h-6 w-6 text-amber-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/>
									</svg>
								</div>
								<h3 class="mb-2 text-lg font-semibold text-amber-400">Sync Required</h3>
								<p class="mb-6 max-w-md text-sm text-zinc-400">
									Your LeetCode account is not fully synced. Please import your submissions to
									generate personalized recommendations.
								</p>
								<button
									onclick={() => (showImportModal = true)}
									class="rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
								>
									Sync LeetCode Data
								</button>
							</div>
						{:else}
							<div class="mb-4 flex flex-wrap gap-3">
								<div class="rounded-lg border border-white/5 bg-zinc-800/50 px-3 py-2 text-sm">
									<span class="text-zinc-500">Synced:</span>
									<span class="text-zinc-200">
										{leetcodeSync?.lastSyncedAt
											? new Date(leetcodeSync.lastSyncedAt).toLocaleDateString()
											: 'Never'}
									</span>
								</div>
							</div>

							{#if leetcodeData.recommendedProblems.length === 0}
								<p class="py-4 text-sm text-zinc-500">No LeetCode recommendations available.</p>
							{:else}
								<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
									{#each leetcodeData.recommendedProblems as problem (problem.id)}
										<RecommendationCard {problem} />
									{/each}
								</div>
							{/if}
						{/if}
					{/snippet}
				</PlatformSection>
			{/if}

			<!-- GitHub Section -->
			{#if githubData}
				<!-- svelte-ignore attribute_quoted -->
				<PlatformSection
					title="GitHub"
					subtitle="{githubData.handle} · {githubData.githubRecommendations.length} recommendations"
					platform="github"
				>
					{#snippet children()}
						{#if githubData.githubRecommendations.length === 0}
							<p class="py-4 text-sm text-zinc-500">
								No GitHub recommendations yet. Keep contributing and we'll generate personalized
								suggestions.
							</p>
						{:else}
							<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
								{#each githubData.githubRecommendations as rec}
									{@const categoryColors = {
										reinforcement: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
										depth: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
										maintenance: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
										micro_collaboration: 'text-purple-400 bg-purple-400/10 border-purple-400/20'
									}}
									<div
										class="rounded-xl border border-white/5 bg-zinc-900/50 p-4 transition-colors hover:border-white/10"
									>
										<div class="mb-3 flex items-center gap-2">
											<span
												class="rounded border px-2 py-0.5 text-[10px] font-semibold uppercase {categoryColors[
													rec.category
												] ?? 'border-zinc-400/20 bg-zinc-400/10 text-zinc-400'}"
											>
												{rec.category.replace('_', ' ')}
											</span>
											<span class="font-mono text-[10px] text-zinc-600">{rec.axisTargeted}</span>
										</div>
										<h4 class="mb-1.5 text-sm font-medium text-zinc-200">{rec.title}</h4>
										<p class="text-xs leading-relaxed text-zinc-500">{rec.description}</p>
									</div>
								{/each}
							</div>
						{/if}
					{/snippet}
				</PlatformSection>
			{/if}
		</div>

		<!-- ===== ZONE 4: SYNC STATUS ===== -->
		<footer class="mt-12 border-t border-white/5 pt-8" in:fade={{ duration: 300, delay: 400 }}>
			<div class="flex flex-wrap items-center gap-6 text-xs text-zinc-600">
				{#if codeforcesData}
					<span
						>⚡ Codeforces: connected as <span class="text-zinc-400">{codeforcesData.handle}</span
						></span
					>
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
					<span>🐙 GitHub: connected as <span class="text-zinc-400">{githubData.handle}</span></span
					>
				{/if}
				{#if !codeforcesData && !leetcodeData && !githubData}
					<span
						>No platforms connected. <a href="/verify" class="text-blue-400 hover:text-blue-300"
							>Connect one →</a
						></span
					>
				{/if}
			</div>
		</footer>
	</main>
</div>
