<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	
	let { 
		message = '', 
		type = 'info' as 'info' | 'warning' | 'success' | 'error', 
		duration = 5000, 
		onClose = (): void => {},
		actionLabel = '',
		onAction = (): void => {},
		title = '',
		progress = false
	} = $props();

	let visible = $state(true);
	let timeoutId: ReturnType<typeof setTimeout>;
	let progressWidth = $state(100);
	let startTime: number;
	// svelte-ignore state_referenced_locally
		let remainingTime = duration;
	let isPaused = $state(false);

	$effect(() => {
		if (visible && duration > 0) {
			startTimer();
		}

		return () => clearTimeout(timeoutId);
	});

	function startTimer() {
		startTime = Date.now();
		timeoutId = setTimeout(() => {
			close();
		}, remainingTime);
		
		if (progress) {
			startProgress();
		}
	}

	function startProgress() {
		const interval = setInterval(() => {
			if (!isPaused) {
				const elapsed = Date.now() - startTime;
				progressWidth = Math.max(0, 100 - (elapsed / remainingTime) * 100);
				
				if (progressWidth <= 0) {
					clearInterval(interval);
				}
			}
		}, 16);
	}

	function pauseTimer() {
		if (duration > 0) {
			isPaused = true;
			clearTimeout(timeoutId);
			remainingTime -= Date.now() - startTime;
		}
	}

	function resumeTimer() {
		if (duration > 0 && remainingTime > 0) {
			isPaused = false;
			startTimer();
		}
	}

	function close() {
		visible = false;
		setTimeout(() => onClose(), 200);
	}

	const icons: Record<string, { icon: string; gradient: string; glow: string }> = {
		info: { 
			icon: '✨', 
			gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
			glow: '0 0 20px rgba(59, 130, 246, 0.3)'
		},
		warning: { 
			icon: '⚠️', 
			gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
			glow: '0 0 20px rgba(245, 158, 11, 0.3)'
		},
		success: { 
			icon: '🎉', 
			gradient: 'linear-gradient(135deg, #10B981, #059669)',
			glow: '0 0 20px rgba(16, 185, 129, 0.3)'
		},
		error: { 
			icon: '🔥', 
			gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
			glow: '0 0 20px rgba(239, 68, 68, 0.3)'
		}
	};
</script>

{#if visible}
	<div 
		class="toast toast-{type}" 
		style="background: {icons[type].gradient}; box-shadow: {icons[type].glow}, 0 8px 32px rgba(0, 0, 0, 0.4);"
		onmouseenter={pauseTimer}
		onmouseleave={resumeTimer}
		role="alert"
		aria-live="polite"
		transition:slide={{ 
			duration: 400, 
			easing: cubicOut,
			axis: 'x'
		}}
	>
		{#if progress}
			<div class="toast-progress" style="width: {progressWidth}%; background: {icons[type].gradient};"></div>
		{/if}
		
		<div class="toast-icon-wrapper" style="background: {icons[type].gradient};">
			<span class="toast-icon">{icons[type].icon}</span>
		</div>
		
		<div class="toast-content">
			{#if title}
				<p class="toast-title">{title}</p>
			{/if}
			<p class="toast-message">{message}</p>
			{#if actionLabel}
				<button 
					class="toast-action" 
					onclick={() => {
						onAction();
						close();
					}}
				>
					<span class="action-text">{actionLabel}</span>
					<span class="action-arrow">→</span>
				</button>
			{/if}
		</div>
		
		<button 
			class="toast-close" 
			onclick={close} 
			aria-label="Close notification"
		>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
		</button>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		bottom: 24px;
		right: 24px;
		display: flex;
		align-items: flex-start;
		gap: 16px;
		padding: 20px;
		border-radius: 20px;
		min-width: 320px;
		max-width: 420px;
		z-index: 9999;
		backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		color: white;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		cursor: default;
		overflow: hidden;
	}

	.toast:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5) !important;
	}

	.toast-progress {
		position: absolute;
		top: 0;
		left: 0;
		height: 3px;
		opacity: 0.5;
		transition: width 0.1s linear;
	}

	.toast-icon-wrapper {
		width: 36px;
		height: 36px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.toast-icon {
		font-size: 1.25rem;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
	}

	.toast-content {
		flex: 1;
		min-width: 0;
	}

	.toast-title {
		margin: 0 0 4px 0;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.4;
		color: white;
		letter-spacing: -0.01em;
	}

	.toast-message {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		font-weight: 400;
		color: rgba(255, 255, 255, 0.9);
		letter-spacing: -0.01em;
	}

	.toast-action {
		margin-top: 12px;
		padding: 8px 16px 8px 16px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 40px;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		display: inline-flex;
		align-items: center;
		gap: 8px;
		backdrop-filter: blur(4px);
		letter-spacing: -0.01em;
	}

	.action-arrow {
		transition: transform 0.2s ease;
		opacity: 0.7;
	}

	.toast-action:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.4);
		transform: translateY(-1px);
	}

	.toast-action:hover .action-arrow {
		transform: translateX(4px);
		opacity: 1;
	}

	.toast-action:active {
		transform: translateY(0);
	}

	.toast-close {
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		padding: 8px;
		line-height: 1;
		flex-shrink: 0;
		transition: all 0.2s ease;
		border-radius: 12px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(4px);
	}

	.toast-close:hover {
		background: rgba(0, 0, 0, 0.3);
		color: white;
		border-color: rgba(255, 255, 255, 0.3);
		transform: scale(1.1);
	}

	.toast-close:active {
		transform: scale(0.95);
	}

	/* Custom animations for different toast types */
	.toast-info {
		animation: glowPulse 2s infinite;
	}

	@keyframes glowPulse {
		0%, 100% {
			box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4);
		}
		50% {
			box-shadow: 0 12px 48px rgba(59, 130, 246, 0.4), 0 8px 32px rgba(0, 0, 0, 0.4);
		}
	}
</style>