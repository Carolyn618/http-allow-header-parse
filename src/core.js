/**
 * Set of HTTP methods recognized by RFC 7231 and the IANA HTTP Method Registry
 * as of the connect/patch/delete entries. Listed in RFC 9110 §9 and registered.
 *
 * We validate against a static set rather than allowing arbitrary tokens because
 * the Allow header's purpose is to communicate capabilities to a generic client.
 * A method the client has never heard of provides no actionable information, and
 * permitting it would let a malformed or hostile header pollute the caller's
 * decision-making with garbage tokens.
 */
export const ALLOWED_METHODS = Object.freeze(new Set([
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'CONNECT',
  'OPTIONS',
  'TRACE',
  'PATCH',
]));

/**
 * True when `method` is one of the standard registered HTTP methods.
 *
 * Case-sensitive on purpose: RFC 9110 §16.1 requires method tokens to be
 * uppercase in headers. Accepting lowercase would hide a spec violation from
 * the caller and produce a set containing tokens that will never match a real
 * request method (request lines are also case-sensitive for the method token).
 */
export function isAllowedMethod(method) {
  return typeof method === 'string' && ALLOWED_METHODS.has(method);
}

/**
 * Parse the value of an HTTP Allow header into the set of methods it advertises.
 *
 * The header grammar (RFC 9110 §10.2.1, §5.6.1, §5.6.2) is a comma-separated
 * list of method tokens, each optionally surrounded by optional whitespace
 * (OWS) and optionally followed by arbitrary `parameters` of the form
 * `;token=quoted-string`.
 *
 * Design decisions, stated plainly so callers know exactly what they get:
 *
 * 1. Methods are case-sensitive. Only uppercase tokens are recognized.
 * 2. Parameters are silently stripped. The Allow header carries no parameters
 *    defined by the standard, but the list grammar permits them generically, so
 *    a conformant parser must tolerate `GET; foo=bar` rather than rejecting the
 *    header outright. We strip and discard rather than throw, because throwing
 *    on a syntactically valid-but-unused parameter would make the library
 *    brittle against intermediaries that decorate headers.
 * 3. Empty elements (e.g. `GET,,HEAD`) are ignored, matching the lenient list
 *    production in §5.6.1. The caller does not learn that the header was
 *    malformed; if that matters, inspect the raw string yourself.
 * 4. Unknown methods are dropped from the result. `isAllowedMethod` is
 *    available for callers who need to know whether a specific token was
 *    rejected.
 *
 * @param {string|null|undefined} header - raw Allow header value.
 * @returns {Set<string>} the permitted standard methods, uppercased.
 */
export function parseAllowHeader(header) {
  const result = new Set();

  if (typeof header !== 'string') {
    return result;
  }

  // RFC 9110 list elements are separated by commas. A leading, trailing, or
  // doubled comma yields an empty element, which the grammar explicitly permits.
  const elements = header.split(',');

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    // OWS is SP (0x20) or HTAB (0x09). Strip leading and trailing whitespace
    // before extracting the method token; anything after the first non-OWS
    // whitespace or semicolon is treated as a parameter and discarded per the
    // decision above.
    const trimmed = element.replace(/^[ \t]+|[ \t]+$/g, '');
    if (trimmed === '') {
      continue;
    }

    // The token ends at the first whitespace or semicolon. Both are legal
    // separators between a method and its parameters in the element grammar.
    const stop = trimmed.search(/[ \t;]/);
    const token = stop === -1 ? trimmed : trimmed.slice(0, stop);

    if (isAllowedMethod(token)) {
      result.add(token);
    }
  }

  return result;
}
