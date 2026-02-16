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

		<h1 class="text-4xl font-bold text-white mb-8 tracking-tight">Terms of Service</h1>
		
		<div class="prose prose-invert prose-zinc max-w-none">
			<p class="text-lg leading-relaxed mb-8 text-zinc-400">
				Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
			</p>

			<section class="space-y-4 mb-12">
				<h2 class="text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
				<p>
					By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
				</p>
			</section>

			<section class="space-y-4 mb-12">
				<h2 class="text-2xl font-semibold text-white">2. Accounts</h2>
				<p>
					When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
				</p>
			</section>

			<section class="space-y-4 mb-12">
				<h2 class="text-2xl font-semibold text-white">3. Intellectual Property</h2>
				<p>
					The Service and its original content, features, and functionality are and will remain the exclusive property of Vector and its licensors.
				</p>
			</section>

			<section class="space-y-4 mb-12">
				<h2 class="text-2xl font-semibold text-white">4. Termination</h2>
				<p>
					We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
				</p>
			</section>

            <section class="space-y-4 mb-12">
				<h2 class="text-2xl font-semibold text-white">5. Changes</h2>
				<p>
					We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect.
				</p>
			</section>
		</div>
	</div>
</div>
