// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: typeof import('$lib/server/auth').auth.$Infer.Session.user | null;
			session: typeof import('$lib/server/auth').auth.$Infer.Session.session | null;
		}

		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare global {
	namespace svelteHTML {
		interface HTMLAttributes<T> {
			'on:click_outside'?: (event: CustomEvent) => void;
		}
	}
}

declare module '*.svelte' {
  import type { SvelteComponentTyped } from 'svelte';

  export default class Component<
    Props = {},
    Events = {},
    Slots = {}
  > extends SvelteComponentTyped<Props, Events, Slots> {}
}

export { };
