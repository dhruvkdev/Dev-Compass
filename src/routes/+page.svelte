<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import {
		ArrowRight,
		Code,
		Trophy,
		GitBranch,
		Brain,
		Target,
		Zap,
		ChevronRight,
		Github
	} from 'lucide-svelte';

	import Sparkles from '$lib/components/ui/Sparkles/index';
	import RisingParticles from '$lib/components/ui/RisingParticles/index';

	let visible = false;

	import { onMount } from 'svelte';
	onMount(() => {
		visible = true;
	});

	const features = [
		{
			title: 'DSA Mastery',
			description:
				'Track your progress across LeetCode and GeeksforGeeks. Get personalized recommendations to fill your knowledge gaps.',
			icon: Code,
			color: 'text-blue-400',
			bg: 'bg-blue-400/10'
		},
		{
			title: 'Competitive Programming',
			description:
				'Sync with Codeforces and CodeChef. Analyze your contest performance and visualize your rating growth.',
			icon: Trophy,
			color: 'text-yellow-400',
			bg: 'bg-yellow-400/10'
		},
		{
			title: 'Development Journey',
			description:
				'Connect your GitHub to showcase your projects. bridge the gap between algorithmic skills and real-world software engineering.',
			icon: GitBranch,
			color: 'text-purple-400',
			bg: 'bg-purple-400/10'
		}
	];
</script>

<div class="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-hidden">
	<!-- Hero Section -->
	<section
		class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center"
	>
		<!-- Background Elements -->
		<div class="absolute inset-0 z-0 overflow-hidden">
			<!-- Rising Particles Effect -->
			<RisingParticles particleCount={40} className="z-10" />
			<div
				class="absolute top-[-20%] left-[-10%] h-125 w-125 rounded-full bg-indigo-600/20 blur-[120px]"
			></div>
			<div
				class="absolute right-[-10%] bottom-[-20%] h-125 w-125 rounded-full bg-purple-600/20 blur-[120px]"
			></div>
		</div>

		{#if visible}
			<div class="relative z-10 max-w-4xl" in:fade={{ duration: 1000, delay: 200 }}>
				<div class="mb-6 flex justify-center">
					<span
						class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-indigo-300 backdrop-blur-md"
					>
						<span class="relative flex h-2 w-2">
							<span
								class="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"
							></span>
							<span class="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
						</span>
						The AI Career Coach for Developers
					</span>
				</div>

				<h1
					class="mb-6 bg-linear-to-b from-white to-white/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl md:leading-[1.1]"
				>
					Master Your <br />
					<span
						class="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
						>Coding Journey</span
					>
				</h1>

				<p class="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl">
					Manage DSA, Competitive Programming, and Development in one place.
					<br class="hidden sm:block" />
					Let AI decide your best next steps so you never get lost.
				</p>

				<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
					<a
						href="/signup"
						class="group flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-black transition-all hover:scale-105 hover:bg-zinc-200 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] active:scale-95"
					>
						Get Started Free
						<ArrowRight size={18} class="transition-transform group-hover:translate-x-1" />
					</a>
					<a
						href="#features"
						class="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-base font-medium text-white transition-all hover:bg-white/10 active:scale-95"
					>
						Learn More
						<ChevronRight
							size={18}
							class="text-zinc-400 transition-transform group-hover:rotate-90"
						/>
					</a>
				</div>
			</div>
		{/if}
	</section>

	<!-- Features Section -->
	<section id="features" class="relative py-32">
		<div class="container mx-auto px-6">
			<div class="mb-20 text-center">
				<h2 class="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
					Everything you need to grow
				</h2>
				<p class="text-zinc-400">Holistic growth tracking for the modern software engineer.</p>
			</div>

			<div class="grid gap-8 md:grid-cols-3">
				{#each features as feature, i}
					<div
						class="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:shadow-indigo-500/10"
					>
						<div
							class="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl {feature.bg} {feature.color}"
						>
							<feature.icon size={28} />
						</div>
						<h3 class="mb-3 text-xl font-semibold text-white">{feature.title}</h3>
						<p class="leading-relaxed text-zinc-400">
							{feature.description}
						</p>
						<div
							class="absolute inset-0 -z-10 bg-linear-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						></div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- How it works / Value Prop -->
	<section class="relative border-t border-white/5 bg-zinc-900/30 py-32">
		<div class="container mx-auto px-6">
			<div class="grid gap-16 lg:grid-cols-2 lg:items-center">
				<div>
					<div
						class="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-400 uppercase"
					>
						<Brain size={14} />
						Intelligent Guidance
					</div>
					<h2 class="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
						Stop guessing what to learn next.
					</h2>
					<p class="mb-8 text-lg leading-relaxed text-zinc-400">
						DevCompass analyzes your performance across all platforms to create a personalized
						roadmap. whether you need to brush up on Dynamic Programming or build a full-stack
						project, we tell you exactly what matters now.
					</p>

					<div class="space-y-6">
						{#each ['Personalized Daily Tasks', 'Skill Gap Analysis', 'Unified Portfolio'] as item}
							<div class="flex items-center gap-4">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-400"
								>
									<Target size={20} />
								</div>
								<span class="text-lg font-medium text-zinc-200">{item}</span>
							</div>
						{/each}
					</div>
				</div>

				<div
					class="flex h-[40rem] w-full flex-col items-center justify-center overflow-hidden rounded-md bg-black"
				>
					<h2
						class="relative z-20 text-center text-3xl font-bold text-white md:text-6xl lg:text-7xl"
					>
						DevCompass
					</h2>
					<div class="relative h-40 w-160">
						<!-- Gradients -->
						<div
							class="absolute inset-x-20 top-0 h-0.5 w-3/4 bg-gradient-to-r from-transparent
							via-indigo-500 to-transparent blur-sm"
						></div>
						<div
							class="absolute inset-x-20 top-0 h-px w-3/4 bg-gradient-to-r from-transparent
							via-indigo-500 to-transparent"
						></div>
						<div
							class="absolute inset-x-60 top-0 h-1.25 w-1/4 bg-gradient-to-r from-transparent
							via-sky-500 to-transparent blur-sm"
						></div>
						<div
							class="absolute inset-x-60 top-0 h-px w-1/4 bg-gradient-to-r from-transparent
							via-sky-500 to-transparent"
						></div>

						<!-- Core component -->
						<Sparkles
							minSize={0.8}
							maxSize={2}
							particleDensity={300}
							className="w-full h-full"
							particleColor="#FFFFFF"
						/>

						<!-- Radial Gradient to prevent sharp edges -->
						<div
							class="absolute inset-0 h-full w-full bg-black mask-[radial-gradient(350px_200px_at_top,transparent_20%,white)]"
						></div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-white/10 bg-black py-12">
		<div class="container mx-auto px-6">
			<div class="flex flex-col items-center justify-between gap-6 md:flex-row">
				<div class="flex items-center gap-2">
					<img src="/logo.svg" alt="Logo" class="h-8 w-8 text-white" />
					<span class="text-lg font-bold text-white">DevCompass</span>
				</div>
				<div class="flex gap-8 text-sm text-zinc-400">
					<a href="/#" class="transition-colors hover:text-white">Privacy</a>
					<a href="/#" class="transition-colors hover:text-white">Terms</a>
					<a href="/#" class="transition-colors hover:text-white">Twitter</a>
					<a href="/#" class="transition-colors hover:text-white">GitHub</a>
				</div>
				<p class="text-sm text-zinc-600">
					&copy; {new Date().getFullYear()} DevCompass. All rights reserved.
				</p>
			</div>
		</div>
	</footer>
</div>
