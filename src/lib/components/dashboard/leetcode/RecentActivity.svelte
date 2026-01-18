<script lang="ts">
	import { Calendar, ChevronRight, ExternalLink } from 'lucide-svelte';

	let { submissions } = $props();

	function timeAgo(timestampParam: string): string {
		const timestamp = parseInt(timestampParam) * 1000; // API usually returns unix seconds string
		const date = new Date(timestamp);
		if (isNaN(date.getTime())) return 'recently';

		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		const weeks = Math.floor(days / 7);
		if (weeks < 4) return `${weeks}w ago`;
		return date.toLocaleDateString();
	}
</script>

<div class="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-md">
	<div class="mb-6 flex items-center justify-between">
		<h3 class="text-lg font-bold text-white">Recent Activity</h3>
		<Calendar class="h-4 w-4 text-zinc-500" />
	</div>

	<div class="relative space-y-6 pl-2">
		<!-- Vertical Line -->
		<div class="absolute top-4 bottom-4 left-4 w-px bg-white/10"></div>

		{#each submissions as sub}
			<div class="group relative flex items-start gap-4">
				<!-- Dot -->
				<div
					class="relative z-10 mt-1.5 h-3 w-3 flex-shrink-0 rounded-full border-2 border-zinc-900 bg-emerald-500"
				></div>

				<!-- Content -->
				<div class="min-w-0 flex-1 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10">
					<div class="flex items-center justify-between">
						<span class="truncate text-sm font-medium text-white">{sub.title}</span>
						<span class="text-xs text-zinc-500">{timeAgo(sub.timestamp)}</span>
					</div>
					<div class="mt-1 flex items-center gap-2 text-xs text-zinc-400">
						<span class="rounded bg-white/10 px-1.5 py-0.5">{sub.lang || 'Unknown'}</span>
						<span class="text-emerald-400">Accepted</span>
					</div>

					<a
						href={`https://leetcode.com/problems/${sub.titleSlug}`}
						target="_blank"
						class="absolute inset-0"
						aria-label={`View problem ${sub.title}`}
					></a>
				</div>
			</div>
		{:else}
			<div class="py-4 text-center text-sm text-zinc-500">No recent activity</div>
		{/each}
	</div>
</div>
