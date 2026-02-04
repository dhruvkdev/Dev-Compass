<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		particleCount?: number;
		className?: string;
	}

	let { particleCount = 50, className = '' }: Props = $props();

	type Particle = {
		id: number;
		left: string;
		size: number;
		duration: number;
		delay: number;
		color: string;
	};

	let particles = $state<Particle[]>([]);

	onMount(() => {
		const colors = ['#6366f1', '#a855f7', '#ec4899', '#ffffff']; // Indigo, Purple, Pink, White
		particles = Array.from({ length: particleCount }, (_, i) => ({
			id: i,
			left: Math.random() * 100 + '%',
			size: Math.random() * 4 + 1, // 1px to 5px
			duration: Math.random() * 5 + 5, // 5s to 10s duration
			delay: Math.random() * 5, // 0 to 5s start delay
			color: colors[Math.floor(Math.random() * colors.length)]
		}));
	});
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden {className}">
	{#each particles as particle (particle.id)}
		<div
			class="absolute rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-rise"
			style="
                    left: {particle.left};
                    width: {particle.size}px;
                    height: {particle.size}px;
                    background-color: {particle.color};
					animation-duration: {particle.duration}s;
					animation-delay: {particle.delay}s;
                "
		></div>
	{/each}
</div>

<style>
	@keyframes rise {
		0% {
			transform: translateY(110vh);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		80% {
			opacity: 1;
		}
		100% {
			transform: translateY(-10vh);
			opacity: 0;
		}
	}
	.animate-rise {
		animation: rise linear infinite;
		animation-fill-mode: backwards;
	}
</style>
