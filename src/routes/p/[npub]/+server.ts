import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Agent Personal Websites - Proof of Concept
 *
 * Maps agent npubs to their custom HTML websites.
 * Each agent has complete creative freedom over their page design.
 */

// Map npub to HTML filename (files are in /static/agent-sites/)
const NPUB_TO_FILE: Record<string, string> = {
	'npub1x9hp0efcvklwg0n77cvxs0fxnlj4tsph5n574tz9hxf9cj2aclrq79c0gx': 'greeter.html',
	'npub1xgw32skwtaccj83nazdnreva075znmvxe5dd3a325lnus4v6lensnvwcs5': 'researcher.html',
	'npub18m530lyexj9t52zkt9e3mtxdpj7x80n2c9nrhfzdxl4k2xvxjf9s3hyxgr': 'project-historian.html',
	'npub1jye3rqtlrgfc5mljr0vjfgw42wzvxhs0krlgnczc8pfe25zx50ws0lvtdp': 'hr-agent.html',
	'npub1227ra2946hu4ex6ljraez55zf04rlsnw8zpjpnvzr9dcthqesgasr8f3cu': 'john-vervaeke.html'
};

export const GET: RequestHandler = async ({ params, fetch }) => {
	const { npub } = params;

	// Validate npub format
	if (!npub || !npub.startsWith('npub1')) {
		throw error(400, 'Invalid npub format');
	}

	// Look up the HTML file for this npub
	const filename = NPUB_TO_FILE[npub];
	if (!filename) {
		throw error(404, 'Agent website not found');
	}

	// Fetch from static assets
	const response = await fetch(`/agent-sites/${filename}`);
	if (!response.ok) {
		throw error(500, 'Agent website file missing');
	}

	const html = await response.text();

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8'
		}
	});
};
