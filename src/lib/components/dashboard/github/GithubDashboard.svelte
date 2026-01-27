<script lang="ts">
    import type { GithubStats } from '$lib/server/github/types';
    import { adaptGithubProfile } from './adapter';
    import Layout from './Layout.svelte';
    import Overview from './tabs/Overview.svelte';
    import Activity from './tabs/Activity.svelte';
    import Skills from './tabs/Skills.svelte';
    import OSS from './tabs/OSS.svelte';

    import Resume from './tabs/Resume.svelte';

    let { data, activeTab: parentTab } = $props<{ data: GithubStats; activeTab: string }>();

    // Transform data
    let profile = $derived(adaptGithubProfile(data));

    // Internal Dashboard State
    // We maintain our own tab state independent of the parent page's "Overview/Analytics" tabs
    // unless we want to map them. Since the parent tabs don't match our requirements,
    // we use a local state.
    let currentTab = $state('Overview');
</script>

 
<div class="relative w-full">
    <Layout 
        data={profile} 
        activeTab={currentTab} 
        onTabChange={(t) => currentTab = t}
    >
        {#if currentTab === 'Overview'}
            <Overview data={profile} />
        {:else if currentTab === 'Activity'}
            <Activity data={profile} />
        {:else if currentTab === 'Skills'}
            <Skills data={profile} />
        {:else if currentTab === 'OSS'}
            <OSS data={profile} />
        {:else if currentTab === 'Resume'}
            <Resume data={profile} />
        {/if}
    </Layout>
</div>