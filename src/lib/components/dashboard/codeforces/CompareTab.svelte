<script lang="ts">
	import { mean } from 'd3-array';
	import {
		Chart,
		RadarController,
		RadialLinearScale,
		PointElement,
		LineElement,
		Filler,
		Tooltip,
		type ChartOptions
	} from 'chart.js';
	import {
		Plus,
		X,
		Users,
		Trophy,
		Target,
		Zap,
		CheckCircle,
		TrendingUp,
		Loader2,
		AlertCircle,
		Sparkles
	} from 'lucide-svelte';

	Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

	let { data } = $props();

	// User colors for comparison (up to 5)
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
			bg: 'rgba(245, 158, 11, 0.2)',
			border: 'rgba(245, 158, 11, 0.8)',
			solid: '#f59e0b',
			name: 'Amber'
		},
		{
			bg: 'rgba(244, 63, 94, 0.2)',
			border: 'rgba(244, 63, 94, 0.8)',
			solid: '#f43f5e',
			name: 'Rose'
		}
	];

	// State
	let inputHandle = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let radarCanvas = $state<HTMLCanvasElement | null>(null);
	let radarChart: Chart | null = null;

	// Users to compare - start with current user if available
	let compareUsers = $state<
		Array<{
			handle: string;
			platform: string;
			data: any;
			loading: boolean;
			error: string;
			visible: boolean;
		}>
	>([]);

	// Initialize with primary user if data exists
	$effect(() => {
		if (data?.info?.handle && compareUsers.length === 0) {
			compareUsers = [
				{
					handle: data.info.handle,
					platform: 'codeforces',
					data: data,
					loading: false,
					error: '',
					visible: true
				}
			];
		}
	});

	// Add user function
	async function addUser() {
		const handle = inputHandle.trim().toLowerCase();
		if (!handle) return;
		if (compareUsers.length >= 5) {
			error = 'Maximum 5 users allowed';
			return;
		}
		if (compareUsers.some((u) => u.handle.toLowerCase() === handle)) {
			error = 'User already added';
			return;
		}

		error = '';
		inputHandle = '';

		// Add placeholder
		const idx = compareUsers.length;
		compareUsers = [
			...compareUsers,
			{
				handle,
				platform: 'codeforces',
				data: null,
				loading: true,
				error: '',
				visible: true
			}
		];

		try {
			const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
			const userData = await res.json();

			if (userData.status !== 'OK') {
				compareUsers[idx].error = 'User not found';
				compareUsers[idx].loading = false;
				return;
			}

			const [ratingRes, statusRes] = await Promise.all([
				fetch(`https://codeforces.com/api/user.rating?handle=${handle}`),
				fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1000`)
			]);

			const ratingData = await ratingRes.json();
			const statusData = await statusRes.json();

			compareUsers[idx].data = {
				info: userData.result[0],
				rating: ratingData.status === 'OK' ? ratingData.result : [],
				submissions: statusData.status === 'OK' ? statusData.result : []
			};
			compareUsers[idx].loading = false;
		} catch (e) {
			compareUsers[idx].error = 'Failed to fetch';
			compareUsers[idx].loading = false;
		}
	}

	function removeUser(idx: number) {
		compareUsers = compareUsers.filter((_, i) => i !== idx);
	}

	function toggleUser(idx: number) {
		compareUsers[idx].visible = !compareUsers[idx].visible;
	}

	// Compute profiles for all users
	let userProfiles = $derived(
		compareUsers
			.filter((u) => u.data && !u.loading && !u.error)
			.map((user, idx) => {
				const subs = user.data.submissions || [];
				const ok = subs.filter((s: any) => s.verdict === 'OK');

				const avgRating = mean(ok, (s: any) => s.problem?.rating) || 800;
				const avgTime = mean(ok, (s: any) => s.timeConsumedMillis) || 500;
				const avgMem = mean(ok, (s: any) => s.memoryConsumedBytes / (1024 * 1024)) || 128;
				const successRate = subs.length ? (ok.length / subs.length) * 100 : 0;

				const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
				const recentSubs = subs.filter((s: any) => s.creationTimeSeconds * 1000 >= cutoff);
				const activeDays = new Set(
					recentSubs.map((s: any) => new Date(s.creationTimeSeconds * 1000).toDateString())
				).size;

				const uniqueTags = new Set<string>();
				ok.forEach((s: any) => s.problem?.tags?.forEach((t: string) => uniqueTags.add(t)));

				const norm = (val: number, maxVal: number) =>
					Math.min(10, Math.max(0, (val / maxVal) * 10));
				const invNorm = (val: number, maxVal: number) =>
					Math.max(0, 10 - Math.min(10, (val / maxVal) * 10));

				return {
					handle: user.handle,
					colorIdx: idx,
					visible: user.visible,
					metrics: {
						rating: user.data.info?.rating || 0,
						maxRating: user.data.info?.maxRating || 0,
						rank: user.data.info?.rank || 'unrated',
						successRate: Math.round(successRate),
						totalSolved: ok.length,
						activeDays
					},
					radar: {
						Power: norm(avgRating, 2800),
						Speed: invNorm(avgTime, 1500),
						Precision: norm(successRate, 100),
						Consistency: norm(activeDays, 30),
						Efficiency: invNorm(avgMem, 256),
						Breadth: norm(uniqueTags.size, 25)
					}
				};
			})
	);

	// Visible profiles for chart
	let visibleProfiles = $derived(userProfiles.filter((p) => p.visible));

	// Chart data for multi-user radar
	let chartData = $derived({
		labels: ['Power', 'Speed', 'Precision', 'Consistency', 'Efficiency', 'Breadth'],
		datasets: visibleProfiles.map((profile) => ({
			label: profile.handle,
			data: [
				profile.radar.Power,
				profile.radar.Speed,
				profile.radar.Precision,
				profile.radar.Consistency,
				profile.radar.Efficiency,
				profile.radar.Breadth
			],
			backgroundColor: USER_COLORS[profile.colorIdx % USER_COLORS.length].bg,
			borderColor: USER_COLORS[profile.colorIdx % USER_COLORS.length].border,
			borderWidth: 2,
			pointBackgroundColor: USER_COLORS[profile.colorIdx % USER_COLORS.length].solid,
			pointBorderColor: '#fff',
			pointRadius: 4,
			pointHoverRadius: 6
		}))
	});

	// Radar options
	const radarOptions: ChartOptions<'radar'> = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			r: {
				min: 0,
				max: 10,
				beginAtZero: true,
				grid: { color: 'rgba(255,255,255,0.08)' },
				angleLines: { color: 'rgba(255,255,255,0.08)' },
				pointLabels: { color: '#a1a1aa', font: { size: 11, weight: 500 } },
				ticks: { stepSize: 2, display: false }
			}
		},
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(9, 9, 11, 0.95)',
				titleColor: '#fff',
				bodyColor: '#a1a1aa',
				borderColor: 'rgba(255,255,255,0.1)',
				borderWidth: 1,
				padding: 12
			}
		}
	};

	// Create/update radar chart
	$effect(() => {
		if (radarCanvas && visibleProfiles.length > 0) {
			if (radarChart) radarChart.destroy();
			radarChart = new Chart(radarCanvas, {
				type: 'radar',
				data: chartData,
				options: radarOptions
			});
			return () => radarChart?.destroy();
		}
	});

	// Generate insight
	let insight = $derived.by(() => {
		if (userProfiles.length < 2) return null;

		const insights: string[] = [];
		const p1 = userProfiles[0];
		const p2 = userProfiles[1];

		if (p1.metrics.rating > p2.metrics.rating + 100) {
			insights.push(
				`${p1.handle} has a higher rating by ${p1.metrics.rating - p2.metrics.rating} points`
			);
		} else if (p2.metrics.rating > p1.metrics.rating + 100) {
			insights.push(
				`${p2.handle} has a higher rating by ${p2.metrics.rating - p1.metrics.rating} points`
			);
		}

		if (p1.metrics.successRate > p2.metrics.successRate + 10) {
			insights.push(
				`${p1.handle} has better precision (${p1.metrics.successRate}% vs ${p2.metrics.successRate}%)`
			);
		} else if (p2.metrics.successRate > p1.metrics.successRate + 10) {
			insights.push(
				`${p2.handle} has better precision (${p2.metrics.successRate}% vs ${p1.metrics.successRate}%)`
			);
		}

		if (p1.radar.Power > p2.radar.Power + 1) {
			insights.push(`${p1.handle} tackles harder problems on average`);
		} else if (p2.radar.Power > p1.radar.Power + 1) {
			insights.push(`${p2.handle} tackles harder problems on average`);
		}

		if (p1.metrics.activeDays > p2.metrics.activeDays + 5) {
			insights.push(
				`${p1.handle} is more consistent (${p1.metrics.activeDays} vs ${p2.metrics.activeDays} active days)`
			);
		} else if (p2.metrics.activeDays > p1.metrics.activeDays + 5) {
			insights.push(
				`${p2.handle} is more consistent (${p2.metrics.activeDays} vs ${p1.metrics.activeDays} active days)`
			);
		}

		return insights.length > 0 ? insights.join('. ') + '.' : 'Both users have similar profiles.';
	});

	// Find leader for each metric
	function findLeader(metric: keyof (typeof userProfiles)[0]['metrics']) {
		if (userProfiles.length === 0) return null;
		let maxIdx = 0;
		for (let i = 1; i < userProfiles.length; i++) {
			if (userProfiles[i].metrics[metric] > userProfiles[maxIdx].metrics[metric]) {
				maxIdx = i;
			}
		}
		return maxIdx;
	}
</script>

<div class="space-y-8 pb-20">
	<!-- Header: User Input -->
	<section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-6">
		<div class="mb-6 flex items-center gap-3">
			<div class="rounded-lg bg-indigo-500/10 p-2">
				<Users class="h-5 w-5 text-indigo-400" />
			</div>
			<div>
				<h2 class="text-lg font-semibold text-white">Compare Users</h2>
				<p class="text-xs text-zinc-500">Add 2-5 Codeforces handles to compare</p>
			</div>
		</div>

		<!-- User Chips -->
		<div class="mb-4 flex flex-wrap gap-2">
			{#each compareUsers as user, idx}
				<div
					class="group flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all {user.error
						? 'border-red-500/30 bg-red-500/10'
						: user.loading
							? 'border-white/10 bg-white/5'
							: 'border-white/10 bg-white/5 hover:border-white/20'}"
				>
					{#if user.loading}
						<Loader2 class="h-3.5 w-3.5 animate-spin text-zinc-400" />
					{:else if user.error}
						<AlertCircle class="h-3.5 w-3.5 text-red-400" />
					{:else}
						<button
							onclick={() => toggleUser(idx)}
							aria-label="Toggle user visibility"
							class="h-3 w-3 rounded-full transition-opacity {user.visible
								? 'opacity-100'
								: 'opacity-30'}"
							style="background-color: {USER_COLORS[idx % USER_COLORS.length].solid}"
						></button>
					{/if}
					<span class="text-sm font-medium {user.error ? 'text-red-400' : 'text-white'}"
						>{user.handle}</span
					>
					<button
						onclick={() => removeUser(idx)}
						class="ml-1 rounded-full p-0.5 text-zinc-500 hover:bg-white/10 hover:text-white"
					>
						<X class="h-3 w-3" />
					</button>
				</div>
			{/each}
		</div>

		<!-- Add User Input -->
		{#if compareUsers.length < 5}
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={inputHandle}
					placeholder="Enter Codeforces handle..."
					onkeypress={(e) => e.key === 'Enter' && addUser()}
					class="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
				/>
				<button
					onclick={addUser}
					disabled={isLoading || !inputHandle.trim()}
					class="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
				>
					<Plus class="h-4 w-4" />
					Add
				</button>
			</div>
		{/if}

		{#if error}
			<p class="mt-2 text-sm text-red-400">{error}</p>
		{/if}
	</section>

	{#if userProfiles.length >= 2}
		<!-- Overview Metrics -->
		<section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-6">
			<h3 class="mb-4 text-sm font-semibold tracking-wider text-zinc-400 uppercase">
				Side-by-Side Metrics
			</h3>

			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-white/5">
							<th class="pb-3 text-left text-xs font-medium text-zinc-500">Metric</th>
							{#each userProfiles as profile, idx}
								<th
									class="pb-3 text-right text-xs font-medium"
									style="color: {USER_COLORS[idx % USER_COLORS.length].solid}"
								>
									{profile.handle}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						{#each [{ key: 'rating', label: 'Rating', icon: Trophy }, { key: 'maxRating', label: 'Max Rating', icon: TrendingUp }, { key: 'successRate', label: 'Success Rate', icon: Target, suffix: '%' }, { key: 'totalSolved', label: 'Problems Solved', icon: CheckCircle }, { key: 'activeDays', label: 'Active Days (30d)', icon: Zap }] as metric}
							{@const leaderIdx = findLeader(metric.key as any)}
							<tr class="group">
								<td class="py-3">
									<div class="flex items-center gap-2">
										<metric.icon class="h-4 w-4 text-zinc-500" />
										<span class="text-sm text-zinc-300">{metric.label}</span>
									</div>
								</td>
								{#each userProfiles as profile, idx}
									<td class="py-3 text-right">
										<span
											class="text-sm font-medium {leaderIdx === idx
												? 'text-emerald-400'
												: 'text-white'}"
										>
											{profile.metrics[metric.key as keyof typeof profile.metrics]}{metric.suffix ||
												''}
											{#if leaderIdx === idx}
												<span class="ml-1 text-emerald-400">★</span>
											{/if}
										</span>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<!-- Radar Comparison -->
		<section class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Radar Chart -->
			<div class="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 lg:col-span-2">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-sm font-semibold text-white">Profile Overlay</h3>
					<div class="flex gap-2">
						{#each userProfiles as profile, idx}
							<button
								onclick={() => toggleUser(idx)}
								class="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-opacity {profile.visible
									? 'opacity-100'
									: 'opacity-40'}"
								style="background-color: {USER_COLORS[idx % USER_COLORS.length].bg}"
							>
								<span
									class="h-2 w-2 rounded-full"
									style="background-color: {USER_COLORS[idx % USER_COLORS.length].solid}"
								></span>
								<span class="text-white">{profile.handle}</span>
							</button>
						{/each}
					</div>
				</div>
				<div class="h-[320px]">
					<canvas bind:this={radarCanvas}></canvas>
				</div>
			</div>

			<!-- Insight Box -->
			<div
				class="rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-900/20 to-zinc-900/40 p-6"
			>
				<div class="mb-4 flex items-center gap-2">
					<Sparkles class="h-5 w-5 text-indigo-400" />
					<h3 class="text-sm font-semibold text-white">Key Insights</h3>
				</div>
				{#if insight}
					<p class="text-sm leading-relaxed text-zinc-300">{insight}</p>
				{:else}
					<p class="text-sm text-zinc-500">Add more users to see comparison insights.</p>
				{/if}
			</div>
		</section>
	{:else if userProfiles.length === 1}
		<div class="rounded-2xl border border-white/10 bg-zinc-900/50 p-12 text-center">
			<Users class="mx-auto mb-4 h-12 w-12 text-zinc-600" />
			<p class="text-lg font-medium text-zinc-400">Add another user to compare</p>
			<p class="mt-2 text-sm text-zinc-500">
				Enter a Codeforces handle above to start comparing profiles
			</p>
		</div>
	{:else}
		<div class="rounded-2xl border border-white/10 bg-zinc-900/50 p-12 text-center">
			<Users class="mx-auto mb-4 h-12 w-12 text-zinc-600" />
			<p class="text-lg font-medium text-zinc-400">No users to compare</p>
			<p class="mt-2 text-sm text-zinc-500">Add at least 2 Codeforces handles to start comparing</p>
		</div>
	{/if}
</div>
