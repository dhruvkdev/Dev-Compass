<script lang="ts">
	import {
		Users,
		Plus,
		X,
		Trophy,
		CheckCircle,
		TrendingUp,
		AlertCircle,
		Loader2
	} from 'lucide-svelte';
	import ContestRatingGraph from './ContestRatingGraph.svelte';

	let { data } = $props();

	// User colors for comparison
	const USER_COLORS = [
		{
			bg: 'rgba(99, 102, 241, 0.2)',
			border: 'rgba(99, 102, 241, 0.8)',
			solid: '#6366f1',
			name: 'Indigo'
		},
		{
			bg: 'rgba(6, 182, 212, 0.2)',
			border: 'rgba(6, 182, 212, 0.8)',
			solid: '#06b6d4',
			name: 'Cyan'
		},
		{
			bg: 'rgba(16, 185, 129, 0.2)',
			border: 'rgba(16, 185, 129, 0.8)',
			solid: '#10b981',
			name: 'Emerald'
		},
		{
			bg: 'rgba(244, 63, 94, 0.2)',
			border: 'rgba(244, 63, 94, 0.8)',
			solid: '#f43f5e',
			name: 'Rose'
		},
		{
			bg: 'rgba(245, 158, 11, 0.2)',
			border: 'rgba(245, 158, 11, 0.8)',
			solid: '#f59e0b',
			name: 'Amber'
		}
	];

	// State for comparison
	let inputHandle = $state('');
	let isLoading = $state(false);
	let error = $state('');

	// Initial user
	let compareUsers = $state<
		Array<{
			handle: string;
			data: any;
			loading: boolean;
			error: string;
		}>
	>([]);

	$effect(() => {
		if (data?.profile?.username && compareUsers.length === 0) {
			compareUsers = [
				{
					handle: data.profile.username,
					data: data,
					loading: false,
					error: ''
				}
			];
		}
	});

	async function addUser() {
		const handle = inputHandle.trim();
		if (!handle) return;
		if (compareUsers.some((u) => u.handle.toLowerCase() === handle.toLowerCase())) {
			error = 'User already added';
			return;
		}

		error = '';
		inputHandle = '';
		const idx = compareUsers.length;

		// Optimistic add
		compareUsers = [
			...compareUsers,
			{
				handle,
				data: null,
				loading: true,
				error: ''
			}
		];

		try {
			const res = await fetch(`/api/leetcode?username=${handle}`);

			if (!res.ok) {
				compareUsers[idx].error = 'User not found';
				compareUsers[idx].loading = false;
				return;
			}

			const profile = await res.json();
			if (!profile) {
				compareUsers[idx].error = 'User not found';
				compareUsers[idx].loading = false;
				return;
			}

			compareUsers[idx].data = profile; // Full profile with contestHistory
			compareUsers[idx].loading = false;
		} catch (e) {
			compareUsers[idx].error = 'Failed to fetch';
			compareUsers[idx].loading = false;
		}
	}

	function removeUser(idx: number) {
		compareUsers = compareUsers.filter((_, i) => i !== idx);
	}
</script>

<div class="space-y-8 pt-6 pb-20">
	<!-- Input -->
	<section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-6">
		<div class="mb-6 flex items-center gap-3">
			<div class="rounded-lg bg-indigo-500/10 p-2">
				<Users class="h-5 w-5 text-indigo-400" />
			</div>
			<div>
				<h2 class="text-lg font-semibold text-white">Compare Solvers</h2>
				<p class="text-xs text-zinc-500">Add LeetCode usernames to compare head-to-head</p>
			</div>
		</div>

		<!-- Chips -->
		<div class="mb-4 flex flex-wrap gap-2">
			{#each compareUsers as user, idx}
				<div
					class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
				>
					{#if user.loading}
						<Loader2 class="h-3 w-3 animate-spin text-zinc-400" />
					{:else if user.error}
						<AlertCircle class="h-3 w-3 text-red-400" />
						<span class="text-sm text-red-400">{user.handle}</span>
					{:else}
						<span
							class="h-2 w-2 rounded-full"
							style="background-color: {USER_COLORS[idx % USER_COLORS.length].solid}"
						></span>
						<span class="text-sm font-medium text-white">{user.handle}</span>
					{/if}

					{#if idx > 0}
						<button onclick={() => removeUser(idx)} class="ml-1 text-zinc-500 hover:text-white"
							><X class="h-3 w-3" /></button
						>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Add Input -->
		<div class="flex max-w-md gap-2">
			<input
				type="text"
				bind:value={inputHandle}
				placeholder="Enter LeetCode username..."
				onkeypress={(e) => e.key === 'Enter' && addUser()}
				class="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
			/>
			<button
				onclick={addUser}
				class="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
			>
				<Plus class="h-4 w-4" />
				Add
			</button>
		</div>
		{#if error}
			<p class="mt-2 text-xs text-red-400">{error}</p>
		{/if}
	</section>

	<!-- Comparison Graph -->
	<!-- Safely check if any user has contest history -->
	{#if compareUsers.some((u) => u.data?.contestHistory?.length > 0)}
		<div class="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-md">
			<h3 class="mb-4 text-lg font-bold text-white">Rating Comparison</h3>
			<ContestRatingGraph
				datasets={compareUsers
					.filter((u) => u.data?.contestHistory && u.data.contestHistory.length > 0)
					.map((u, i) => ({
						label: u.handle,
						color: USER_COLORS[i % USER_COLORS.length].solid,
						data: u.data.contestHistory
					}))}
				variant="comparison"
			/>
		</div>
	{/if}

	<!-- Comparison Grid -->
	{#if compareUsers.length >= 2}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each compareUsers as user, idx}
				{#if !user.loading && !user.error && user.data}
					<div
						class="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6"
					>
						<div
							class="absolute top-0 left-0 h-1 w-full"
							style="background-color: {USER_COLORS[idx % USER_COLORS.length].solid}"
						></div>

						<div class="mb-6 flex items-start justify-between">
							<h3 class="text-xl font-bold text-white">{user.handle}</h3>
							<span class="text-xs text-zinc-500">#{idx + 1}</span>
						</div>

						<div class="space-y-4">
							<!-- Total Solved -->
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<CheckCircle class="h-4 w-4 text-zinc-500" />
									<span class="text-sm text-zinc-400">Total Solved</span>
								</div>
								<span class="text-lg font-bold text-white">{user.data.profile.totalSolved}</span>
							</div>

							<!-- Hard Solved -->
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Trophy class="h-4 w-4 text-rose-500" />
									<span class="text-sm text-zinc-400">Hard Count</span>
								</div>
								<span class="text-lg font-bold text-rose-400">{user.data.profile.hardSolved}</span>
							</div>

							<!-- Rank -->
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<TrendingUp class="h-4 w-4 text-amber-500" />
									<span class="text-sm text-zinc-400">Global Rank</span>
								</div>
								<span class="text-lg font-bold text-amber-400">#{user.data.profile.ranking}</span>
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
