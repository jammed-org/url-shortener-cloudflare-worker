import { Router, Route, Request } from "itty-router"

type MethodType = "GET" | "POST"
interface IRequest extends Request {
  method: MethodType
  url: string
  optional?: string
}

interface IMethods {
  get: Route
  post: Route
}

export interface Env {
  URLS: KVNamespace
  URLS_ADDED: KVNamespace

  CREATE_SECRET_KEY: string
}

const router = Router<IRequest, IMethods>()

class ShortUrl {
  constructor(private readonly request: IRequest, private readonly env: Env) {}

  async get() {
    if (!this.request.params || !this.request.params.shortCode) {
      return new Response("No short url provided", { status: 400 })
    }

    const foundUrl = await this.env.URLS.get(this.request.params.shortCode)
    if (foundUrl) {
      return Response.redirect(foundUrl)
    } else {
      return new Response("Short url not found", { status: 404 })
    }
  }

  async create() {
    const cleanedUrl = await this.cleanLongUrl()
    const urlAlreadyAdded = await this.env.URLS_ADDED.get(cleanedUrl)

    if (urlAlreadyAdded) {
      return new Response(urlAlreadyAdded)
    } else {
      const record = await this.addNewRecord(this.env, cleanedUrl)
      return new Response(record)
    }
  }

  private async pickRandomUnusedShortCode(): Promise<string> {
    const shortCode = Math.random().toString(30).substr(2, 7)
    const foundUrl = await this.env.URLS.get(shortCode)
    if (foundUrl) {
      return this.pickRandomUnusedShortCode()
    } else {
      return shortCode
    }
  }

  private async addNewRecord(env: Env, cleanedUrl: string) {
    const record = await this.pickRandomUnusedShortCode()
    await env.URLS_ADDED.put(cleanedUrl, record)
    await env.URLS.put(record, cleanedUrl)

    return record
  }

  private async cleanLongUrl() {
    if (!this.request || !this.request.text) {
      throw new Error("No text provided")
    }

    const neededURL: string = await this.request.text()

    if (!neededURL.match(/http:\/\//g) && !neededURL.match(/https:\/\//g)) {
      return "https://" + neededURL
    } else {
      return neededURL
    }
  }
}

async function handlePostRequest(request: IRequest, env: Env) {
  return new ShortUrl(request, env).create()
}

async function handleGetRequest(request: IRequest, env: Env) {
  return new ShortUrl(request, env).get()
}

function renderIndex() {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Jammed URL Shortener</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">
      </head>
      <body class="sans-serif hero is-fullheight">
        <section class="hero-body has-background-white-bis">
          <div class="container">
            <h1 class="title">Jammed URL Shortener</h1>
            <p class="subtitle">
              An open-source URL shortener built by the team behind <a href="https://jammed.app">Jammed</a>.
            </p>
            <p>The source code is licensed under MIT, and is available from <a href="https://github.com/jammed-org/url-shortener-cloudflare-worker">GitHub</a>.</p>
          </div>
        </section>
      </body>
    </html>`,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  )
}

router.get("/:shortCode", (request: IRequest, env: Env) => handleGetRequest(request, env))
router.post("/", (request: IRequest, env: Env) => handlePostRequest(request, env))

router.get("/", renderIndex)
router.get("/robots.txt", () => new Response("User-agent: *\nDisallow: /"))
router.get("/favicon.ico", () => new Response(null, { status: 204 }))

router.get("*", () => new Response("Not found", { status: 404 }))

export default {
  fetch: router.handle,
}
