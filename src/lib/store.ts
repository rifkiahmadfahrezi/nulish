import { useSyncExternalStore } from "react";

/** Minimal global state for UI that isn't persisted (save status, open panels, toasts). */
export function createStore<T>(initial: T) {
	let state = initial;
	const listeners = new Set<() => void>();
	const subscribe = (l: () => void) => {
		listeners.add(l);
		return () => listeners.delete(l);
	};
	const get = () => state;
	const set = (next: T | ((prev: T) => T)) => {
		state = typeof next === "function" ? (next as (prev: T) => T)(state) : next;
		for (const l of listeners) l();
	};
	const use = () => useSyncExternalStore(subscribe, get);
	return { get, set, use, subscribe };
}
