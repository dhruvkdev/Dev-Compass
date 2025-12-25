<script lang="ts">
	import { Trophy, Activity, Heart, Users } from 'lucide-svelte';

	interface UserInfo {
		titlePhoto?: string;
		avatar?: string;
		handle?: string;
		rank?: string;
		maxRank?: string;
		contribution?: number;
		friendOfCount?: number;
		lastOnlineTimeSeconds?: number;
	}

	let {
		info,
		rating = 0,
		maxRating = 0
	}: {
		info: UserInfo;
		rating: number;
		maxRating: number;
	} = $props();

	// Configuration
	const radius = 80;
	const circumference = 2 * Math.PI * radius;

	// Calculate Next Rank Integration (Using $derived for reactivity)
	let progress = $derived(getRankProgress(rating));
	let offset = $derived(circumference - (progress / 100) * circumference);

	// Newbie < 1200, Pupil < 1400, Specialist < 1600, Expert < 1900, CM < 2100, Master < 2300, IM < 2400
	function getRankProgress(currentRating: number) {
		if (!currentRating) return 0;

		const tiers = [0, 1200, 1400, 1600, 1900, 2100, 2300, 2400, 2600, 3000];
		let lower = 0;
		let upper = 1200;

		for (let i = 0; i < tiers.length - 1; i++) {
			if (currentRating >= tiers[i] && currentRating < tiers[i + 1]) {
				lower = tiers[i];
				upper = tiers[i + 1];
				break;
			}
		}

		// Handle Legendary Grandmaster / max tier
		if (currentRating >= 3000) {
			lower = 3000;
			upper = 4000;
		}

		return Math.min(100, Math.max(0, ((currentRating - lower) / (upper - lower)) * 100));
	}

	// Helper for Rank Status Color
	function getRankColor(rank: string | undefined) {
		if (!rank) return 'text-gray-400';
		const r = rank.toLowerCase();

		// Order matters! Check Candidate before Master.
		if (r.includes('grandmaster')) return 'text-red-500';
		if (r.includes('candidate')) return 'text-violet-500';
		if (r.includes('master')) return 'text-orange-500';
		if (r.includes('expert')) return 'text-blue-500';
		if (r.includes('specialist')) return 'text-cyan-500';
		if (r.includes('pupil')) return 'text-green-500';
		if (r.includes('newbie')) return 'text-gray-400';

		return 'text-gray-400';
	}
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Left Panel: Rank & Avatar -->
	<div
		class="col-span-1 flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/50 p-8 text-center backdrop-blur-md lg:col-span-1"
	>
		<div class="relative mb-6">
			<!-- Ring Progress -->
			<svg class="h-48 w-48 -rotate-90 transform">
				<circle
					cx="96"
					cy="96"
					r={radius}
					fill="none"
					stroke="currentColor"
					stroke-width="6"
					class="text-zinc-800"
				/>
				{#if rating > 0}
					<circle
						cx="96"
						cy="96"
						r={radius}
						fill="none"
						stroke="currentColor"
						stroke-width="6"
						stroke-linecap="round"
						stroke-dasharray={circumference}
						stroke-dashoffset={offset}
						class="{getRankColor(info?.rank)} transition-all duration-1000 ease-out"
					/>
				{/if}
			</svg>

			<!-- Avatar Inside -->
			<div class="absolute inset-4 overflow-hidden rounded-full border-4 border-zinc-900">
				<img
					src={info?.titlePhoto || info?.avatar || '/placeholder.png'}
					alt={info?.handle || 'User'}
					class="h-full w-full object-cover"
				/>
			</div>

			<!-- Rank Pill -->
			<div class="absolute -bottom-3 left-1/2 -translate-x-1/2">
				<span
					class="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1 text-sm font-medium whitespace-nowrap {getRankColor(
						info?.rank
					)} capitalize shadow-lg"
				>
					{info?.rank || 'Unrated'}
				</span>
			</div>
		</div>

		<h1 class="text-3xl font-bold text-white {getRankColor(info?.rank)}">
			{info?.handle || 'Unknown'}
		</h1>
		<p class="mt-2 text-xs text-zinc-500">
			{Math.round(progress)} points to next rank
		</p>
	</div>

	<!-- Right Panel: Detailed Stats -->
	<div
		class="col-span-1 flex flex-col justify-center gap-6 rounded-2xl border border-white/5 bg-zinc-800/50 p-8 backdrop-blur-md lg:col-span-2"
	>
		<div class="flex items-center gap-3">
			<Trophy class="h-6 w-6 text-yellow-500" />
			<h2 class="text-xl font-bold text-white">Codeforces Profile</h2>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<!-- Current Rating -->
			<div class="flex items-center justify-between rounded-xl bg-black/40 p-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400"
					>
						<Activity class="h-5 w-5" />
					</div>
					<span class="text-sm font-medium text-zinc-400">Current Rating</span>
				</div>
				<span class="text-xl font-bold text-white">{rating}</span>
			</div>

			<!-- Max Rating -->
			<div class="flex items-center justify-between rounded-xl bg-black/40 p-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400"
					>
						<Trophy class="h-5 w-5" />
					</div>
					<span class="text-sm font-medium text-zinc-400">Max Rating</span>
				</div>
				<span class="max-w-full truncate text-xl font-bold text-white">{maxRating}</span>
			</div>

			<!-- Contribution -->
			<div class="flex items-center justify-between rounded-xl bg-black/40 p-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400"
					>
						<Heart class="h-5 w-5" />
					</div>
					<span class="text-sm font-medium text-zinc-400">Contribution</span>
				</div>
				<span class="text-xl font-bold text-white">{info?.contribution || 0}</span>
			</div>

			<!-- Friends -->
			<div class="flex items-center justify-between rounded-xl bg-black/40 p-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-400"
					>
						<Users class="h-5 w-5" />
					</div>
					<span class="text-sm font-medium text-zinc-400">Friends</span>
				</div>
				<span class="text-xl font-bold text-white">{info?.friendOfCount || 0}</span>
			</div>
		</div>

		<div class="mt-2 flex items-center gap-2 text-xs text-zinc-500">
			<div class="h-2 w-2 rounded-full bg-green-500"></div>
			Last online: {info?.lastOnlineTimeSeconds
				? new Date(info.lastOnlineTimeSeconds * 1000).toLocaleString()
				: 'Never'}
		</div>
	</div>
</div>
