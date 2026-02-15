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
	let scriptExpanded = $state(false);

	const browserScript = `(async function() {
    let offset = 0, limit = 20, solved = new Set(), hasMore = true;

    let box = document.createElement('div');
    box.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#18181b;color:#e4e4e7;padding:16px 20px;z-index:9999;border-radius:8px;font-family:system-ui,sans-serif;font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,0.3);border:1px solid #27272a;min-width:280px;';
    box.innerHTML = '<div>Extracting submissions...</div>';
    document.body.appendChild(box);

    while(hasMore) {
        try {
            let res = await fetch(\`/api/submissions/?offset=\${offset}&limit=\${limit}\`);
            if (res.status === 403) {
                box.innerHTML = '<div style="color:#f59e0b">Rate limited — saving progress</div>';
                break;
            }
            let data = await res.json();
            if(!data.submissions_dump || data.submissions_dump.length === 0) { hasMore = false; break; }
            data.submissions_dump.forEach(sub => { if(sub.status_display === "Accepted") solved.add(sub.title_slug); });
            box.innerHTML = \`<div>Found \${solved.size} solved problems</div>\`;
            offset += limit;
            await new Promise(r => setTimeout(r, 2500));
        } catch (err) { console.error(err); break; }
    }

    document.body.removeChild(box);
    let result = JSON.stringify(Array.from(solved));

    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;';

    let card = document.createElement('div');
    card.style.cssText = 'background:#18181b;padding:32px;border-radius:8px;max-width:460px;width:90%;color:#e4e4e7;font-family:system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:1px solid #27272a;';

    card.innerHTML = \`
        <div style="margin-bottom:16px;">
            <h3 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#fafafa;">Extraction Complete</h3>
            <p style="margin:0;font-size:13px;color:#a1a1aa;">\${solved.size} problems found</p>
        </div>
        <textarea id="dc-result" style="width:100%;height:80px;padding:10px;background:#09090b;color:#d4d4d8;border:1px solid #27272a;border-radius:6px;font-family:monospace;font-size:12px;resize:none;box-sizing:border-box;" readonly>\${result}</textarea>
        <div style="display:flex;gap:8px;margin-top:12px;">
            <button id="dc-copy" style="flex:1;padding:12px;background:#3b82f6;color:white;border:none;cursor:pointer;font-weight:600;border-radius:6px;font-size:14px;">Copy to clipboard</button>
            <button id="dc-close" style="padding:12px 16px;background:#27272a;color:#a1a1aa;border:none;cursor:pointer;border-radius:6px;font-size:14px;">Close</button>
        </div>
    \`;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('dc-copy').onclick = () => {
        document.getElementById('dc-result').select();
        document.execCommand('copy');
        let btn = document.getElementById('dc-copy');
        btn.innerText = 'Copied';
        btn.style.background = '#27272a';
    };
    document.getElementById('dc-close').onclick = () => document.body.removeChild(overlay);
})();`;

	let copied = $state(false);
	let isClosing = $state(false);
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	$effect(() => {
		if (open && step === 'paste') {
			setTimeout(() => textareaRef?.focus(), 150);
		}
	});

	$effect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && open) handleClose();
		};
		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	});

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
			error = 'Invalid JSON. Expected an array of problem slugs.';
			return;
		}

		if (slugs.length === 0) {
			error = 'Array is empty. No problems to import.';
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
			scriptExpanded = false;
			isClosing = false;
			onClose();
		}, 150);
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) handleClose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div 
		class="overlay" 
		class:closing={isClosing}
		onclick={handleOverlayClick}
		role="presentation"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div 
			class="modal" 
			class:closing={isClosing}
			onclick={(e) => e.stopPropagation()} 
			role="presentation"
		>
			<div class="header">
				<div class="header-content">
					<h2 class="title">Import LeetCode Submissions</h2>
					<p class="subtitle">Sync your submission history with Vector</p>
				</div>
				<button class="close-btn" onclick={handleClose} aria-label="Close">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6L18 18" stroke-linecap="round"/>
					</svg>
				</button>
			</div>

			<div class="progress">
				<div class="progress-step" class:active={step === 'instructions'} class:complete={step !== 'instructions'}>
					<div class="step-num">1</div>
					<span>Extract</span>
				</div>
				<div class="progress-line" class:active={step !== 'instructions'}></div>
				<div class="progress-step" class:active={step === 'paste'} class:complete={step === 'importing' || step === 'done'}>
					<div class="step-num">2</div>
					<span>Import</span>
				</div>
				<div class="progress-line" class:active={step === 'importing' || step === 'done'}></div>
				<div class="progress-step" class:active={step === 'importing'} class:complete={step === 'done'}>
					<div class="step-num">3</div>
					<span>Verify</span>
				</div>
			</div>

			{#if step === 'instructions'}
				<div class="body">
					<ol class="instructions">
						<li>
							Navigate to <a href="https://leetcode.com/progress" target="_blank" rel="noopener noreferrer">leetcode.com/progress</a> and log in
						</li>
						<li>
							Open DevTools (<kbd>F12</kbd> or <kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>I</kbd>) → Console tab
						</li>
						<li>
							Paste the extraction script below and press <kbd>Enter</kbd>
						</li>
						<li>
							Wait for extraction to complete, then copy the result
						</li>
						<li>
							Return here and paste the JSON array
						</li>
					</ol>

					<div class="script-section">
						<div class="script-toggle">
							<button 
								class="script-toggle-btn" 
								onclick={() => scriptExpanded = !scriptExpanded}
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.2s; transform: rotate({scriptExpanded ? '90deg' : '0deg'})">
									<path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<span>Extraction Script</span>
								<span class="badge">JavaScript</span>
							</button>
							<button class="copy-btn-inline" onclick={copyScript} class:copied>
								{copied ? 'Copied' : 'Copy'}
							</button>
						</div>

						{#if scriptExpanded}
							<pre class="script-code">{browserScript}</pre>
						{/if}
					</div>
				</div>
				<div class="footer">
					<button class="btn-secondary" onclick={handleClose}>Cancel</button>
					<button class="btn-primary" onclick={() => (step = 'paste')}>
						Continue to import
					</button>
				</div>

			{:else if step === 'paste'}
				<div class="body">
					<label class="label" for="paste-input">
						Paste the JSON array from the extraction
					</label>
					<div class="textarea-wrapper" class:error={!!error}>
						<textarea
							id="paste-input"
							bind:this={textareaRef}
							bind:value={pastedJson}
							placeholder='["two-sum", "add-two-numbers", "3sum", ...]'
							rows="8"
							onkeydown={(e) => {
								if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && pastedJson.trim()) {
									handleImport();
								}
							}}
						></textarea>
						{#if pastedJson}
							<div class="char-count">
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
						<div class="error-message">{error}</div>
					{/if}
				</div>
				<div class="footer">
					<button class="btn-secondary" onclick={() => (step = 'instructions')}>
						Back
					</button>
					<button 
						class="btn-primary" 
						onclick={handleImport} 
						disabled={!pastedJson.trim()}
					>
						Import {pastedJson.trim() ? `${(() => { try { const arr = JSON.parse(pastedJson); return Array.isArray(arr) ? arr.length : ''; } catch { return ''; } })()}` : ''} problems
					</button>
				</div>

			{:else if step === 'importing'}
				<div class="body loading">
					<div class="spinner"></div>
					<p class="loading-text">Importing submissions...</p>
					<p class="loading-subtext">This may take a moment</p>
				</div>

			{:else if step === 'done'}
				<div class="body success">
					<div class="success-icon">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20 6L9 17L4 12" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<h3 class="success-title">Import Complete</h3>
					<div class="stats">
						<div class="stat">
							<div class="stat-value">{importResult?.imported}</div>
							<div class="stat-label">New problems</div>
						</div>
						<div class="stat-divider"></div>
						<div class="stat">
							<div class="stat-value">{importResult?.total}</div>
							<div class="stat-label">Total synced</div>
						</div>
					</div>
				</div>
				<div class="footer">
					<button class="btn-primary" onclick={handleClose}>
						Done
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 0.15s ease-out;
	}

	.overlay.closing {
		animation: fadeOut 0.15s ease-out forwards;
	}

	.modal {
		background: #09090b;
		border: 1px solid #27272a;
		border-radius: 8px;
		max-width: 560px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		color: #fafafa;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		animation: slideIn 0.2s ease-out;
	}

	.modal.closing {
		animation: slideOut 0.15s ease-out forwards;
	}

	.header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 24px;
		border-bottom: 1px solid #27272a;
	}

	.header-content {
		flex: 1;
	}

	.title {
		margin: 0 0 4px;
		font-size: 18px;
		font-weight: 600;
		color: #fafafa;
		letter-spacing: -0.01em;
	}

	.subtitle {
		margin: 0;
		font-size: 14px;
		color: #71717a;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: #71717a;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: all 0.15s;
		display: flex;
		align-items: center;
		margin-left: 16px;
	}

	.close-btn:hover {
		color: #fafafa;
		background: #27272a;
	}

	.progress {
		display: flex;
		align-items: center;
		padding: 20px 24px;
		gap: 8px;
		border-bottom: 1px solid #27272a;
	}

	.progress-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		flex: 0 0 auto;
	}

	.progress-step span {
		font-size: 12px;
		font-weight: 500;
		color: #52525b;
		transition: color 0.2s;
	}

	.progress-step.active span {
		color: #fafafa;
	}

	.progress-step.complete span {
		color: #10b981;
	}

	.step-num {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #18181b;
		border: 1px solid #27272a;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		font-weight: 600;
		color: #71717a;
		transition: all 0.2s;
	}

	.progress-step.active .step-num {
		background: #52525b;
		border-color: #52525b;
		color: white;
	}

	.progress-step.complete .step-num {
		background: #10b981;
		border-color: #10b981;
		color: white;
	}

	.progress-line {
		flex: 1;
		height: 1px;
		background: #27272a;
		transition: background 0.2s;
	}

	.progress-line.active {
		background: #10b981;
	}

	.body {
		padding: 24px;
	}

	.body.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px 24px;
	}

	.body.success {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32px 24px;
	}

	.instructions {
		margin: 0 0 24px;
		padding-left: 20px;
		list-style: decimal;
		color: #d4d4d8;
		font-size: 14px;
		line-height: 1.6;
	}

	.instructions li {
		margin-bottom: 12px;
	}

	.instructions a {
		color: #a1a1aa;
		text-decoration: underline;
	}

	.instructions a:hover {
		text-decoration: underline;
	}

	.instructions kbd {
		display: inline-block;
		padding: 2px 6px;
		background: #18181b;
		border: 1px solid #27272a;
		border-radius: 4px;
		font-size: 12px;
		font-family: monospace;
		color: #a1a1aa;
	}

	.script-section {
		background: #0a0a0a;
		border: 1px solid #27272a;
		border-radius: 6px;
		overflow: hidden;
	}

	.script-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		justify-content: space-between;
	}

	.script-toggle-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: transparent;
		border: none;
		color: #d4d4d8;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		text-align: left;
		transition: color 0.15s;
		flex: 1;
	}

	.script-toggle-btn:hover {
		color: #fafafa;
	}

	.badge {
		font-size: 11px;
		padding: 2px 6px;
		background: #27272a;
		border-radius: 3px;
		color: #71717a;
		font-weight: 500;
	}

	.copy-btn-inline {
		margin-left: auto;
		padding: 4px 12px;
		background: #27272a;
		color: #a1a1aa;
		border: none;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.copy-btn-inline:hover {
		background: #3f3f46;
		color: #fafafa;
	}

	.copy-btn-inline.copied {
		background: #10b981;
		color: white;
	}

	.script-code {
		margin: 0;
		padding: 16px;
		font-size: 12px;
		line-height: 1.6;
		color: #a1a1aa;
		overflow-x: auto;
		max-height: 200px;
		overflow-y: auto;
		white-space: pre;
		font-family: 'SF Mono', 'Fira Code', monospace;
		background: #000;
		border-top: 1px solid #27272a;
	}

	.label {
		display: block;
		font-size: 14px;
		font-weight: 500;
		color: #e4e4e7;
		margin-bottom: 8px;
	}

	.textarea-wrapper {
		position: relative;
		border-radius: 6px;
		background: #0a0a0a;
		border: 1px solid #27272a;
		transition: all 0.15s;
	}

	.textarea-wrapper:focus-within {
		border-color: #52525b;
	}

	.textarea-wrapper.error {
		border-color: #ef4444;
	}

	textarea {
		width: 100%;
		padding: 12px;
		background: transparent;
		border: none;
		color: #fafafa;
		font-size: 13px;
		font-family: 'SF Mono', monospace;
		resize: vertical;
		outline: none;
	}

	textarea::placeholder {
		color: #52525b;
	}

	.char-count {
		padding: 8px 12px;
		font-size: 12px;
		color: #71717a;
		border-top: 1px solid #27272a;
	}

	.error-message {
		margin-top: 8px;
		padding: 12px;
		background: #450a0a;
		border: 1px solid #7f1d1d;
		border-radius: 6px;
		font-size: 13px;
		color: #fca5a5;
	}

	.footer {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 16px 24px;
		border-top: 1px solid #27272a;
	}

	.btn-secondary {
		padding: 8px 16px;
		background: transparent;
		color: #a1a1aa;
		border: 1px solid #27272a;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-secondary:hover {
		background: #18181b;
		color: #fafafa;
	}

	.btn-primary {
		padding: 8px 16px;
		background: #3f3f46;
		color: #fafafa;
		border: 1px solid #52525b;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-primary:hover:not(:disabled) {
		background: #52525b;
		border-color: #71717a;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 2px solid #27272a;
		border-top-color: #a1a1aa;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	.loading-text {
		margin: 16px 0 4px;
		font-size: 15px;
		font-weight: 500;
		color: #fafafa;
	}

	.loading-subtext {
		margin: 0;
		font-size: 13px;
		color: #71717a;
	}

	.success-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: #10b981;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		margin-bottom: 16px;
	}

	.success-title {
		margin: 0 0 24px;
		font-size: 18px;
		font-weight: 600;
		color: #fafafa;
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.stat-value {
		font-size: 32px;
		font-weight: 600;
		color: #fafafa;
	}

	.stat-label {
		font-size: 13px;
		color: #71717a;
	}

	.stat-divider {
		width: 1px;
		height: 48px;
		background: #27272a;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes fadeOut {
		from { opacity: 1; }
		to { opacity: 0; }
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slideOut {
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 0;
			transform: translateY(-8px);
		}
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>