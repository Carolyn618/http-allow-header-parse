import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseAllowHeader, ALLOWED_METHODS, isAllowedMethod } from '../src/index.js';

test('parseAllowHeader returns an empty set for a null header', () => {
  assert.deepEqual(parseAllowHeader(null), new Set());
});

test('parseAllowHeader returns an empty set for an undefined header', () => {
  assert.deepEqual(parseAllowHeader(undefined), new Set());
});

test('parseAllowHeader returns an empty set for a non-string header', () => {
  assert.deepEqual(parseAllowHeader(42), new Set());
});

test('parseAllowHeader parses a single method', () => {
  assert.deepEqual(parseAllowHeader('GET'), new Set(['GET']));
});

test('parseAllowHeader parses multiple comma-separated methods', () => {
  assert.deepEqual(
    parseAllowHeader('GET, POST, HEAD'),
    new Set(['GET', 'POST', 'HEAD']),
  );
});

test('parseAllowHeader trims optional whitespace around methods', () => {
  assert.deepEqual(
    parseAllowHeader('  GET  ,\tPOST\t, HEAD '),
    new Set(['GET', 'POST', 'HEAD']),
  );
});

test('parseAllowHeader ignores empty list elements', () => {
  assert.deepEqual(
    parseAllowHeader('GET,,HEAD,,'),
    new Set(['GET', 'HEAD']),
  );
});

test('parseAllowHeader silently strips parameters from an element', () => {
  assert.deepEqual(
    parseAllowHeader('GET; foo=bar, HEAD'),
    new Set(['GET', 'HEAD']),
  );
});

test('parseAllowHeader strips parameters separated by whitespace', () => {
  assert.deepEqual(
    parseAllowHeader('GET foo, HEAD'),
    new Set(['GET', 'HEAD']),
  );
});

test('parseAllowHeader drops unknown method tokens', () => {
  assert.deepEqual(
    parseAllowHeader('GET, WAT, HEAD'),
    new Set(['GET', 'HEAD']),
  );
});

test('parseAllowHeader is case-sensitive and rejects lowercase methods', () => {
  assert.deepEqual(parseAllowHeader('get, post'), new Set());
});

test('parseAllowHeader returns a deduplicated set', () => {
  assert.deepEqual(
    parseAllowHeader('GET, GET, GET'),
    new Set(['GET']),
  );
});

test('isAllowedMethod returns true for a registered method', () => {
  assert.equal(isAllowedMethod('PATCH'), true);
});

test('isAllowedMethod returns false for an unknown method', () => {
  assert.equal(isAllowedMethod('LINK'), false);
});

test('isAllowedMethod returns false for a lowercase method', () => {
  assert.equal(isAllowedMethod('get'), false);
});

test('ALLOWED_METHODS contains exactly the standard registry methods', () => {
  assert.deepEqual(
    [...ALLOWED_METHODS].sort(),
    ['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE'],
  );
});
