# http-allow-header-parse

Parses the value of an HTTP `Allow` header into a `Set` of permitted methods, validated against the standard HTTP method registry.

```js
import { parseAllowHeader, ALLOWED_METHODS, isAllowedMethod } from 'http-allow-header-parse';

const allowed = parseAllowHeader('GET, POST; q=1, OPTIONS,, WAT');
// Set { 'GET', 'POST', 'OPTIONS' }

isAllowedMethod('PATCH'); // true
isAllowedMethod('get');    // false
```

## Why this exists

The `Allow` header advertises which methods a resource supports, but the raw header value is a comma-separated list carrying optional whitespace, empty elements, and generic parameters (`;token=value`). Hand-rolling a splitter that handles all of those correctly is tedious and easy to get wrong. This library does that one job and nothing else.

The trade-off: methods are validated against a fixed set (the nine registered in RFC 9110). Unknown tokens are silently dropped rather than surfaced, and the parser never throws. If you need to know whether a token was rejected, use `isAllowedMethod` on the raw elements yourself.

## Edge you will hit

Methods are matched case-sensitively. RFC 9110 requires method tokens to be uppercase, so `get` is not recognized — only `GET` is. A header that arrives lowercased (some intermediaries mangle case) will yield an empty set. This is intentional; silently uppercasing would hide a spec violation and could cause a caller to believe a non-conformant method is supported when the server will in fact reject it.
