<script lang="ts">
  import { enhance } from '$app/forms';
  import { slide, fade } from 'svelte/transition';
  import RisingParticles from '$lib/components/ui/RisingParticles/RisingParticles.svelte';

  let { data, form } = $props();

  // 6. Scoped loading states (Per platform/action)
  let loadingStates = $state<Record<string, boolean>>({});
  
  // 5. Copy feedback state
  let copiedToken = $state(false);

  // Form inputs
  let codeforcesHandle = $derived(data.handles.codeforces?.handle ?? '');
  let leetcodeHandle = $derived(data.handles.leetcode?.handle ?? '');

  // Active verification panel
  let activePanel = $state<string | null>(null);

  function togglePanel(platformId: string) {
    activePanel = activePanel === platformId ? null : platformId;
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    copiedToken = true;
    setTimeout(() => copiedToken = false, 2000);
  }

  // Platforms configuration with refined, professional colors
  const platforms = [
    {
      id: 'github',
      label: 'GitHub',
      icon: '🐙',
      accentColor: '#6e40ff', // Purple accent
      gradient: 'from-[#6e40ff]/5 to-transparent',
      border: 'border-white/5',
      hoverBorder: 'group-hover:border-[#6e40ff]/20',
      badgeColor: 'bg-[#6e40ff]/10 text-[#6e40ff]',
      text: 'text-white'
    },
    {
      id: 'codeforces',
      label: 'Codeforces',
      icon: '🏆',
      accentColor: '#3182ce', // Blue accent
      gradient: 'from-[#3182ce]/5 to-transparent',
      border: 'border-white/5',
      hoverBorder: 'group-hover:border-[#3182ce]/20',
      badgeColor: 'bg-[#3182ce]/10 text-[#3182ce]',
      text: 'text-white'
    },
    {
      id: 'leetcode',
      label: 'LeetCode',
      icon: '💻',
      accentColor: '#ecc94b', // Gold accent
      gradient: 'from-[#ecc94b]/5 to-transparent',
      border: 'border-white/5',
      hoverBorder: 'group-hover:border-[#ecc94b]/20',
      badgeColor: 'bg-[#ecc94b]/10 text-[#ecc94b]',
      text: 'text-white'
    }
  ];

  function getStatus(platformId: string) {
    const handle = data.handles[platformId];
    if (!handle) return 'not_connected';
    if (handle.verifiedAt) return 'verified';
    if (handle.verificationToken) return 'pending';
    return 'not_verified';
  }

  function getStatusConfig(status: string) {
    switch(status) {
      case 'verified':
        return { 
          bg: 'bg-emerald-500/10', 
          text: 'text-emerald-400', 
          border: 'border-emerald-500/20',
          dot: 'bg-emerald-400'
        };
      case 'pending':
        return { 
          bg: 'bg-amber-500/10', 
          text: 'text-amber-400', 
          border: 'border-amber-500/20',
          dot: 'bg-amber-400'
        };
      default:
        return { 
          bg: 'bg-white/5', 
          text: 'text-white/40', 
          border: 'border-white/10',
          dot: 'bg-white/20'
        };
    }
  }
</script>

