# Cloudflare Worker & KV link shortener

This is a worker script that uses Cloudflare Workers KV to store links and redirect to them.

It allows you to create a short link service, fully on Cloudflare workers to change long links into short ones. At [Jammed](https://jammed.app) we use it to create short links for our users in booking SMS reminders and emails. Because the worker is fully on Cloudflare, it's fast and reliable and we don't have to worry about using a third party service that might be taken offline, down or slow.

It's also free!

## Setup

1. Create a Cloudflare account
1. [Setup wrangler CLI](https://developers.cloudflare.com/workers/wrangler/get-started/)
1. Create a secrtet key for your worker, to only allow POST requests from you
    ```bash
    wrangler secret put CREATE_SECRET_KEY
    ```
1. Set up two production KV namespaces, and thwo development KV namespaces:
    ```bash
    wrangler kv:namespace create "URLS"
    wrangler kv:namespace create "URLS" --preview
    wrangler kv:namespace create "URLS_ADDED"
    wrangler kv:namespace create "URLS_ADDED" --preview
    ```
    Add all the binding IDs to your wrangler.toml file in the `kv_namespaces` array.
1. Add your Cloudflare zone ID to your wrangler.toml file, along with your chosen domain
1. Then publish your worker:
    ```bash
    wrangler publish
    ```
1. Cloudflare should add the worker to your domain, and bind the DNS records to it for you

## Usage

- POST to your worker with the `CREATE_SECRET_KEY` header and a `url` parameter to create a new short link
- GET the short link to be redirected to the original URL

### Create a new short link

Send a POST request to the endpoint with your secret key as bearer auth in the header.
The short code is returned as text in the response body.

```bash

$ curl https://short.io
  -H "Accept: application/text"
  -H "Authorization: Bearer {CREATE_SECRET_KEY}"
  -d "https://example.com"

d93i4q
```

### Short link redirect

Send a GET request to the endpoint with the short code as the path.

```bash
$ curl -v  https://short.io/d93i4q

...
< HTTP/2 302
< location: https://example.com
< server: cloudflare
...
```

### Links created are stored in KV, and will be unique

Sending a POST request with the same URL will return the same short code. This reverse mapping is stored in the `URLS_ADDED` KV namespace.

```bash
$ curl https://short.io
  -H "Accept: application/text"
  -H "Authorization: Bearer {CREATE_SECRET_KEY}"
  -d "https://example.com"

d93i4q
```

# Roadmap

- [x] Simple redirect service and POST endpoint to create new short links
- [x] Simple html page for visitors to index of the service
- [x] robots.txt
- [ ] Add Jest tests
- [ ] Add a way to delete links
- [ ] Add Cloudflare Analytics metadata to links, like expiry date, number of clicks, etc
- [ ] Add a way to create vanity links

# License

MIT

# Author

[Jammed.app](https://jammed.app) online booking sofware for studios - 2022

# Contributors

- [Andy Callaghan](https://andycallaghan.com)

# Contributing

Contributions are welcome! Please open an issue or PR.
