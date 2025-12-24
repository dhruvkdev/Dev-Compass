<script lang="ts">
	import { onMount } from 'svelte';
	import { Motion } from 'svelte-motion';

	export let particleCount = 50;
	export let className = '';

	type Particle = {
		id: number;
		left: string;
		size: number;
		duration: number;
		delay: number;
		color: string;
	};

	let particles: Particle[] = [];

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

<div class={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
	{#each particles as particle (particle.id)}
		<Motion
			initial={{ y: '110vh', opacity: 0 }}
			animate={{ y: '-10vh', opacity: [0, 1, 1, 0] }}
			transition={{
				duration: particle.duration,
				ease: 'linear',
				repeat: Infinity,
				delay: particle.delay
			}}
			let:motion
		>
			<div
				use:motion
				class="absolute rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
				style="
                    left: {particle.left};
                    width: {particle.size}px;
                    height: {particle.size}px;
                    background-color: {particle.color};
                "
			></div>
		</Motion>
	{/each}
</div>
