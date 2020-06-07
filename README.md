# CSRF protection with Cloudflare workers - an example

> :warning: This repository and the code within it is only for example and offered completely without warranty. It should not be relied upon for your own implementation. You must review your own implementation and seek input from a security professional

This repository demonstrates how to configure Cloudflare workers and Cloudflare KV to implement CSRF protection at the edge using antiforgery tokens.

## How it works

1. The user is assigned two cookies on their first GET request by the Cloudflare worker:

   - userId
   - csrfToken

2. The worker also stores a unique secret for that user in KV

3. On POST/PUT/PATCH/DELETE requests, the Cloudflare worker checks for the csrfToken in a header* (not the cookie), and verifies it using the secret stored in KV

4. The request is allowed to proceed if the token is valid. Otherwise, an error response is returned

* We put the token in a header to make sure the token value has only been read by our origin. In older browsers that don't support SameSite fully, they might send the cookie along with any request. By checking a header instead, we can be sure that the request came from our origin because browsers do guarantee that only the cookie's origin can read the cookie value (this is the same origin policy)

## Other protections

Other mechanisms are available to defend against CSRF, but not all are completely effective:

- **SameSite cookies** - these are effective for browsers that support them. Older browsers do not, so you can't guarantee that those old browsers won't send up your cookies. If you don't need to support older browsers (say you're happy to block them), then you could just use SameSite cookies

- **CORS** - By using CORS, you are relaxing the single-origin policy in browsers. It does not provide additional protection. Browsers will perform pre-flight checks on non-simple requests to verify that the target domain allows calls from the domain in the browser. This normally isn't allowed - configuring CORS allows this to happen. It doesn't particularly defend against CSRF - simple requests (for example, from a standard form submit) don't trigger pre-flight requests

- **Checking the referer header** - this can be used, but is often supressed by browsers and client-side proxies, and is not intended to be relied upon for security

- **Check the origin header** - is not intended to be relied upon for security
  
## Performance

Quick manual performance test in Chrome with cache disabled. Measurements taken from network tab in devtools.

| Test                                           |     |     |     |     |    |    |     |     |    |    | Average (ms) | Delta (ms) |
|------------------------------------------------|-----|-----|-----|-----|----|----|-----|-----|----|----|--------------|------------|
| GET with worker disabled                       | 39  | 41  | 40  | 41  | 33 | 35 | 41  | 45  | 34 | 29 | 37.8         |            |
| GET for new users (setting cookies)            | 101 | 92  | 85  | 79  | 96 | 84 | 78  | 106 | 73 | 81 | 87.5         | +49.7      |
| GET for existing user (checking cookie exists) | 52  | 53  | 45  | 80  | 57 | 53 | 39  | 92  | 37 | 40 | 54.8         | +17        |
| POST with worker disabled                      | 123 | 133 | 88  | 59  | 46 | 58 | 145 | 45  | 45 | 37 | 77.9         |            |
| POST verifying cookie                          | 63  | 174 | 175 | 163 | 59 | 64 | 151 | 64  | 95 | 62 | 107          | +29.1      |
