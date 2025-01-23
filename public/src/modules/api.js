/* eslint-disable import/no-unresolved */

'use strict';

import { fire as fireHook } from 'hooks';
import { confirm } from 'bootbox';

const baseUrl = config.relative_path + '/api/v3';

async function call(options, callback) {
	options.url = options.url.startsWith('/api') ?
		config.relative_path + options.url :
		baseUrl + options.url;

	if (typeof callback === 'function') {
		xhr(options).then(result => callback(null, result), err => callback(err));
		return;
	}

	try {
		const result = await xhr(options);
		return result;
	} catch (err) {
		if (err.message === 'A valid login session was not found. Please log in and try again.') {
			const { url } = await fireHook('filter:admin.reauth', { url: 'login' });
			return confirm('[[error:api.reauth-required]]', (ok) => {
				if (ok) {
					ajaxify.go(url);
				}
			});
		}
		throw err;
	}
}

async function xhr(options) {
	// Normalize body based on type
	const url = options.url;
	delete options.url;

	if (options.data && !(options.data instanceof FormData)) {
		options.data = JSON.stringify(options.data || {});
		options.headers['content-type'] = 'application/json; charset=utf-8';
	}

	// Allow options to be modified by plugins, etc.
	const hookResult = await fireHook('filter:api.options', { options });
	options = hookResult.options;

	if (options.data) {
		options.body = options.data;
		delete options.data;
	}

	const res = await fetch(url, options);
	const { headers } = res;
	const contentType = headers.get('content-type');
	const isJSON = contentType && contentType.startsWith('application/json');

	if (!res.ok) {
		let errorMessage;
		if (isJSON) {
			const jsonResponse = await res.json();
			errorMessage = jsonResponse.status?.message || res.statusText;
		} else {
			errorMessage = await res.text();
		}
		throw new Error(errorMessage);
	}

	if (options.method !== 'HEAD') {
		return isJSON ? await res.json() : await res.text();
	}
}

export function get(route, data, onSuccess) {
	return call({
		url: route + (data && Object.keys(data).length ? ('?' + $.param(data)) : ''),
	}, onSuccess);
}

export function head(route, data, onSuccess) {
	return call({
		url: route + (data && Object.keys(data).length ? ('?' + $.param(data)) : ''),
		method: 'HEAD',
	}, onSuccess);
}

export function post(route, data, onSuccess) {
	return call({
		url: route,
		method: 'POST',
		data,
		headers: {
			'x-csrf-token': config.csrf_token,
		},
	}, onSuccess);
}

export function patch(route, data, onSuccess) {
	return call({
		url: route,
		method: 'PATCH',
		data,
		headers: {
			'x-csrf-token': config.csrf_token,
		},
	}, onSuccess);
}

export function put(route, data, onSuccess) {
	return call({
		url: route,
		method: 'PUT',
		data,
		headers: {
			'x-csrf-token': config.csrf_token,
		},
	}, onSuccess);
}

export function del(route, data, onSuccess) {
	return call({
		url: route,
		method: 'DELETE',
		data,
		headers: {
			'x-csrf-token': config.csrf_token,
		},
	}, onSuccess);
}
