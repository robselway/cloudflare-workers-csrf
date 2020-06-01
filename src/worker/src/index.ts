import * as Tokens from 'csrf'
import { uuid } from '@cfworker/uuid';
import { KVNamespace } from '@cloudflare/workers-types'

declare const CSRF_SECRETS: KVNamespace

addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(handleRequest(event.request))
})

// todo:
// - clean up worker code + terraform
// - unit tests
// - get rid of azure CDN in this example - not needed as we have cloudflare? Might need it for custom domain - not sure

async function handleRequest(request: Request) {

  const tokenCookieName = "__csrftoken"
  const userIdCookieName = "__csrfuid"
  const hoursUntilExpiry = 4
  
  const tokenFromCookie = GetCookie(request, tokenCookieName)
  const userIdFromCookie = GetCookie(request, userIdCookieName)

  if(request.method == "GET" && (tokenFromCookie == null || userIdFromCookie == null)) {

    let response = await fetch(request)
    response = new Response(response.body, response)

    let expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + hoursUntilExpiry);

    console.log("date", expiryDate)
    console.log("Time", expiryDate.getTime() / 1000)

    const userId = uuid()
    const cookieUid = `${userIdCookieName}=${userId};Expires=${expiryDate.toUTCString()};Path='/';HttpOnly;Secure;SameSite=Lax;`
    response.headers.append('Set-Cookie', cookieUid)

    const tokens = new Tokens();
    const secret = tokens.secretSync();
    const token = tokens.create(secret);

    await SaveSecret(userId, secret, expiryDate.getTime() / 1000)
    
    const cookieToken = `${tokenCookieName}=${token};Max-Age=${expiryDate.toUTCString()};Path='/';Secure;SameSite=Strict;`

    response.headers.append('Set-Cookie', cookieToken)
    
    return response
  }

  if(request.method == "POST" || request.method == "PUT" || request.method == "PATCH" || request.method == "DELETE") {
    
    if(userIdFromCookie == null) {
      return new Response("User id cookie not found");
    }

    if(tokenFromCookie == null) {
      return new Response("CSRF cookie not found");
    }

    // We check the header as the CSRF token cookie could be send my a third party in older browsers
    // The value of the cookie is safe thanks to the single-origin policy. It can only be read by our scripts, so we can check the correct value was passed into the header
    const headerToken = request.headers.get("__csrftoken")

    if(headerToken == null) {
      return new Response("CSRF header not found");
    }

    if(headerToken !== tokenFromCookie) {
      return new Response("CSRF tokens from header and cookie do not match");
    }

    const secret = await GetSecret(userIdFromCookie);

    if(secret == null) {
      return new Response("CSRF secret not found for user id");
    }

    const tokens = new Tokens();
    const isValid = tokens.verify(secret, headerToken);
    
    if(!isValid) {
      return new Response("CSRF token for user id is invalid");
    }
  }

  return await fetch(request)
}

async function SaveSecret(userId : string, secret : string, expiry: number) {
  await CSRF_SECRETS.put(userId, secret, { expiration: expiry })
}

async function GetSecret(userId : string) : Promise<string> {
  return await CSRF_SECRETS.get(userId)
  // return ""
}

function GetCookie(request : Request, name : string) : string {
  let result = null
  const cookieString = request.headers.get('Cookie')
  if (cookieString) {
    let cookies = cookieString.split(';')
    cookies.forEach(cookie => {
      let cookieName = cookie.split('=')[0].trim()
      if (cookieName === name) {
        let cookieVal = cookie.split('=')[1]
        result = cookieVal
      }
    })
  }
  return result
}
