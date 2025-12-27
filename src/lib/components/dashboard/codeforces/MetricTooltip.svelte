<script lang="ts">
	import { Info } from 'lucide-svelte';

	let {
		title,
		definition,
		calculation,
		weighting,
		whyCare
	}: {
		title: string;
		definition: string;
		calculation: string;
		weighting?: string;
		whyCare: string;
	} = $props();

	let isOpen = $state(false);

	function toggle() {
		isOpen = !isOpen;
	}

	function close() {
		isOpen = false;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggle();
		}
	}
</script>

<div class="relative inline-block">
	<!-- Info Icon Trigger -->
	<button
		type="button"
		class="group inline-flex items-center justify-center rounded-full transition-all hover:bg-white/10 focus:ring-2 focus:ring-white/20 focus:outline-none"
		onclick={toggle}
		onkeydown={handleKeyDown}
		onmouseenter={() => (isOpen = true)}
		onmouseleave={close}
		onfocus={() => (isOpen = true)}
		onblur={close}
		aria-label="More information about {title}"
		aria-describedby="{title}-tooltip"
	>
		<Info class="h-4 w-4 text-zinc-500 transition-colors group-hover:text-zinc-400" />
	</button>

	<!-- Tooltip Content -->
	{#if isOpen}
		<div
			id="{title}-tooltip"
			role="tooltip"
			class="absolute top-full left-1/2 z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-2xl backdrop-blur-lg"
			onmouseenter={() => (isOpen = true)}
			onmouseleave={close}
		>
			<!-- Arrow -->
			<div
				class="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-t border-l border-white/10 bg-zinc-900"
			></div>

			<!-- Content -->
			<div class="relative space-y-3">
				<!-- Title -->
				<div class="text-sm font-semibold text-white">{title}</div>

				<!-- Definition -->
				<div>
					<div class="mb-1 text-xs font-medium tracking-wider text-zinc-500 uppercase">
						What is this?
					</div>
					<p class="text-sm text-zinc-300">{definition}</p>
				</div>

				<!-- Calculation -->
				<div>
					<div class="mb-1 text-xs font-medium tracking-wider text-zinc-500 uppercase">
						How it's calculated
					</div>
					<p class="font-mono text-xs text-zinc-400">{calculation}</p>
				</div>

				<!-- Weighting (optional) -->
				{#if weighting}
					<div>
						<div class="mb-1 text-xs font-medium tracking-wider text-zinc-500 uppercase">
							What affects it
						</div>
						<p class="text-xs text-zinc-400">{weighting}</p>
					</div>
				{/if}

				<!-- Why Care -->
				<div class="rounded-lg bg-indigo-500/10 p-2.5">
					<div class="mb-1 text-xs font-medium tracking-wider text-indigo-400 uppercase">
						Why it matters
					</div>
					<p class="text-xs text-indigo-300">{whyCare}</p>
				</div>
			</div>
		</div>
	{/if}
</div>
