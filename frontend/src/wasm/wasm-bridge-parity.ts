// Compile-time guard: the desktop stub must stay compatible with the real
// wasm-bindgen bindings. Excluded from the desktop build (tsconfig "exclude");
// checked by `pnpm check:wasm` on web builds, where pkg/ is present. A rename or
// signature change in the regenerated bindings fails this check.
type RealMod = typeof import('./pkg/wasm_bridge.js')
type StubMod = typeof import('./wasm-bridge-stub')

type Assert<T extends true> = T
type Accepts<S, R> = S extends (...a: never[]) => unknown
	? R extends (...a: never[]) => unknown
		? Parameters<S> extends Parameters<R>
			? true
			: false
		: false
	: false

// Every value the stub exports still exists on the real module...
type _Keys = Assert<[keyof StubMod] extends [keyof RealMod] ? true : false>

// ...and the arguments the client passes (typed via the stub) are still accepted
// by the real bindings.
type _SendFile = Assert<Accepts<StubMod['send_file'], RealMod['send_file']>>
type _SendItems = Assert<Accepts<StubMod['send_items'], RealMod['send_items']>>
type _ReceiveFile = Assert<
	Accepts<StubMod['receive_file'], RealMod['receive_file']>
>
type _FetchMeta = Assert<
	Accepts<StubMod['fetch_ticket_metadata'], RealMod['fetch_ticket_metadata']>
>
type _VerifyRelays = Assert<
	Accepts<StubMod['verify_relays'], RealMod['verify_relays']>
>
type _RelayStatus = Assert<
	Accepts<StubMod['get_relay_status'], RealMod['get_relay_status']>
>
type _EventCb = Assert<
	Accepts<StubMod['set_event_callback'], RealMod['set_event_callback']>
>
