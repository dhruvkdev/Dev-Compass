<script lang="ts">
	import {
		Trophy,
		Activity,
		Heart,
		Users,
		TrendingUp,
		Award,
		Zap,
		ChevronRight,
		TrendingDown
	} from 'lucide-svelte';

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

	/* -----------------------------
     Rank Model
  ------------------------------ */
	type RankTier = {
		min: number;
		max: number;
		name: string;
		color: string;
		bg: string;
	};

	const RANK_TIERS: RankTier[] = [
		{ min: 0, max: 1200, name: 'Newbie', color: 'text-gray-400', bg: 'bg-gray-500' },
		{ min: 1200, max: 1400, name: 'Pupil', color: 'text-green-400', bg: 'bg-green-500' },
		{ min: 1400, max: 1600, name: 'Specialist', color: 'text-cyan-400', bg: 'bg-cyan-500' },
		{ min: 1600, max: 1900, name: 'Expert', color: 'text-blue-400', bg: 'bg-blue-500' },
		{ min: 1900, max: 2100, name: 'CM', color: 'text-violet-400', bg: 'bg-violet-500' },
		{ min: 2100, max: 2300, name: 'Master', color: 'text-orange-400', bg: 'bg-orange-500' },
		{ min: 2300, max: 2400, name: 'IM', color: 'text-red-400', bg: 'bg-red-400' },
		{ min: 2400, max: 2600, name: 'GM', color: 'text-red-500', bg: 'bg-red-500' },
		{ min: 2600, max: 3000, name: 'IGM', color: 'text-red-600', bg: 'bg-red-600' },
		{ min: 3000, max: Infinity, name: 'LGM', color: 'text-red-700', bg: 'bg-red-700' }
	];

	let rankState = $derived.by(() => {
		const r = rating ?? 0;
		const tier =
			RANK_TIERS.find((t) => r >= t.min && r < t.max) || RANK_TIERS[RANK_TIERS.length - 1];
		const progress = tier.max !== Infinity ? ((r - tier.min) / (tier.max - tier.min)) * 100 : 100;
		const pointsToNext = tier.max !== Infinity ? Math.max(0, tier.max - r) : 0;

		return {
			tier,
			progress: Math.min(100, Math.max(0, progress)),
			pointsToNext,
			nextTier: RANK_TIERS[RANK_TIERS.indexOf(tier) + 1]
		};
	});

	/* -----------------------------
     Status & Formatting
  ------------------------------ */
	let isOnline = $derived(
		info?.lastOnlineTimeSeconds && Date.now() / 1000 - info.lastOnlineTimeSeconds < 300
	);
	let ratingChange = $derived(rating - maxRating);

	function formatCompact(num: number): string {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toString();
	}
	let isBelowMax = $derived(rating < maxRating);
	let delta = $derived(rating - maxRating);
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Profile Summary -->
	<div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 lg:col-span-1">
		<div class="flex items-start gap-4">
			<!-- Avatar -->
			<div class="relative">
				<div class="h-16 w-16 overflow-hidden rounded-xl border-2 border-zinc-800">
					<img
						src={info?.titlePhoto || info?.avatar || '/placeholder.png'}
						alt={info?.handle}
						class="h-full w-full object-cover"
					/>
					{#if isOnline}
						<div
							class="absolute right-1 bottom-1 h-2 w-2 rounded-full border border-zinc-900 bg-green-500"
						></div>
					{/if}
				</div>
				<div class="absolute -bottom-2 left-1/2 -translate-x-1/2">
					<div
						class={`rounded px-2 py-0.5 text-xs font-semibold ${rankState.tier.color} border border-zinc-800 bg-black/80`}
					>
						{rankState.tier.name}
					</div>
				</div>
			</div>

			<!-- User Info -->
			<div class="min-w-0 flex-1">
				<div class="flex items-center justify-between">
					<h2 class="truncate text-lg font-semibold text-white">{info?.handle || 'Unknown'}</h2>
					<Award class="h-4 w-4 text-zinc-600" />
				</div>
				<div class="mt-1 text-sm text-zinc-400">Codeforces Competitor</div>

				<!-- Rating -->
				<div class="mt-3 grid grid-cols-2 gap-3">
					<div>
						<div class="text-xs text-zinc-500">Current</div>
						<div class="text-lg font-bold text-white">{rating}</div>
					</div>
					<div>
						<div class="text-xs text-zinc-500">Max</div>
						<div class="text-lg font-bold text-amber-400">{maxRating}</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Progress -->
		<div class="mt-5">
			<div class="mb-1 flex justify-between text-xs text-zinc-500">
				<span>Progress to {rankState.nextTier?.name || 'Max'}</span>
				<span>{Math.round(rankState.progress)}%</span>
			</div>
			<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
				<div
					class={`h-full ${rankState.tier.bg} transition-all duration-500`}
					style={`width: ${rankState.progress}%`}
				></div>
			</div>
			<div class="mt-1 text-xs text-zinc-500">
				{rankState.pointsToNext > 0
					? `${rankState.pointsToNext} points to next tier`
					: 'Max rank achieved'}
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="lg:col-span-2">
		<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
			<!-- Current Rating -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-indigo-500/10 p-2">
						<Activity class="h-4 w-4 text-indigo-400" />
					</div>
					<div class="min-w-0 flex-1">
						<div class="truncate text-xs text-zinc-500">Current Rating</div>
						<div class="mt-1 text-xl font-bold text-white">{rating}</div>
					</div>
				</div>
				<div class="mt-3 flex items-center gap-1">
					{#if isBelowMax}
						<TrendingDown class="h-3 w-3 text-red-400" />
					{:else}
						<TrendingUp class="h-3 w-3 text-green-400" />
					{/if}

					<span class={`text-xs font-medium ${isBelowMax ? 'text-red-400' : 'text-green-400'}`}>
						{delta > 0 ? '+' : ''}{delta}
					</span>

					<span class="ml-auto text-xs text-zinc-500">vs max</span>
				</div>
			</div>

			<!-- Max Rating -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-amber-500/10 p-2">
						<Trophy class="h-4 w-4 text-amber-400" />
					</div>
					<div class="flex-1">
						<div class="text-xs text-zinc-500">Max Rating</div>
						<div class="mt-1 text-xl font-bold text-amber-400">{maxRating}</div>
					</div>
				</div>
				<div class="mt-3">
					<div class="text-xs text-zinc-500">All-time peak</div>
				</div>
			</div>

			<!-- Contribution -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-pink-500/10 p-2">
						<Heart class="h-4 w-4 text-pink-400" />
					</div>
					<div class="flex-1">
						<div class="text-xs text-zinc-500">Contribution</div>
						<div class="mt-1 text-xl font-bold text-white">
							{info?.contribution ? (info.contribution > 0 ? '+' : '') + info.contribution : 0}
						</div>
					</div>
				</div>
				<div class="mt-3">
					<div
						class={`text-xs ${(info?.contribution || 0) > 0 ? 'text-green-400' : 'text-zinc-500'}`}
					>
						{(info?.contribution || 0) > 0 ? 'Positive impact' : 'No impact'}
					</div>
				</div>
			</div>

			<!-- Friends -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-emerald-500/10 p-2">
						<Users class="h-4 w-4 text-emerald-400" />
					</div>
					<div class="flex-1">
						<div class="text-xs text-zinc-500">Friends</div>
						<div class="mt-1 text-xl font-bold text-white">
							{formatCompact(info?.friendOfCount || 0)}
						</div>
					</div>
				</div>
				<div class="mt-3">
					<div class="text-xs text-zinc-500">Community</div>
				</div>
			</div>
		</div>

		<!-- Activity & Details -->
		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
			<!-- Status -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div
							class={`h-2 w-2 rounded-full ${isOnline ? 'animate-pulse bg-green-500' : 'bg-zinc-600'}`}
						></div>
						<span class="text-sm font-medium text-zinc-300">
							{isOnline ? 'Online now' : 'Last seen'}
						</span>
					</div>
					<ChevronRight class="h-4 w-4 text-zinc-600" />
				</div>
				<div class="mt-2 text-sm text-zinc-500">
					{info?.lastOnlineTimeSeconds
						? new Date(info.lastOnlineTimeSeconds * 1000).toLocaleDateString()
						: 'Never'}
				</div>
			</div>

			<!-- Performance -->
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-sm font-medium text-zinc-300">Performance</div>
						<div class="mt-1 text-xs text-zinc-500">Rank progression</div>
					</div>
					<div class={`rounded-full px-3 py-1 ${rankState.tier.bg} text-xs font-semibold`}>
						{rankState.tier.name}
					</div>
				</div>
				<div class="mt-3 flex items-center justify-between">
					<div class="text-xs text-zinc-500">
						Next: {rankState.nextTier?.name || 'Max'}
					</div>
					<div class="text-xs font-medium text-zinc-300">
						{rankState.pointsToNext > 0 ? rankState.pointsToNext + ' pts' : '🏆'}
					</div>
				</div>
			</div>
		</div>

		<!-- Quick Stats -->
		<div
			class="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4 text-sm text-zinc-500"
		>
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-1">
					<Zap class="h-3 w-3 text-amber-400" />
					<span>Rating: {rating}</span>
				</div>
				<div class="flex items-center gap-1">
					<div class="h-1 w-1 rounded-full bg-zinc-700"></div>
					<span>Rank: {info?.rank || 'Unrated'}</span>
				</div>
			</div>
			<div class="text-xs text-zinc-600">Updated just now</div>
		</div>
	</div>
</div>

<style>
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
