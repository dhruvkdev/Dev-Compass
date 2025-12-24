<script lang="ts">
	import { cn } from '$lib/utils';
	import { Motion } from 'svelte-motion';
	import { onMount } from 'svelte';

	export let minSize: number = 0.6;
	export let maxSize: number = 1.5;
	export let speed: number = 3;
	export let particleColor: string = '#ffffff';
	export let particleDensity: number = 200;
	export let className: string | undefined = undefined;

	type Particle = {
		id: number;
		top: string;
		left: string;
		size: number;
		duration: number;
		moveX: number;
		moveY: number;
		targetOpacity: number;
	};

	let particles: Particle[] = [];

	onMount(() => {
		particles = Array.from({ length: particleDensity }, (_, i) => ({
			id: i,
			top: Math.random() * 100 + '%',
			left: Math.random() * 100 + '%',
			size: minSize + Math.random() * (maxSize - minSize),
			duration: Math.random() * 10 + speed,
			moveX: Math.random() * 4 - 2, // Random movement -2px to 2px
			moveY: Math.random() * 4 - 2,
			targetOpacity: Math.random()
		}));
	});
</script>

<div class={cn('relative h-48', className)}>
	<div class="absolute inset-0">
		{#each particles as particle (particle.id)}
			<Motion
				let:motion
				animate={{
					top: `calc(${particle.top} + ${particle.moveY}px)`,
					left: `calc(${particle.left} + ${particle.moveX}px)`,
					opacity: particle.targetOpacity,
					scale: [1, 1.2, 0]
				}}
				transition={{
					duration: particle.duration,
					repeat: Infinity,
					ease: 'linear'
				}}
			>
				<span
					use:motion
					class="inline-block"
					style={`position: absolute; width: ${particle.size}px; height: ${particle.size}px; background-color: ${particleColor}; border-radius: 50%; top: ${particle.top}; left: ${particle.left};`}
				></span>
			</Motion>
		{/each}
	</div>
</div>
