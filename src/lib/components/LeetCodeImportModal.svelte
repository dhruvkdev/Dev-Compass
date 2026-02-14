<script lang="ts">
	let {
		open = false,
		onClose = () => {},
		onSuccess = () => {}
	} = $props();

	let step = $state<'instructions' | 'paste' | 'importing' | 'done'>('instructions');
	let pastedJson = $state('');
	let error = $state('');
	let importResult = $state<{ imported: number; total: number } | null>(null);

	const browserScript = `(async function() {
    let offset = 0, limit = 20, solved = new Set(), hasMore = true;

    let box = document.createElement('div');
    box.style.cssText = 'position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#1e293b,#0f172a);color:#e2e8f0;padding:16px 20px;z-index:9999;border-radius:12px;font-family:Inter,system-ui,sans-serif;font-size:14px;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);min-width:280px;';
    box.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><div style="width:8px;height:8px;background:#22c55e;border-radius:50%;animation:pulse 1.5s infinite"></div><span>Starting extraction...</span></div>';
    let style = document.createElement('style');
    style.textContent = '@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
    document.body.appendChild(box);

    while(hasMore) {
        try {
            let res = await fetch(\`/api/submissions/?offset=\${offset}&limit=\${limit}\`);
            if (res.status === 403) {
                box.innerHTML = '<div style="color:#fbbf24">⚠️ Rate limited — saving progress...</div>';
                break;
            }
            let data = await res.json();
            if(!data.submissions_dump || data.submissions_dump.length === 0) { hasMore = false; break; }
            data.submissions_dump.forEach(sub => { if(sub.status_display === "Accepted") solved.add(sub.title_slug); });
            box.innerHTML = \`<div style="display:flex;align-items:center;gap:8px;"><div style="width:8px;height:8px;background:#22c55e;border-radius:50%;animation:pulse 1.5s infinite"></div><span>Found <b>\${solved.size}</b> solved problems...</span></div>\`;
            offset += limit;
            await new Promise(r => setTimeout(r, 2500));
        } catch (err) { console.error(err); break; }
    }

    document.body.removeChild(box);
    let result = JSON.stringify(Array.from(solved));

    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;';

    let card = document.createElement('div');
    card.style.cssText = 'background:linear-gradient(135deg,#1e293b,#0f172a);padding:32px;border-radius:16px;max-width:460px;width:90%;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);';

    card.innerHTML = \`
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
            <div style="font-size:28px;">🎉</div>
            <div>
                <h3 style="margin:0;font-size:18px;font-weight:700;color:white;">Extraction Complete!</h3>
                <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">\${solved.size} unique solved problems found</p>
            </div>
        </div>
        <textarea id="dc-result" style="width:100%;height:80px;padding:10px;background:#0f172a;color:#a5f3fc;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-family:monospace;font-size:12px;resize:none;box-sizing:border-box;" readonly>\${result}</textarea>
        <div style="display:flex;gap:8px;margin-top:12px;">
            <button id="dc-copy" style="flex:1;padding:12px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;cursor:pointer;font-weight:700;border-radius:8px;font-size:15px;transition:all 0.2s;">📋 COPY TO CLIPBOARD</button>
            <button id="dc-close" style="padding:12px 16px;background:rgba(255,255,255,0.1);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);cursor:pointer;border-radius:8px;font-size:13px;transition:all 0.2s;">Close</button>
        </div>
    \`;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('dc-copy').onclick = () => {
        document.getElementById('dc-result').select();
        document.execCommand('copy');
        let btn = document.getElementById('dc-copy');
        btn.innerText = '✅ Copied!';
        btn.style.background = 'linear-gradient(135deg,#1e293b,#0f172a)';
        btn.style.border = '1px solid #10b981';
    };
    document.getElementById('dc-close').onclick = () => document.body.removeChild(overlay);
})();`;

	let copied = $state(false);
	let isClosing = $state(false);
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	// Auto-focus textarea when paste step is shown
	$effect(() => {
		if (open && step === 'paste') {
			setTimeout(() => textareaRef?.focus(), 150);
		}
	});

	// Handle escape key
	$effect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && open) handleClose();
		};
		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	});

	// Prevent body scroll when modal is open
	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	});

	function copyScript() {
		navigator.clipboard.writeText(browserScript);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function handleImport() {
		error = '';

		let slugs: string[];
		try {
			slugs = JSON.parse(pastedJson.trim());
			if (!Array.isArray(slugs)) throw new Error();
		} catch {
			error = 'Invalid JSON. Make sure you paste the full array, e.g. ["two-sum", "3sum", ...]';
			return;
		}

		if (slugs.length === 0) {
			error = 'The array is empty. No problems to import.';
			return;
		}

		step = 'importing';

		try {
			const res = await fetch('/api/leetcode/bulk-import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slugs })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Import failed';
				step = 'paste';
				return;
			}

			importResult = data;
			step = 'done';
			onSuccess();
		} catch {
			error = 'Network error. Please try again.';
			step = 'paste';
		}
	}

	function handleClose() {
		isClosing = true;
		setTimeout(() => {
			step = 'instructions';
			pastedJson = '';
			error = '';
			importResult = null;
			isClosing = false;
			onClose();
		}, 200);
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) handleClose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div 
		class="modal-overlay" 
		class:closing={isClosing}
		onclick={handleOverlayClick}
		role="presentation"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div 
			class="modal-card" 
			class:closing={isClosing}
			onclick={(e) => e.stopPropagation()} 
			role="presentation"
		>
			<!-- Header with gradient accent -->
			<div class="modal-header">
				<div class="header-glow"></div>
				<div class="header-icon-wrapper">
					<div class="header-icon">📥</div>
				</div>
				<div class="header-content">
					<h2 class="modal-title">Import LeetCode History</h2>
					<p class="modal-subtitle">Sync your solving history with Dev Compass</p>
				</div>
				<button class="close-btn" onclick={handleClose} aria-label="Close">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					</svg>
				</button>
			</div>

			<!-- Progress indicator -->
			<div class="progress-steps">
				<div class="progress-step" class:active={step === 'instructions'} class:completed={step !== 'instructions' && step !== 'paste'}>
					<div class="step-indicator">1</div>
					<span>Extract</span>
				</div>
				<div class="progress-line" class:active={step === 'paste' || step === 'importing' || step === 'done'}></div>
				<div class="progress-step" class:active={step === 'paste'} class:completed={step === 'importing' || step === 'done'}>
					<div class="step-indicator">2</div>
					<span>Paste</span>
				</div>
				<div class="progress-line" class:active={step === 'importing' || step === 'done'}></div>
				<div class="progress-step" class:active={step === 'importing'} class:completed={step === 'done'}>
					<div class="step-indicator">3</div>
					<span>Import</span>
				</div>
			</div>

			{#if step === 'instructions'}
				<div class="modal-body">
					<div class="steps-list">
						<div class="step-item">
							<div class="step-number">1</div>
							<div class="step-content">
								<p>Navigate to <a href="https://leetcode.com/progress" target="_blank" rel="noopener noreferrer">leetcode.com/progress</a> and ensure you're logged in</p>
							</div>
						</div>
						<div class="step-item">
							<div class="step-number">2</div>
							<div class="step-content">
								<p>Open DevTools (<kbd>F12</kbd> or <kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>I</kbd>) and click the <strong>Console</strong> tab</p>
							</div>
						</div>
						<div class="step-item">
							<div class="step-number">3</div>
							<div class="step-content">
								<p>Copy and paste the script below, then press <kbd>Enter</kbd> to run it</p>
							</div>
						</div>
						<div class="step-item">
							<div class="step-number">4</div>
							<div class="step-content">
								<p>Wait for extraction to complete, then click <span class="highlight">"COPY TO CLIPBOARD"</span> in the popup</p>
							</div>
						</div>
						<div class="step-item">
							<div class="step-number">5</div>
							<div class="step-content">
								<p>Return here and paste the JSON array</p>
							</div>
						</div>
					</div>

					<div class="script-container">
						<div class="script-header">
							<div class="script-label-group">
								<span class="script-label">Extraction Script</span>
								<span class="script-badge">JavaScript</span>
							</div>
							<button class="copy-btn" onclick={copyScript} class:copied>
								<span class="btn-content">
									{#if copied}
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M20 6L9 17L4 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
										Copied!
									{:else}
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor"/>
											<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor"/>
										</svg>
										Copy Script
									{/if}
								</span>
							</button>
						</div>
						<pre class="script-code"><code>{browserScript}</code></pre>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-secondary" onclick={handleClose}>Cancel</button>
					<button class="btn-primary" onclick={() => (step = 'paste')}>
						<span>I've copied the result</span>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
				</div>

			{:else if step === 'paste'}
				<div class="modal-body">
					<div class="paste-container">
						<label class="paste-label" for="paste-input">
							Paste the JSON array from the extraction script:
						</label>
						<div class="textarea-wrapper" class:error={!!error}>
							<textarea
								id="paste-input"
								bind:this={textareaRef}
								class="paste-textarea"
								bind:value={pastedJson}
								placeholder='["two-sum", "add-two-numbers", "3sum", ...]'
								rows="6"
								onkeydown={(e) => {
									if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && pastedJson.trim()) {
										handleImport();
									}
								}}
							></textarea>
							{#if pastedJson}
								<div class="textarea-stats">
									{(() => {
										try {
											const arr = JSON.parse(pastedJson);
											return Array.isArray(arr) ? `${arr.length} problems detected` : '';
										} catch {
											return '';
										}
									})()}
								</div>
							{/if}
						</div>
						{#if error}
							<div class="error-message">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10" stroke="currentColor"/>
									<path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-linecap="round"/>
								</svg>
								<span>{error}</span>
							</div>
						{/if}
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-secondary" onclick={() => (step = 'instructions')}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						Back
					</button>
					<button 
						class="btn-primary" 
						onclick={handleImport} 
						disabled={!pastedJson.trim()}
					>
						<span>Import Problems</span>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
				</div>

			{:else if step === 'importing'}
				<div class="modal-body loading-body">
					<div class="spinner-container">
						<div class="spinner"></div>
						<div class="spinner-glow"></div>
					</div>
					<div class="loading-content">
						<p class="loading-text">Importing your solved problems...</p>
						<p class="loading-subtext">This may take a moment</p>
					</div>
					<div class="loading-progress">
						<div class="progress-bar">
							<div class="progress-fill" style="width: 60%;"></div>
						</div>
					</div>
				</div>

			{:else if step === 'done'}
				<div class="modal-body done-body">
					<div class="success-animation">
						<div class="success-checkmark">
							<div class="check-icon">
								<span class="check-line line-tip"></span>
								<span class="check-line line-long"></span>
							</div>
						</div>
					</div>
					<h3 class="done-title">Import Successful!</h3>
					<div class="done-stats">
						<div class="stat-item">
							<span class="stat-value">{importResult?.imported}</span>
							<span class="stat-label">New problems</span>
						</div>
						<div class="stat-divider"></div>
						<div class="stat-item">
							<span class="stat-value">{importResult?.total}</span>
							<span class="stat-label">Total problems</span>
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-primary" onclick={handleClose}>
						<span>Done</span>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20 6L9 17L4 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: overlayFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.modal-overlay.closing {
		animation: overlayFadeOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.modal-card {
		background: #0f1420;
		border: 1px solid rgba(56, 189, 248, 0.15);
		border-radius: 24px;
		max-width: 620px;
		width: 90%;
		max-height: 85vh;
		overflow-y: auto;
		box-shadow: 
			0 25px 50px -12px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(56, 189, 248, 0.1) inset;
		color: #e2e8f0;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		position: relative;
		animation: cardSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.modal-card.closing {
		animation: cardSlideOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.modal-header {
		position: relative;
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 28px 28px 20px;
		border-bottom: 1px solid rgba(56, 189, 248, 0.1);
		overflow: hidden;
	}

	.header-glow {
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.08), transparent 70%);
		pointer-events: none;
	}

	.header-icon-wrapper {
		background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(14, 165, 233, 0.05));
		border-radius: 16px;
		padding: 10px;
		border: 1px solid rgba(56, 189, 248, 0.2);
	}

	.header-icon {
		font-size: 1.75rem;
		filter: drop-shadow(0 4px 8px rgba(56, 189, 248, 0.3));
	}

	.header-content {
		flex: 1;
	}

	.modal-title {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 700;
		background: linear-gradient(135deg, #fff, #94a3b8);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: -0.02em;
	}

	.modal-subtitle {
		margin: 4px 0 0;
		font-size: 0.85rem;
		color: #64748b;
	}

	.close-btn {
		margin-left: auto;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		color: #64748b;
		cursor: pointer;
		padding: 8px;
		border-radius: 12px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		color: white;
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(56, 189, 248, 0.3);
		transform: rotate(90deg);
	}

	/* Progress Steps */
	.progress-steps {
		display: flex;
		align-items: center;
		padding: 0 28px 20px;
		gap: 8px;
	}

	.progress-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		flex: 0 0 auto;
	}

	.progress-step span {
		font-size: 0.7rem;
		font-weight: 500;
		color: #475569;
		transition: color 0.2s ease;
	}

	.progress-step.active span {
		color: #38bdf8;
	}

	.progress-step.completed span {
		color: #10b981;
	}

	.step-indicator {
		width: 30px;
		height: 30px;
		border-radius: 30px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: 600;
		color: #64748b;
		transition: all 0.2s ease;
	}

	.progress-step.active .step-indicator {
		background: linear-gradient(135deg, #38bdf8, #0284c7);
		border-color: transparent;
		color: white;
		box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
	}

	.progress-step.completed .step-indicator {
		background: #10b981;
		border-color: transparent;
		color: white;
		position: relative;
	}

	.progress-step.completed .step-indicator::after {
		content: "✓";
		font-size: 1rem;
	}


	.progress-line {
		flex: 1;
		height: 2px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 2px;
		transition: background 0.3s ease;
	}

	.progress-line.active {
		background: linear-gradient(90deg, #38bdf8, #10b981);
	}

	.modal-body {
		padding: 20px 28px;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 20px 28px 28px;
		border-top: 1px solid rgba(56, 189, 248, 0.1);
	}

	/* Steps List */
	.steps-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-bottom: 24px;
	}

	.step-item {
		display: flex;
		align-items: flex-start;
		gap: 14px;
	}

	.step-number {
		width: 28px;
		height: 28px;
		border-radius: 28px;
		background: linear-gradient(135deg, #38bdf8, #0284c7);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: 700;
		flex-shrink: 0;
		box-shadow: 0 4px 8px rgba(56, 189, 248, 0.2);
	}

	.step-content p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
		color: #cbd5e1;
	}

	.step-content a {
		color: #38bdf8;
		text-decoration: none;
		font-weight: 500;
		border-bottom: 1px dashed rgba(56, 189, 248, 0.3);
	}

	.step-content a:hover {
		color: #7dd3fc;
		border-bottom-color: #38bdf8;
	}

	.step-content kbd {
		display: inline-block;
		padding: 2px 8px;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 6px;
		font-size: 0.75rem;
		font-family: 'SF Mono', 'Fira Code', monospace;
		color: #94a3b8;
		box-shadow: 0 2px 0 #0f172a;
	}

	.highlight {
		color: #38bdf8;
		font-weight: 600;
	}

	/* Script Container */
	.script-container {
		background: #0a0e17;
		border: 1px solid rgba(56, 189, 248, 0.15);
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
	}

	.script-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		background: rgba(56, 189, 248, 0.03);
		border-bottom: 1px solid rgba(56, 189, 248, 0.15);
	}

	.script-label-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.script-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.script-badge {
		font-size: 0.65rem;
		padding: 2px 6px;
		background: rgba(56, 189, 248, 0.1);
		border: 1px solid rgba(56, 189, 248, 0.2);
		border-radius: 4px;
		color: #38bdf8;
	}

	.copy-btn {
		padding: 6px 12px;
		background: transparent;
		color: #94a3b8;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.copy-btn:hover {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
		border-color: rgba(16, 185, 129, 0.3);
	}

	.copy-btn.copied {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
		border-color: rgba(16, 185, 129, 0.4);
	}

	.btn-content {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.script-code {
		margin: 0;
		padding: 16px;
		font-size: 0.75rem;
		line-height: 1.6;
		color: #a5f3fc;
		overflow-x: auto;
		max-height: 180px;
		overflow-y: auto;
		white-space: pre-wrap;
		word-break: break-all;
		font-family: 'SF Mono', 'Fira Code', monospace;
		background: #080c14;
	}

	/* Paste Container */
	.paste-container {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.paste-label {
		font-size: 0.9rem;
		font-weight: 500;
		color: #e2e8f0;
		display: block;
	}

	.textarea-wrapper {
		position: relative;
		border-radius: 12px;
		background: #0a0e17;
		border: 1px solid rgba(255, 255, 255, 0.08);
		transition: all 0.2s ease;
	}

	.textarea-wrapper:focus-within {
		border-color: #38bdf8;
		box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
	}

	.textarea-wrapper.error {
		border-color: #ef4444;
	}

	.paste-textarea {
		width: 100%;
		padding: 14px;
		background: transparent;
		color: #e2e8f0;
		border: none;
		border-radius: 12px;
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 0.85rem;
		resize: vertical;
		box-sizing: border-box;
	}

	.paste-textarea:focus {
		outline: none;
	}

	.textarea-stats {
		position: absolute;
		bottom: 8px;
		right: 12px;
		font-size: 0.65rem;
		color: #64748b;
		background: rgba(10, 14, 23, 0.8);
		padding: 2px 6px;
		border-radius: 4px;
		backdrop-filter: blur(4px);
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #f87171;
		font-size: 0.8rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 8px;
		padding: 8px 12px;
	}

	/* Loading State */
	.loading-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40px 28px;
		gap: 20px;
	}

	.spinner-container {
		position: relative;
		width: 60px;
		height: 60px;
	}

	.spinner {
		width: 60px;
		height: 60px;
		border: 3px solid transparent;
		border-top-color: #38bdf8;
		border-right-color: #38bdf8;
		border-radius: 50%;
		animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
		position: relative;
		z-index: 2;
	}

	.spinner-glow {
		position: absolute;
		top: -10px;
		left: -10px;
		right: -10px;
		bottom: -10px;
		background: radial-gradient(circle at center, rgba(56, 189, 248, 0.2), transparent 70%);
		border-radius: 50%;
		animation: pulseGlow 2s ease-in-out infinite;
	}

	.loading-content {
		text-align: center;
	}

	.loading-text {
		font-size: 1rem;
		font-weight: 600;
		color: white;
		margin: 0 0 4px;
	}

	.loading-subtext {
		font-size: 0.8rem;
		color: #64748b;
		margin: 0;
	}

	.loading-progress {
		width: 100%;
		max-width: 240px;
	}

	.progress-bar {
		height: 4px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #38bdf8, #10b981);
		border-radius: 4px;
		animation: progressPulse 1.5s ease-in-out infinite;
	}

	/* Done State */
	.done-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40px 28px;
		gap: 20px;
		text-align: center;
	}

	.success-animation {
		margin-bottom: 8px;
	}

	.success-checkmark {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: linear-gradient(135deg, #10b981, #059669);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
		animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.check-icon {
		width: 40px;
		height: 40px;
		position: relative;
	}

	.check-line {
		position: absolute;
		background: white;
		border-radius: 4px;
	}

	.line-tip {
		width: 12px;
		height: 4px;
		transform: rotate(45deg);
		top: 20px;
		left: 6px;
		animation: drawTip 0.3s ease 0.1s forwards;
		transform-origin: left;
	}

	.line-long {
		width: 24px;
		height: 4px;
		transform: rotate(-45deg);
		top: 18px;
		left: 12px;
		animation: drawLong 0.3s ease 0.2s forwards;
		transform-origin: left;
	}

	.done-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #fff, #94a3b8);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.done-stats {
		display: flex;
		align-items: center;
		gap: 24px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 20px;
		padding: 16px 24px;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 800;
		color: white;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.7rem;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-divider {
		width: 1px;
		height: 30px;
		background: rgba(255, 255, 255, 0.1);
	}

	/* Buttons */
	.btn-primary, .btn-secondary {
		padding: 10px 18px;
		border-radius: 12px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: none;
	}

	.btn-primary {
		background: linear-gradient(135deg, #38bdf8, #0284c7);
		color: white;
		box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(56, 189, 248, 0.4);
	}

	.btn-primary:active:not(:disabled) {
		transform: translateY(0);
	}

	.btn-primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.03);
		color: #94a3b8;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e2e8f0;
		border-color: rgba(255, 255, 255, 0.12);
	}

	/* Animations */
	@keyframes overlayFadeIn {
		from { opacity: 0; backdrop-filter: blur(0); }
		to { opacity: 1; backdrop-filter: blur(8px); }
	}

	@keyframes overlayFadeOut {
		from { opacity: 1; backdrop-filter: blur(8px); }
		to { opacity: 0; backdrop-filter: blur(0); }
	}

	@keyframes cardSlideIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@keyframes cardSlideOut {
		from {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
		to {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes pulseGlow {
		0%, 100% { opacity: 0.5; transform: scale(1); }
		50% { opacity: 0.8; transform: scale(1.1); }
	}

	@keyframes progressPulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes drawTip {
		from {
			width: 0;
			opacity: 0;
		}
		to {
			width: 12px;
			opacity: 1;
		}
	}

	@keyframes drawLong {
		from {
			width: 0;
			opacity: 0;
		}
		to {
			width: 24px;
			opacity: 1;
		}
	}

	/* Scrollbar Styling */
	.modal-card::-webkit-scrollbar {
		width: 6px;
	}

	.modal-card::-webkit-scrollbar-track {
		background: transparent;
	}

	.modal-card::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 6px;
	}

	.modal-card::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.script-code::-webkit-scrollbar {
		width: 4px;
		height: 4px;
	}

	.script-code::-webkit-scrollbar-thumb {
		background: rgba(56, 189, 248, 0.3);
		border-radius: 4px;
	}
</style>