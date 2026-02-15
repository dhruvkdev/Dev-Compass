<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import { navigating } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Global Navigation Loading Bar -->
{#if $navigating}
	<div class="loading-bar">
		<div class="loading-progress"></div>
	</div>
{/if}

<Navbar />

<div>
	{@render children()}
</div>

<style>
	.loading-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: transparent;
		z-index: 99999;
		overflow: hidden;
	}

	.loading-progress {
		height: 100%;
		background: linear-gradient(90deg, #52525b 0%, #a1a1aa 50%, #52525b 100%);
		background-size: 200% 100%;
		width: 100%;
		transform-origin: left;
		animation: shimmer 1.5s ease-in-out infinite, progress 2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@keyframes progress {
		0% {
			transform: scaleX(0);
		}
		50% {
			transform: scaleX(0.7);
		}
		100% {
			transform: scaleX(0.95);
		}
	}
</style>
