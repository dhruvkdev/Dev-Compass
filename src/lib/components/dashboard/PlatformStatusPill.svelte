<script lang="ts">
	type Props = {
		platform: string;
		connected: boolean;
		handle?: string;
	};

	let { platform, connected, handle }: Props = $props();

	const colors: Record<string, { active: string; inactive: string }> = {
		codeforces: {
			active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
			inactive: 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
		},
		leetcode: {
			active: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
			inactive: 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
		},
		github: {
			active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
			inactive: 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
		}
	};

	let style = $derived(colors[platform] ?? colors.codeforces);
</script>

<span
	class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border {connected ? style.active : style.inactive}"
>
	<span class="w-1.5 h-1.5 rounded-full {connected ? 'bg-current' : 'bg-zinc-600'}"></span>
	<span class="capitalize">{platform}</span>
	{#if handle}
		<span class="text-zinc-500">· {handle}</span>
	{/if}
</span>
