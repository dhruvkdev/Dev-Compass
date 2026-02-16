<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-black text-zinc-300 selection:bg-indigo-500/30">
	<div class="container mx-auto px-6 py-12 max-w-4xl">
		<a
			href="/"
			class="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-8 transition-colors"
		>
			<ArrowLeft size={16} />
			Back to Home
		</a>

		<h1 class="text-4xl font-bold text-white mb-8 tracking-tight">Privacy Policy</h1>
		
		<div class="prose prose-invert prose-zinc max-w-none">
			<p class="text-lg leading-relaxed mb-8 text-zinc-400">
				Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
			</p>

			<section class="space-y-4 mb-12">
				<h2 class="text-2xl font-semibold text-white">1. Information We Collect</h2>
				<p>
					We collect information you provide directly to us when you create an account, connect your coding profiles (LeetCode, Codeforces, GitHub), or verify your identity. This includes your name, email address, and profile identifiers.
				</p>
			</section>

			<section class="space-y-4 mb-12">
				<h2 class="text-2xl font-semibold text-white">2. How We Use Your Information</h2>
				<p>
					We use the information we collect to:
				</p>
				<ul class="list-disc pl-6 space-y-2">
					<li>Provide, maintain, and improve our services.</li>
					<li>Analyze your coding performance and generate personalized roadmaps.</li>
					<li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
				</ul>
			</section>

			<section class="space-y-4 mb-12">
				<h2 class="text-2xl font-semibold text-white">3. Data Security</h2>
				<p>
					We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
				</p>
			</section>

			<section class="space-y-4 mb-12">
				<h2 class="text-2xl font-semibold text-white">4. Contact Us</h2>
				<p>
					If you have any questions about this Privacy Policy, please contact us at dhruv.codes@proton.me.
				</p>
			</section>
		</div>
	</div>
</div>
