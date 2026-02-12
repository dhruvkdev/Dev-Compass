<script lang="ts">
  import { enhance } from '$app/forms';
  import { slide, fade } from 'svelte/transition';

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

  // Platforms configuration
  const platforms = [
    {
      id: 'github',
      label: 'GitHub',
      icon: '🐙',
      baseColor: 'bg-gray-800', // Solid background for better contrast
      gradient: 'from-gray-800 to-gray-900',
      border: 'border-gray-700',
      text: 'text-gray-300'
    },
    {
      id: 'codeforces',
      label: 'Codeforces',
      icon: '🏆',
      baseColor: 'bg-red-950',
      gradient: 'from-red-900/40 to-red-950/40',
      border: 'border-red-800/50',
      text: 'text-red-200'
    },
    {
      id: 'leetcode',
      label: 'LeetCode',
      icon: '💻',
      baseColor: 'bg-yellow-950',
      gradient: 'from-yellow-900/30 to-yellow-950/30',
      border: 'border-yellow-700/50',
      text: 'text-yellow-200'
    }
  ];

  function getStatus(platformId: string) {
    const handle = data.handles[platformId];
    if (!handle) return 'not_connected';
    if (handle.verifiedAt) return 'verified';
    if (handle.verificationToken) return 'pending';
    return 'not_verified'; // Should theoretically not happen if handle exists but no token/verification, simplified for logic
  }
</script>

