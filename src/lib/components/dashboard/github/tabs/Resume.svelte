<script lang="ts">
    import type { GithubProfile } from '../types';

    let { data } = $props<{ data: GithubProfile }>();
    
    // Resume text generator (basic)
    function generateResume(profile: GithubProfile) {
        const topLangs = profile.skills.topLanguages.join(', ');
        const activeYears = Math.floor(profile.accountAgeYears);
        const tier = profile.rating.tier;
        
        return `
# ${profile.username}
**Vector Tier:** ${tier} | **Experience:** ${activeYears}+ Years

## Professional Summary
Dedicated open-source contributor with strong expertise in ${topLangs}. 
Maintains a consistent contribution record with ${profile.metrics.totalContributions} contributions in the past year.
Achieved a high impact score through ${profile.metrics.totalStars} stars across repositories.

## Core Competencies
- **Languages**: ${profile.skills.languages.map(l => l.name).join(', ')}
- **Community Impact**: ${profile.metrics.pullRequests} PRs merged, ${profile.metrics.reviews} code reviews provided.

## Key Projects
${profile.oss.pinned.map(repo => `- **${repo.name}**: ${repo.description || 'No description'} (${repo.stars} stars)`).join('\n')}
        `.trim();
    }
    
    let resumeText = $derived(generateResume(data));
    let copied = $state(false);
    
    function copyResume() {
        navigator.clipboard.writeText(resumeText);
        copied = true;
        setTimeout(() => copied = false, 2000);
    }
</script>

<div class="flex flex-col gap-6">
    <!-- Resume Generator -->
    <div class="rounded-xl border border-[#30363d] bg-[#161b22] p-6 shadow-md">
        <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold text-[#f0f6fc]">Auto-Generated Resume</h3>
            <button 
                onclick={copyResume}
                class="rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-xs text-[#c9d1d9] transition-colors hover:border-[#8b949e] hover:bg-[#30363d]"
            >
                {copied ? 'Copied!' : 'Copy Markdown'}
            </button>
        </div>
        
        <pre class="h-[600px] w-full overflow-y-auto whitespace-pre-wrap rounded-lg bg-[#0d1117] p-4 text-xs leading-relaxed text-[#8b949e] font-mono border border-[#30363d]">{resumeText}</pre>
    </div>
</div>
