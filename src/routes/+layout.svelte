<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import { navigating } from '$app/stores';
	import { Toaster } from '$lib/components/ui/sonner';

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
	<Toaster />
</div>

<style>
	.loading-bar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: 2px;
	z-index: 99999;
	background: transparent;
	overflow: hidden;
}

/* Main progress bar */
.loading-progress {
	position: relative;
	height: 100%;
	width: 100%;
	transform-origin: left;
	background: linear-gradient(
		90deg,
		rgba(230, 231, 235, 0.15),
		rgba(230, 231, 235, 0.45),
		rgba(230, 231, 235, 0.15)
	);
	transform: scaleX(0);
	animation: load-progress 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* Subtle silver highlight sweep */
.loading-progress::after {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(
		90deg,
		transparent,
		rgba(255, 255, 255, 0.35),
		transparent
	);
	transform: translateX(-100%);
	animation: highlight-sweep 1.4s ease-out forwards;
}

/* Progress growth */
@keyframes load-progress {
	0% {
		transform: scaleX(0);
	}
	60% {
		transform: scaleX(0.7);
	}
	100% {
		transform: scaleX(0.92);
	}
}

/* One-time highlight */
@keyframes highlight-sweep {
	0% {
		transform: translateX(-100%);
	}
	100% {
		transform: translateX(100%);
	}
}

</style>