<div class="mx-auto max-w-3xl space-y-8 p-6">
  <div>
    <h1 class="text-3xl font-bold tracking-tight text-white">Settings</h1>
    <p class="mt-2 text-gray-400">Manage your coding profiles and verification status.</p>
  </div>

  {#if form?.message}
    <div
      transition:slide
      role="alert"
      class="rounded-lg p-4 {form.success
        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
        : 'bg-red-500/10 border border-red-500/20 text-red-400'} text-sm font-medium flex items-center gap-2"
    >
      <span>{form.success ? '✓' : '⚠'}</span>
      {form.message}
    </div>
  {/if}

  <div class="space-y-4">
    {#each platforms as platform}
      {@const status = getStatus(platform.id)}
      {@const handleData = data.handles[platform.id]}
      {@const isLoading = loadingStates[platform.id]}
      {@const isExpanded = activePanel === platform.id}

      <div
        class="rounded-xl border transition-all duration-300 overflow-hidden
        {status === 'verified' ? 'border-green-500/30 bg-green-900/10' : `${platform.border} bg-gradient-to-r ${platform.gradient}`}"
      >
        <div class="p-5">
          <div class="flex items-center justify-between">
            
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-black/20 text-2xl shadow-inner">
                {platform.icon}
              </div>
              
              <div class="flex flex-col">
                <h3 class="font-bold text-white leading-tight">{platform.label}</h3>
                
                <div class="mt-1 flex items-center gap-2">
                  {#if status === 'verified'}
                    <span class="inline-flex items-center gap-1 text-xs font-medium text-green-400" role="status">
                      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Verified
                    </span>
                    <span class="text-xs text-gray-500">•</span>
                    <span class="text-xs text-gray-400">@{handleData.handle}</span>
                  {:else if status === 'pending'}
                    <span class="inline-flex items-center gap-1 text-xs font-medium text-yellow-400" role="status">
                      <span class="relative flex h-2 w-2 mr-1">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                      </span>
                      Finish Verification
                    </span>
                  {:else}
                    <span class="text-xs text-gray-500">Not connected</span>
                  {/if}
                </div>
              </div>
            </div>

            {#if status !== 'verified'}
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls="panel-{platform.id}"
                onclick={() => togglePanel(platform.id)}
                class="group relative inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all
                {status === 'pending' 
                  ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-sm' // Primary CTA look for pending
                  : 'bg-white/5 text-white hover:bg-white/10' // Secondary for initial connect
                }"
              >
                {#if isExpanded}
                  Close
                {:else if status === 'pending'}
                  Continue
                {:else}
                  Connect
                {/if}
              </button>
            {/if}
          </div>

          {#if isExpanded && status !== 'verified'}
            <div 
              id="panel-{platform.id}"
              transition:slide={{ duration: 300, axis: 'y' }} 
              class="mt-6 border-t border-white/10 pt-6"
            >
              
              {#if platform.id !== 'github'}
                 <div class="mb-6 flex items-center gap-2 text-xs font-medium text-gray-500">
                    <span class="{!handleData?.verificationToken ? 'text-white' : ''}">1. Generate</span>
                    <span class="h-px w-4 bg-gray-700"></span>
                    <span class="{handleData?.verificationToken ? 'text-white' : ''}">2. Verify</span>
                 </div>
              {/if}

              {#if platform.id === 'github'}
                {#if data.githubOAuth.hasOAuth}
                  <div class="space-y-4">
                    <p class="text-sm text-gray-300">
                      We'll verify that you own the GitHub account <strong class="text-white">@{data.githubOAuth.username}</strong> connected to your session.
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
                        class="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-white disabled:opacity-50"
                      >
                        {#if isLoading}
                          <span class="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"></span>
                        {/if}
                        {isLoading ? 'Verifying...' : 'Verify GitHub Account'}
                      </button>
                    </form>
                  </div>
                {:else}
                  <div class="flex flex-col gap-3 rounded-lg bg-gray-900/50 p-4">
                    <p class="text-sm text-yellow-200/80">
                      ⚠ GitHub OAuth required
                    </p>
                    <p class="text-sm text-gray-400">
                      To verify GitHub, please sign out and sign back in using the "Continue with GitHub" option.
                    </p>
                  </div>
                {/if}
              {/if}

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
                      <label for="cf-handle" class="block text-xs font-medium text-gray-400 mb-1.5">Codeforces Handle</label>
                      <input
                        id="cf-handle"
                        type="text"
                        name="handle"
                        placeholder="e.g. tourist"
                        bind:value={codeforcesHandle}
                        required
                        class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-white placeholder-gray-600 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      class="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                    >
                       {isLoading ? 'Generating Token...' : 'Generate Token'}
                    </button>
                  </form>
                {:else}
                  <div class="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div class="rounded-lg border border-white/5 bg-black/20 p-4">
                      <p class="mb-2 text-sm text-gray-300">
                        Copy this token to your <strong class="text-white">Codeforces First Name</strong> settings:
                      </p>
                      
                      <div class="flex items-center gap-2">
                        <code class="flex-1 rounded bg-black/40 px-3 py-2 font-mono text-sm text-red-200 border border-white/5">
                          {handleData.verificationToken}
                        </code>
                        
                        <button
                          type="button"
                          onclick={() => handleCopy(handleData.verificationToken ?? '')}
                          class="flex w-24 items-center justify-center gap-1.5 rounded bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                        >
                          {#if copiedToken}
                            <span class="text-green-400">✓</span> Copied
                          {:else}
                            Copy
                          {/if}
                        </button>
                      </div>
                    </div>

                    <div class="text-sm text-gray-400">
                      <p>Instructions:</p>
                      <ol class="mt-2 list-inside list-decimal space-y-1 pl-1">
                        <li>Go to <a href="https://codeforces.com/settings/social" target="_blank" rel="noopener noreferrer" class="text-red-400 hover:text-red-300 hover:underline inline-flex items-center gap-0.5">Codeforces Settings <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a></li>
                        <li>Paste the token into the <strong>First Name</strong> (or Last Name) field.</li>
                        <li>Save changes.</li>
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
                        class="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50"
                      >
                         {isLoading ? 'Checking Profile...' : 'I have updated my profile'}
                      </button>
                      <p class="mt-2 text-center text-xs text-gray-500">
                        We will check your public profile for the token.
                      </p>
                    </form>
                  </div>
                {/if}
              {/if}

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
                        <label for="lc-handle" class="block text-xs font-medium text-gray-400 mb-1.5">LeetCode Username</label>
                        <input
                        id="lc-handle"
                        type="text"
                        name="handle"
                        placeholder="e.g. neal_wu"
                        bind:value={leetcodeHandle}
                        required
                        class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-white placeholder-gray-600 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                        />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      class="w-full rounded-lg bg-yellow-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Generating Token...' : 'Generate Token'}
                    </button>
                  </form>
                {:else}
                  <div class="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div class="rounded-lg border border-white/5 bg-black/20 p-4">
                      <p class="mb-2 text-sm text-gray-300">
                        Copy this token to your <strong class="text-white">LeetCode README</strong>:
                      </p>
                      
                      <div class="flex items-center gap-2">
                        <code class="flex-1 rounded bg-black/40 px-3 py-2 font-mono text-sm text-yellow-200 border border-white/5">
                          {handleData.verificationToken}
                        </code>
                        <button
                          type="button"
                          onclick={() => handleCopy(handleData.verificationToken ?? '')}
                          class="flex w-24 items-center justify-center gap-1.5 rounded bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                        >
                          {#if copiedToken}
                             <span class="text-green-400">✓</span> Copied
                          {:else}
                             Copy
                          {/if}
                        </button>
                      </div>
                    </div>

                    <div class="text-sm text-gray-400">
                      <p>Instructions:</p>
                      <ol class="mt-2 list-inside list-decimal space-y-1 pl-1">
                        <li>Go to <a href="https://leetcode.com/profile/" target="_blank" rel="noopener noreferrer" class="text-yellow-400 hover:text-yellow-300 hover:underline inline-flex items-center gap-0.5">LeetCode Profile <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a></li>
                        <li>Edit Profile and paste the token in the <strong>README</strong> field.</li>
                        <li>Save changes.</li>
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
                        class="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50"
                      >
                        {isLoading ? 'Checking Profile...' : 'I have updated my profile'}
                      </button>
                      <p class="mt-2 text-center text-xs text-gray-500">
                        We will check your public profile for the token.
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

  <div class="pt-4">
    <a
      href="/dashboard"
      class="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
    >
      <span>←</span> Back to Dashboard
    </a>
  </div>
</div>