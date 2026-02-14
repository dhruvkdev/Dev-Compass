<script lang="ts">
	import { slide } from 'svelte/transition';

	type Props = {
		title: string;
		subtitle?: string;
		platform: 'codeforces' | 'leetcode' | 'github';
		defaultOpen?: boolean;
		children: import('svelte').Snippet;
	};

	let { title, subtitle, platform, defaultOpen = false, children }: Props = $props();
	// svelte-ignore state_referenced_locally
		let open = $state(defaultOpen);

	const platformIcons: Record<string, string> = {
		codeforces: '⚡',
		leetcode: '🧩',
		github: '🐙'
	};

	// Initialize from prop
	$effect(() => {
		open = defaultOpen;
	});
</script>

<section class="border border-white/5 rounded-2xl bg-zinc-900/30 overflow-hidden">
	<button
		onclick={() => (open = !open)}
		class="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
	>
		<div class="flex items-center gap-3">
			<span class="text-lg">{platformIcons[platform] ?? '📦'}</span>
			<div class="text-left">
				<h2 class="text-lg font-semibold text-zinc-200">{title}</h2>
				{#if subtitle}
					<p class="text-sm text-zinc-500">{subtitle}</p>
				{/if}
			</div>
		</div>
		<svg
			class="w-5 h-5 text-zinc-500 transform transition-transform {open ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if open}
		<div transition:slide={{ duration: 200 }} class="px-6 pb-6 pt-2 border-t border-white/5">
			{@render children()}
		</div>
	{/if}
</section>