<div class="min-h-screen bg-[#0B0B0F] text-white pt-20">
  <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
    <RisingParticles particleCount={50} className="z-0" />
    <div class="absolute top-[-20%] left-[-10%] h-125 w-125 rounded-full bg-indigo-600/20 blur-[120px]"></div>
    <div class="absolute right-[-10%] bottom-[-20%] h-125 w-125 rounded-full bg-purple-600/20 blur-[120px]"></div>
  </div>
  <div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
    <!-- Header Section -->
    <div class="mb-10">
      <h1 class="text-4xl font-light tracking-tight text-white/90">Verify Your Accounts</h1>
      <p class="mt-3 text-base text-white/40 font-light">Manage your connected coding profiles and verification status.</p>
    </div>

    <!-- Alert Message -->
    {#if form?.message}
      <div
        transition:slide
        role="alert"
        class="mb-8 rounded-xl p-4 {form.success
          ? 'bg-emerald-500/10 border border-emerald-500/20'
          : 'bg-rose-500/10 border border-rose-500/20'} text-sm font-medium flex items-center gap-3"
      >
        <span class="flex h-5 w-5 items-center justify-center rounded-full {form.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'} text-xs">
          {form.success ? '✓' : '⚠'}
        </span>
        <span class="{form.success ? 'text-emerald-400' : 'text-rose-400'}">{form.message}</span>
      </div>
    {/if}

    <!-- Platforms Grid -->
    <div class="space-y-3">
      {#each platforms as platform}
        {@const status = getStatus(platform.id)}
        {@const handleData = data.handles[platform.id]}
        {@const isLoading = loadingStates[platform.id]}
        {@const isExpanded = activePanel === platform.id}
        {@const statusConfig = getStatusConfig(status)}

        <div
          class="group relative rounded-2xl border transition-all duration-200 hover:border-white/10
          {isExpanded ? 'border-white/10 bg-white/[0.02]' : platform.border}
          {status === 'verified' ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : ''}"
        >
          <!-- Subtle gradient overlay -->
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r {platform.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" ></div>
          
          <!-- Main Card Content -->
          <div class="relative p-6">
            <div class="flex items-start justify-between">
              <!-- Left Section: Icon and Info -->
              <div class="flex items-start gap-4">
                <!-- Icon Container -->
                <div class="relative">
                  <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-2xl ring-1 ring-white/10">
                    {platform.icon}
                  </div>
                  {#if status === 'verified'}
                    <div class="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-[#0B0B0F]">
                      <span class="text-[10px] text-emerald-400">✓</span>
                    </div>
                  {/if}
                </div>
                
                <!-- Info -->
                <div>
                  <h3 class="text-lg font-medium text-white/90">{platform.label}</h3>
                  <div class="mt-1.5 flex items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 rounded-full {statusConfig.bg} px-2.5 py-0.5 text-xs font-medium {statusConfig.text}">
                      <span class="h-1.5 w-1.5 rounded-full {statusConfig.dot}" ></span>
                      {#if status === 'verified'}
                        Verified
                      {:else if status === 'pending'}
                        Pending
                      {:else}
                        Not Connected
                      {/if}
                    </span>
                    
                    {#if status === 'verified' && handleData?.handle}
                      <span class="text-sm text-white/30">•</span>
                      <span class="text-sm text-white/50 font-mono">@{handleData.handle}</span>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Action Button -->
              {#if status !== 'verified'}
                <button
                  type="button"
                  onclick={() => togglePanel(platform.id)}
                  class="relative inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200
                  {status === 'pending' 
                    ? 'bg-white text-[#0B0B0F] hover:bg-white/90' 
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'} 
                  ring-1 ring-white/10 hover:ring-white/20"
                >
                  <span class="relative">
                    {#if isExpanded}
                      Close
                    {:else if status === 'pending'}
                      Complete Verification
                    {:else}
                      Connect Profile
                    {/if}
                  </span>
                </button>
              {/if}
            </div>

            <!-- Expanded Panel -->
            {#if isExpanded && status !== 'verified'}
              <div 
                id="panel-{platform.id}"
                transition:slide={{ duration: 200, axis: 'y' }} 
                class="mt-6 pt-6 border-t border-white/5"
              >
                <!-- Progress Steps (for non-GitHub) -->
                {#if platform.id !== 'github'}
                  <div class="mb-6 flex items-center gap-2">
                    <div class="flex items-center gap-1.5">
                      <div class="flex h-6 w-6 items-center justify-center rounded-full {!handleData?.verificationToken ? 'bg-white text-[#0B0B0F]' : 'bg-white/10 text-white/40'} text-xs font-medium">
                        1
                      </div>
                      <span class="text-xs {!handleData?.verificationToken ? 'text-white/70' : 'text-white/30'}">Generate</span>
                    </div>
                    <div class="h-px w-6 bg-white/10" ></div>
                    <div class="flex items-center gap-1.5">
                      <div class="flex h-6 w-6 items-center justify-center rounded-full {handleData?.verificationToken ? 'bg-white text-[#0B0B0F]' : 'bg-white/10 text-white/40'} text-xs font-medium">
                        2
                      </div>
                      <span class="text-xs {handleData?.verificationToken ? 'text-white/70' : 'text-white/30'}">Verify</span>
                    </div>
                  </div>
                {/if}

                <!-- GitHub Section -->
                {#if platform.id === 'github'}
                  {#if data.githubOAuth.hasOAuth}
                    <div class="space-y-4">
                      <p class="text-sm text-white/60 leading-relaxed">
                        Verify ownership of <span class="text-white/90 font-medium">@{data.githubOAuth.username}</span> to complete the connection.
                      </p>
                      <form
                        method="POST"
                        action="?/verifyGitHub"
                        use:enhance={() => {
                          loadingStates[platform.id] = true;
                          return async ({ update }) => {
                            await update();
                            loadingStates[platform.id] = false;
                          };
                        }}
                      >
                        <button
                          type="submit"
                          disabled={isLoading}
                          class="w-full rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50 ring-1 ring-white/10"
                        >
                          {#if isLoading}
                            <span class="inline-flex items-center gap-2">
                              <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" ></span>
                              Verifying...
                            </span>
                          {:else}
                            Verify GitHub Account
                          {/if}
                        </button>
                      </form>
                    </div>
                  {:else}
                    <div class="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/10">
                      <p class="text-sm text-amber-400/80">
                        ⚠ GitHub OAuth required
                      </p>
                      <p class="mt-1 text-sm text-white/40">
                        Please sign out and sign back in using "Continue with GitHub".
                      </p>
                    </div>
                  {/if}
                {/if}

                <!-- Codeforces Section -->
                {#if platform.id === 'codeforces'}
                  {#if !handleData?.verificationToken}
                    <form
                      method="POST"
                      action="?/generateCodeforcesToken"
                      class="space-y-4"
                      use:enhance={() => {
                        loadingStates[platform.id] = true;
                        return async ({ update }) => {
                          await update();
                          loadingStates[platform.id] = false;
                        };
                      }}
                    >
                      <div>
                        <label for="cf-handle" class="block text-xs font-medium text-white/40 mb-2">Codeforces Handle</label>
                        <input
                          id="cf-handle"
                          type="text"
                          name="handle"
                          placeholder="e.g. tourist"
                          bind:value={codeforcesHandle}
                          required
                          class="w-full rounded-xl border-0 bg-white/5 px-4 py-3 text-white/90 placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#3182ce]/50 transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        class="w-full rounded-xl bg-[#3182ce]/10 px-4 py-3 text-sm font-medium text-[#3182ce] transition-all hover:bg-[#3182ce]/20 disabled:opacity-50 ring-1 ring-[#3182ce]/20"
                      >
                        {#if isLoading}
                          <span class="inline-flex items-center gap-2">
                            <span class="h-4 w-4 animate-spin rounded-full border-2 border-[#3182ce]/20 border-t-[#3182ce]" ></span>
                            Generating...
                          </span>
                        {:else}
                          Generate Verification Token
                        {/if}
                      </button>
                    </form>
                  {:else}
                    <div class="space-y-5">
                      <div class="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/10">
                        <p class="mb-3 text-sm text-white/60">
                          Copy this token to your Codeforces profile:
                        </p>
                        
                        <div class="flex items-center gap-2">
                          <code class="flex-1 rounded-lg bg-[#0B0B0F] px-3 py-2.5 font-mono text-sm text-[#3182ce] ring-1 ring-white/10">
                            {handleData.verificationToken}
                          </code>
                          
                          <button
                            type="button"
                            onclick={() => handleCopy(handleData.verificationToken ?? '')}
                            class="flex items-center gap-1.5 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white ring-1 ring-white/10"
                          >
                            {#if copiedToken}
                              <span class="text-emerald-400">✓</span> Copied
                            {:else}
                              Copy
                            {/if}
                          </button>
                        </div>
                      </div>

                      <div class="text-sm text-white/40">
                        <p class="font-medium text-white/60 mb-2">Instructions:</p>
                        <ol class="list-decimal list-inside space-y-1.5">
                          <li class="leading-relaxed">Go to <a href="https://codeforces.com/settings/social" target="_blank" rel="noopener noreferrer" class="text-[#3182ce] hover:text-[#3182ce]/80 hover:underline">Codeforces Settings</a></li>
                          <li class="leading-relaxed">Paste the token in the <span class="text-white/70">First Name</span> field</li>
                          <li class="leading-relaxed">Save your changes</li>
                        </ol>
                      </div>

                      <form
                        method="POST"
                        action="?/verifyCodeforces"
                        use:enhance={() => {
                          loadingStates[platform.id] = true;
                          return async ({ update }) => {
                            await update();
                            loadingStates[platform.id] = false;
                          };
                        }}
                      >
                        <button
                          type="submit"
                          disabled={isLoading}
                          class="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#0B0B0F] transition-all hover:bg-white/90 disabled:opacity-50"
                        >
                          {#if isLoading}
                            <span class="inline-flex items-center gap-2">
                              <span class="h-4 w-4 animate-spin rounded-full border-2 border-[#0B0B0F]/20 border-t-[#0B0B0F]" ></span>
                              Verifying...
                            </span>
                          {:else}
                            Verify Profile
                          {/if}
                        </button>
                        <p class="mt-2 text-center text-xs text-white/20">
                          We'll check your public profile for the token
                        </p>
                      </form>
                    </div>
                  {/if}
                {/if}

                <!-- LeetCode Section -->
                {#if platform.id === 'leetcode'}
                  {#if !handleData?.verificationToken}
                    <form
                      method="POST"
                      action="?/generateLeetCodeToken"
                      class="space-y-4"
                      use:enhance={() => {
                        loadingStates[platform.id] = true;
                        return async ({ update }) => {
                          await update();
                          loadingStates[platform.id] = false;
                        };
                      }}
                    >
                      <div>
                          <label for="lc-handle" class="block text-xs font-medium text-white/40 mb-2">LeetCode Username</label>
                          <input
                          id="lc-handle"
                          type="text"
                          name="handle"
                          placeholder="e.g. neal_wu"
                          bind:value={leetcodeHandle}
                          required
                          class="w-full rounded-xl border-0 bg-white/5 px-4 py-3 text-white/90 placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#ecc94b]/50 transition-all"
                          />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        class="w-full rounded-xl bg-[#ecc94b]/10 px-4 py-3 text-sm font-medium text-[#ecc94b] transition-all hover:bg-[#ecc94b]/20 disabled:opacity-50 ring-1 ring-[#ecc94b]/20"
                      >
                        {#if isLoading}
                          <span class="inline-flex items-center gap-2">
                            <span class="h-4 w-4 animate-spin rounded-full border-2 border-[#ecc94b]/20 border-t-[#ecc94b]" ></span>
                            Generating...
                          </span>
                        {:else}
                          Generate Verification Token
                        {/if}
                      </button>
                    </form>
                  {:else}
                    <div class="space-y-5">
                      <div class="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/10">
                        <p class="mb-3 text-sm text-white/60">
                          Add this token to your LeetCode profile README:
                        </p>
                        
                        <div class="flex items-center gap-2">
                          <code class="flex-1 rounded-lg bg-[#0B0B0F] px-3 py-2.5 font-mono text-sm text-[#ecc94b] ring-1 ring-white/10">
                            {handleData.verificationToken}
                          </code>
                          <button
                            type="button"
                            onclick={() => handleCopy(handleData.verificationToken ?? '')}
                            class="flex items-center gap-1.5 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white ring-1 ring-white/10"
                          >
                            {#if copiedToken}
                              <span class="text-emerald-400">✓</span> Copied
                            {:else}
                              Copy
                            {/if}
                          </button>
                        </div>
                      </div>

                      <div class="text-sm text-white/40">
                        <p class="font-medium text-white/60 mb-2">Instructions:</p>
                        <ol class="list-decimal list-inside space-y-1.5">
                          <li class="leading-relaxed">Go to <a href="https://leetcode.com/profile/" target="_blank" rel="noopener noreferrer" class="text-[#ecc94b] hover:text-[#ecc94b]/80 hover:underline">LeetCode Profile</a></li>
                          <li class="leading-relaxed">Edit profile and paste token in <span class="text-white/70">README</span></li>
                          <li class="leading-relaxed">Save your changes</li>
                        </ol>
                      </div>

                      <form
                        method="POST"
                        action="?/verifyLeetCode"
                        use:enhance={() => {
                          loadingStates[platform.id] = true;
                          return async ({ update }) => {
                            await update();
                            loadingStates[platform.id] = false;
                          };
                        }}
                      >
                        <button
                          type="submit"
                          disabled={isLoading}
                          class="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#0B0B0F] transition-all hover:bg-white/90 disabled:opacity-50"
                        >
                          {#if isLoading}
                            <span class="inline-flex items-center gap-2">
                              <span class="h-4 w-4 animate-spin rounded-full border-2 border-[#0B0B0F]/20 border-t-[#0B0B0F]" ></span>
                              Verifying...
                            </span>
                          {:else}
                            Verify Profile
                          {/if}
                        </button>
                        <p class="mt-2 text-center text-xs text-white/20">
                          We'll check your public profile for the token
                        </p>
                      </form>
                    </div>
                  {/if}
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Back Link -->
    <div class="mt-10">
      <a
        href="/analysis"
        class="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
      >
        <span class="text-lg leading-none">←</span>
        <span>Back to Analysis!</span>
      </a>
    </div>
  </div>
</div>