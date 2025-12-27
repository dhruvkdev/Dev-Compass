<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	// We'll create these next
	import CodeforcesDashboard from '$lib/components/dashboard/codeforces/CodeforcesDashboard.svelte';

	let { form } = $props();

	let activeTab = $state('Overview');
	let loading = $state(false);

	const tabs = ['Overview', 'Analytics', 'Compare'];
	const platforms = [
		{ id: 'codeforces', label: 'Codeforces', color: 'text-red-500' },
		{ id: 'leetcode', label: 'LeetCode', color: 'text-yellow-500' },
		{ id: 'github', label: 'GitHub', color: 'text-white' }
	];
</script>

<div class="min-h-screen bg-black pt-24 pb-20">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<!-- 1. Tabs -->
		<div class="mb-8 flex justify-center">
			<div class="inline-flex rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md">
				{#each tabs as tab}
					<button
						onclick={() => (activeTab = tab)}
						class="relative rounded-full px-6 py-2 text-sm font-medium transition-all duration-300 {activeTab ===
						tab
							? 'text-black'
							: 'text-zinc-400 hover:text-white'}"
					>
						{#if activeTab === tab}
							<div
								class="absolute inset-0 rounded-full bg-white shadow-lg"
								transition:slide|local={{ axis: 'x', duration: 300, easing: cubicOut }}
							></div>
						{/if}
						<span class="relative z-10">{tab}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- 2. Search & Filter -->
		<div class="mx-auto mb-12 max-w-2xl">
			<form
				method="POST"
				action="?/getPlatformStats"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
				class="relative flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/50 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20"
			>
				<!-- Platform Select -->
				<div class="relative shrink-0">
					<select
						name="platform"
						class="appearance-none rounded-xl border-none bg-black/40 py-2.5 pr-10 pl-4 text-sm font-medium text-white ring-1 ring-white/10 transition-colors hover:bg-black/60 focus:ring-indigo-500"
					>
						{#each platforms as p}
							<option value={p.id}>{p.label}</option>
						{/each}
					</select>
					<div class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							></path></svg
						>
					</div>
				</div>

				<!-- Username Input -->
				<input
					type="text"
					name="username"
					placeholder="Enter username..."
					class="w-full bg-transparent px-4 py-2.5 text-white placeholder-zinc-500 outline-none"
					autocomplete="off"
				/>

				<!-- Lookout Button -->
				<button
					type="submit"
					disabled={loading}
					class="absolute right-2 shrink-0 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 disabled:opacity-50"
				>
					{loading ? 'Searching...' : 'Lookout'}
				</button>
			</form>

			{#if form?.message}
				<div transition:fade class="mt-4 text-center text-sm font-medium text-red-400">
					{form.message}
				</div>
			{/if}
		</div>

		<!-- 3. Results -->
		{#if form?.success && form?.platform === 'codeforces'}
			<div transition:fade={{ duration: 400 }}>
				<CodeforcesDashboard data={form.data} {activeTab} />
			</div>
		{/if}
	</div>
</div>
