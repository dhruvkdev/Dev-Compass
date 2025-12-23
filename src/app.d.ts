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

export { };
