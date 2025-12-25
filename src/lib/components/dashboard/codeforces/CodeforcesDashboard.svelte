<script lang="ts">
	import ActivityHeatmap from './ActivityHeatmap.svelte';
	import ContestHistory from './ContestHistory.svelte';
	import ProblemAnalysis from './ProblemAnalysis.svelte';
	import ProfileHeader from './ProfileHeader.svelte';
	import RatingGraph from './RatingGraph.svelte';
	import SubmissionOverview from './SubmissionOverview.svelte';

	let { data } = $props();
</script>

<div class="space-y-6 pt-6">
	<!-- 1. Profile Section -->
	<ProfileHeader
		info={data.info}
		rating={data.rating?.[data.rating.length - 1]?.newRating}
		maxRating={data.info?.maxRank
			? data.rating?.reduce((max, r) => Math.max(max, r.newRating), 0)
			: 0}
	/>

	<!-- 2. Integrated Heatmaps (Grind Mode & Top Problems) -->
	<ActivityHeatmap submissions={data.submissions} />

	<!-- 3. Rating Graph -->
	<div class="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-md">
		<h3 class="mb-6 text-lg font-bold text-white">Rating History</h3>
		<RatingGraph history={data.rating} />
	</div>

	<!-- 4. Contest History -->
	<div class="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-md">
		<h3 class="mb-6 text-lg font-bold text-white">Recent Contests</h3>
		<ContestHistory history={data.rating} />
	</div>

	<!-- 5. Problem Analysis (Tags & Ratings) -->
	<ProblemAnalysis submissions={data.submissions} />

	<!-- 6. Submission Overview (Doughnuts) -->
	<SubmissionOverview submissions={data.submissions} />
</div>
