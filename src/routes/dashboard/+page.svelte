<script lang="ts">
  let { data } = $props();
  
  // State variables
  let sortBy = $state<'rating' | 'difficulty' | 'title'>('rating');
  let sortOrder = $state<'asc' | 'desc'>('asc');
  let filterText = $state('');
  
  // Derived values
  let codeforcesData = $derived(data.platforms?.find((p: any) => p.platform === 'codeforces'));
  let problems = $derived(codeforcesData?.data?.cfProblemsByRating || []);
  
  let filteredProblems = $derived(
    problems
      .filter((problem: any) => 
        problem.title.toLowerCase().includes(filterText.toLowerCase()) ||
        problem.tags?.some((tag: string) => tag.toLowerCase().includes(filterText.toLowerCase()))
      )
      .sort((a: any, b: any) => {
        let comparison = 0;
        if (sortBy === 'rating') {
          comparison = (a.rating || 0) - (b.rating || 0);
        } else if (sortBy === 'difficulty') {
          const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3, 'very-hard': 4 };
          comparison = (difficultyOrder[a.difficulty?.toLowerCase()] || 0) - (difficultyOrder[b.difficulty?.toLowerCase()] || 0);
        } else {
          comparison = a.title.localeCompare(b.title);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      })
  );
  
  // Helper functions (remain the same)
  function getDifficultyColor(difficulty: string | null): string {
    const colors: Record<string, string> = {
      'easy': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'hard': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'very-hard': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return colors[difficulty?.toLowerCase() || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
  
  function getRatingColor(rating: number): string {
    if (rating >= 2400) return 'text-red-600 dark:text-red-400';
    if (rating >= 2100) return 'text-orange-600 dark:text-orange-400';
    if (rating >= 1900) return 'text-purple-600 dark:text-purple-400';
    if (rating >= 1600) return 'text-blue-600 dark:text-blue-400';
    if (rating >= 1400) return 'text-cyan-600 dark:text-cyan-400';
    if (rating >= 1200) return 'text-green-600 dark:text-green-400';
    return 'text-gray-600 dark:text-gray-400';
  }
  
  // Toggle sort order
  function toggleSortOrder() {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  }
</script>

<div class="space-y-6 pt-28 pl-40 pr-40">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Codeforces Problems
      </h2>
      <span class="px-2.5 py-0.5 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
        {filteredProblems.length}
      </span>
    </div>
    
    <!-- Search and Filters -->
    <div class="flex items-center space-x-4">
      <div class="relative">
        <input
          type="text"
          placeholder="Search problems or tags..."
          bind:value={filterText}
          class="pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white w-64"
        />
        <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <!-- Sort Dropdown -->
      <select
        bind:value={sortBy}
        class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
      >
        <option value="rating">Sort by Rating</option>
        <option value="difficulty">Sort by Difficulty</option>
        <option value="title">Sort by Title</option>
      </select>
      
      <button
        onclick={toggleSortOrder}
        class="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {#if sortOrder === 'asc'}
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
        {:else}
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <!-- Problems Grid -->
  {#if filteredProblems.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredProblems as problem (problem.id || problem.title)}
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          class="block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 group"
        >
          <!-- Title and Tags -->
          <div class="space-y-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {problem.title}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {problem.slug}
              </p>
            </div>
            
            <!-- Tags -->
            {#if problem.tags && problem.tags.length > 0}
              <div class="flex flex-wrap gap-1.5">
                {#each problem.tags.slice(0, 3) as tag}
                  <span class="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                    {tag}
                  </span>
                {/each}
                {#if problem.tags.length > 3}
                  <span class="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
                    +{problem.tags.length - 3}
                  </span>
                {/if}
              </div>
            {/if}
            
            <!-- Metadata -->
            <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <div class="flex items-center space-x-3">
                <!-- Rating -->
                {#if problem.rating}
                  <span class="flex items-center space-x-1">
                    <svg class="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span class="text-sm font-medium {getRatingColor(problem.rating)}">
                      {problem.rating}
                    </span>
                  </span>
                {/if}
                
                <!-- Difficulty -->
                {#if problem.difficulty}
                  <span class="px-2 py-0.5 text-xs font-medium rounded-full {getDifficultyColor(problem.difficulty)}">
                    {problem.difficulty}
                  </span>
                {/if}
              </div>
              
              <!-- External Link Icon -->
              <svg class="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <!-- Empty State -->
    <div class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No problems found</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {filterText ? 'Try adjusting your search or filters.' : 'Check back later for recommended problems.'}
      </p>
    </div>
  {/if}
</div>

<style>
  /* Add any custom styles if needed */
  :global(.line-clamp-2) {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>