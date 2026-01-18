<script lang="ts">
	import ProfileHeader from './ProfileHeader.svelte';
	import DifficultyBreakdown from './DifficultyBreakdown.svelte';
	import RecentActivity from './RecentActivity.svelte';
	import { Code2 } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="space-y-6 pt-6">
	<!-- 1. Profile Section -->
	<ProfileHeader profile={data.profile} />

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- 2. Solved Stats (Difficulty) -->
		<div class="lg:col-span-1">
			<DifficultyBreakdown
				easy={data.profile.easySolved}
				medium={data.profile.mediumSolved}
				hard={data.profile.hardSolved}
				total={data.profile.totalSolved}
			/>
		</div>

		<!-- 3. Recent Activity & Languages -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Languages -->
			<div class="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-md">
				<h3 class="mb-4 text-lg font-bold text-white">Languages</h3>
				<div class="flex flex-wrap gap-2">
					{#each data.languages as lang}
						<div
							class="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2"
						>
							<Code2 class="h-4 w-4 text-zinc-500" />
							<span class="text-sm font-medium text-white">{lang.languageName}</span>
							<span class="text-xs text-zinc-500">{lang.problemsSolved} solved</span>
						</div>
					{:else}
						<p class="text-sm text-zinc-500">No language data available</p>
					{/each}
				</div>
			</div>

			<!-- Activity -->
			<RecentActivity submissions={data.recentSubmissions} />
		</div>
	</div>
</div>
