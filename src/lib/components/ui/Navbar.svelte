<script lang="ts">
	import { page } from '$app/stores';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { slide, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let isMenuOpen = false;
	let isProfileOpen = false;

	$: user = $page.data.user;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
		if (isMenuOpen) isProfileOpen = false;
	}

	function toggleProfile() {
		isProfileOpen = !isProfileOpen;
		if (isProfileOpen) isMenuOpen = false;
	}

	function closeMenus() {
		isMenuOpen = false;
		isProfileOpen = false;
	}

	async function handleSignOut() {
		await authClient.signOut();
		closeMenus();
		goto('/signin');
	}

	function clickOutside(node: HTMLElement) {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
				node.dispatchEvent(new CustomEvent('click_outside', { detail: node }));
			}
		};
		document.addEventListener('click', handleClick, true);
		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}
</script>

<nav
	class="fixed top-6 left-1/2 z-50 w-[95%] max-w-5xl -translate-x-1/2 transform transition-all duration-300"
	use:clickOutside
	on:click_outside={closeMenus}
>
	<div
		class="relative flex items-center justify-between rounded-full border border-white/10 bg-black/60 px-6 py-3 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all hover:border-white/20 hover:bg-black/70"
	>
		<!-- Logo -->
		<a href="/" class="flex items-center gap-3" on:click={closeMenus}>
			<div
				class="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30"
			>
				<span class="font-bold text-white">D</span>
			</div>
			<span class="text-lg font-bold tracking-tight text-white/90">DevCompass</span>
		</a>

		<!-- Desktop Nav -->
		<div class="hidden items-center gap-1 md:flex">
			{#each ['Home', 'Dashboard', 'Explore'] as item}
				<a
					href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
					class="group relative rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
				>
					{#if $page.url.pathname === (item === 'Home' ? '/' : `/${item.toLowerCase()}`)}
						<div
							class="absolute inset-0 -z-10 rounded-full bg-white/10"
							transition:fade={{ duration: 200 }}
						></div>
					{/if}
					<span class="relative z-10">{item}</span>
					<div
						class="absolute inset-0 -z-10 scale-95 rounded-full bg-white/5 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
					></div>
				</a>
			{/each}
		</div>

		<!-- Right Side (Auth) -->
		<div class="hidden items-center gap-4 md:flex">
			{#if user}
				<div class="relative">
					<button
						on:click={toggleProfile}
						class="flex items-center gap-3 rounded-full border border-white/5 bg-white/5 py-1.5 pr-4 pl-2 transition-all hover:border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
					>
						{#if user.image}
							<img src={user.image} alt="Profile" class="h-7 w-7 rounded-full object-cover" />
						{:else}
							<div
								class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white"
							>
								{user.name?.charAt(0) || 'U'}
							</div>
						{/if}
						<span class="max-w-[100px] truncate text-xs font-medium text-zinc-300">{user.name}</span
						>
					</button>

					{#if isProfileOpen}
						<div
							transition:slide={{ duration: 200, axis: 'y' }}
							class="absolute right-0 mt-3 w-56 transform overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 p-1 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl"
						>
							<div class="mb-1 border-b border-white/5 px-3 py-2 text-xs text-zinc-500">
								<p class="truncate font-medium text-zinc-300">{user.name}</p>
								<p class="truncate">{user.email}</p>
							</div>

							<a
								href="/dashboard"
								class="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
								on:click={closeMenus}>Dashboard</a
							>
							<a
								href="/settings"
								class="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
								on:click={closeMenus}>Settings</a
							>
							<button
								on:click={handleSignOut}
								class="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
								>Sign out</button
							>
						</div>
					{/if}
				</div>
			{:else}
				<a
					href="/signin"
					class="text-sm font-medium text-zinc-400 transition-colors hover:text-white">Sign In</a
				>
				<a
					href="/signup"
					class="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-transform hover:scale-105 hover:shadow-lg hover:shadow-white/20 active:scale-95"
				>
					Sign Up
				</a>
			{/if}
		</div>

		<!-- Mobile Menu Button -->
		<button class="text-zinc-400 hover:text-white md:hidden" on:click={toggleMenu}>
			<span class="sr-only">Open menu</span>
			{#if isMenuOpen}
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"
					></line></svg
				>
			{:else}
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"
					></line><line x1="3" y1="18" x2="21" y2="18"></line></svg
				>
			{/if}
		</button>
	</div>

	<!-- Mobile Menu Dropdown -->
	{#if isMenuOpen}
		<div
			transition:slide={{ duration: 300, easing: cubicOut }}
			class="mt-2 overflow-hidden rounded-3xl border border-white/10 bg-black/80 p-4 shadow-2xl backdrop-blur-xl md:hidden"
		>
			<div class="flex flex-col space-y-1">
				{#each ['Home', 'Dashboard', 'Explore'] as item}
					<a
						href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
						class="rounded-xl px-4 py-3 text-base font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
						on:click={closeMenus}
					>
						{item}
					</a>
				{/each}
			</div>
			<div class="mt-4 border-t border-white/10 pt-4">
				{#if user}
					<div class="mb-4 flex items-center gap-3 px-2">
						{#if user.image}
							<img src={user.image} alt="" class="h-10 w-10 rounded-full" />
						{:else}
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white"
							>
								{user.name?.charAt(0)}
							</div>
						{/if}
						<div>
							<div class="font-medium text-white">{user.name}</div>
							<div class="text-sm text-zinc-500">{user.email}</div>
						</div>
					</div>
					<button
						on:click={handleSignOut}
						class="w-full rounded-xl bg-red-500/10 py-3 text-red-400 transition-colors hover:bg-red-500/20"
						>Sign Out</button
					>
				{:else}
					<div class="grid grid-cols-2 gap-3">
						<a
							href="/signin"
							class="flex items-center justify-center rounded-xl bg-white/5 py-3 text-zinc-300 transition-colors hover:bg-white/10"
							on:click={closeMenus}>Sign In</a
						>
						<a
							href="/signup"
							class="flex items-center justify-center rounded-xl bg-white py-3 font-medium text-black transition-colors hover:bg-zinc-200"
							on:click={closeMenus}>Sign Up</a
						>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<style>
	/* Make sure content doesn't jump */
	:global(body) {
		overflow-x: hidden;
	}
</style>
