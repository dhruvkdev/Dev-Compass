<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, slide } from 'svelte/transition';

	let { data, form } = $props();
	let loading = $state(false);
	let verifyLoading = $state(false);

	// State to track which platform is currently being verified
	let activeVerification = $state<string | null>(null);

	function toggleVerification(platform: string) {
		if (activeVerification === platform) {
			activeVerification = null;
		} else {
			activeVerification = platform;
		}
	}

	const platforms = [
		{ id: 'leetcode', label: 'LeetCode', color: 'text-yellow-500', ring: 'focus:ring-yellow-500' },
		{ id: 'codeforces', label: 'Codeforces', color: 'text-red-500', ring: 'focus:ring-red-500' },
		{ id: 'github', label: 'GitHub', color: 'text-gray-400', ring: 'focus:ring-gray-500' },
		// Verification logic currently only supports the above, others can be added
		{
			id: 'geeksforgeeks',
			label: 'GeeksForGeeks',
			color: 'text-green-600',
			ring: 'focus:ring-green-600'
		},
		{ id: 'atcoder', label: 'AtCoder', color: 'text-white', ring: 'focus:ring-white' },
		{
			id: 'hackerrank',
			label: 'HackerRank',
			color: 'text-green-500',
			ring: 'focus:ring-green-500'
		},
		{ id: 'codechef', label: 'CodeChef', color: 'text-orange-800', ring: 'focus:ring-orange-800' }
	];

	// Helper to get handle data safely
	function getHandleData(platform: string) {
		return data.handles[platform] || {};
	}
</script>

<div class="mx-auto max-w-4xl space-y-8 p-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-white">Profile Settings</h1>
			<p class="mt-2 text-gray-400">Manage your career goals and verify your coding profiles.</p>
		</div>
	</div>

	<!-- Platform Handles Section -->
	<div class="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
		<h2 class="mb-6 text-xl font-semibold text-white">Platform Handles</h2>

		<!-- Save Handles Form -->
		<form
			method="POST"
			action="?/updateHandles"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
		>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				{#each platforms as platform}
					{@const handleInfo = getHandleData(platform.id)}
					<div class="space-y-2">
						<label
							for={platform.id}
							class="flex items-center justify-between text-sm font-medium text-gray-300"
						>
							<span class={platform.color}>{platform.label}</span>
							{#if handleInfo.verifiedAt}
								<span
									class="flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs text-green-400"
								>
									<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										></path></svg
									>
									Verified
								</span>
							{:else if handleInfo.handle}
								<button
									type="button"
									onclick={() => toggleVerification(platform.id)}
									class="text-xs text-blue-400 hover:underline"
								>
									Verify Now
								</button>
							{/if}
						</label>
						<input
							type="text"
							id={platform.id}
							name={platform.id}
							value={handleInfo.handle ?? ''}
							class="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white focus:ring-2 {platform.ring} transition-all outline-none focus:border-transparent disabled:opacity-50"
						/>

						<!-- Verification UI -->
						{#if activeVerification === platform.id && !handleInfo.verifiedAt}
							<div
								transition:slide
								class="mt-2 rounded-lg border border-gray-700 bg-gray-800/50 p-4"
							>
								<h4 class="mb-2 text-sm font-medium text-white">Verification Steps</h4>
								<ol class="list-inside list-decimal space-y-2 text-sm text-gray-400">
									<li>
										Add the following token to your {platform.label} <strong>bio / about</strong> section:
									</li>
									{#if handleInfo.verificationToken}
										<div
											class="flex items-center gap-2 rounded border border-gray-700 bg-black/50 p-2 font-mono text-blue-300"
										>
											<span>{handleInfo.verificationToken}</span>
										</div>
									{:else}
										<button
											formaction="?/generateToken"
											name="platform"
											value={platform.id}
											class="rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600"
											>Generate Token</button
										>
									{/if}
									<li>Click check below once updated.</li>
								</ol>
								{#if handleInfo.verificationToken}
									<div class="mt-4">
										<button
											formaction="?/verifyProfile"
											name="platform"
											value={platform.id}
											disabled={verifyLoading}
											class="w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
											onclick={() => (verifyLoading = true)}
										>
											{verifyLoading ? 'Checking...' : 'Check Verification'}
										</button>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<div class="mt-8 flex justify-end border-t border-gray-800 pt-6">
				<button
					type="submit"
					disabled={loading}
					class="rounded-lg bg-blue-600 px-8 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-500 disabled:opacity-50"
				>
					{loading ? 'Saving...' : 'Save All Handles'}
				</button>
			</div>
		</form>
		{#if form?.message}
			<div
				class="mt-4 rounded-lg p-4 {form.success
					? 'bg-green-500/10 text-green-400'
					: 'bg-red-500/10 text-red-400'} text-center text-sm font-medium"
			>
				{form.message}
			</div>
		{/if}
	</div>
</div>
