import { nip19 } from '@nostr-dev-kit/ndk';

/**
 * Result of decoding a nevent NIP-19 identifier
 */
export interface NeventResult {
	/** The event ID (hex) */
	eventId: string;
	/** Optional relay hint */
	relay?: string;
	/** Optional author pubkey (hex) */
	author?: string;
	/** Optional event kind */
	kind?: number;
}

/**
 * Decodes a nevent NIP-19 identifier
 *
 * @param nevent - The nevent string to decode (e.g., "nevent1...")
 * @returns Decoded data or null if invalid
 *
 * @example
 * ```ts
 * const result = decodeNevent('nevent1qqsxxx...');
 * if (result) {
 *   console.log(result.eventId); // hex event ID
 *   console.log(result.relay);   // optional relay hint
 * }
 * ```
 */
export function decodeNevent(nevent: string): NeventResult | null {
	try {
		const decoded = nip19.decode(nevent);

		if (decoded.type === 'nevent') {
			return {
				eventId: decoded.data.id,
				relay: decoded.data.relays?.[0],
				author: decoded.data.author,
				kind: decoded.data.kind
			};
		}

		// Also support note identifiers (just event ID)
		if (decoded.type === 'note') {
			return {
				eventId: decoded.data
			};
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Encodes an event ID to nevent format
 *
 * @param eventId - The event ID (hex)
 * @param relay - Optional relay hint
 * @param author - Optional author pubkey (hex)
 * @param kind - Optional event kind
 * @returns The nevent string
 */
export function encodeNevent(
	eventId: string,
	relay?: string,
	author?: string,
	kind?: number
): string {
	return nip19.neventEncode({
		id: eventId,
		relays: relay ? [relay] : undefined,
		author,
		kind
	});
}
