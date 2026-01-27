<script lang="ts">
    import type { GithubProfile } from '../types';
    import { GitPullRequest, MessageSquare, AlertCircle } from 'lucide-svelte';

    let { data } = $props<{ data: GithubProfile }>();
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- OSS Breakdown -->
    <div class="col-span-1 lg:col-span-2 flex flex-col gap-6">
        <div class="rounded-xl border border-[#30363d] bg-[#161b22] p-6">
            <h3 class="mb-6 text-base font-semibold text-[#f0f6fc]">Contribution Breakdown</h3>
            
            <div class="flex items-center justify-around py-8">
                 <div class="flex flex-col items-center gap-2">
                    <div class="rounded-full bg-purple-500/10 p-3 text-purple-400">
                        <GitPullRequest size={24} />
                    </div>
                    <span class="text-2xl font-bold text-[#f0f6fc]">{data.oss.breakdown.prs}</span>
                    <span class="text-xs text-[#8b949e]">PRs Merged</span>
                 </div>
                 
                 <div class="h-12 w-px bg-[#30363d]"></div>
                 
                 <div class="flex flex-col items-center gap-2">
                    <div class="rounded-full bg-green-500/10 p-3 text-green-400">
                        <AlertCircle size={24} />
                    </div>
                    <span class="text-2xl font-bold text-[#f0f6fc]">{data.oss.breakdown.issues}</span>
                    <span class="text-xs text-[#8b949e]">Issues Opened</span>
                 </div>
                 
                 <div class="h-12 w-px bg-[#30363d]"></div>

                 <div class="flex flex-col items-center gap-2">
                    <div class="rounded-full bg-blue-500/10 p-3 text-blue-400">
                        <MessageSquare size={24} />
                    </div>
                    <span class="text-2xl font-bold text-[#f0f6fc]">{data.oss.breakdown.reviews}</span>
                    <span class="text-xs text-[#8b949e]">Reviews Given</span>
                 </div>
            </div>
        </div>
    </div>
</div>
