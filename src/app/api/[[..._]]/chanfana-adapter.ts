import {
  OpenAPIHandler,
  type RouterOptions,
  type OpenAPIRouterType
} from 'chanfana'

// Problem: catch-all route like `[[...foo]]/route.ts` produces `?foo=xxx` in
// `req.url` while no `foo` in `req.searchParams`. Chanfana's
// `validateRequest` * parses `req.url` to find query and send to schema
// validation, where the extra `foo` makes schema invalid.
// Here define the route key, later remove it as a workaround.
const workaroundRouteKey = '_';
const removeQuery = (key: string, url: string) => {
  const newUrl = new URL(url);
  const params = new URLSearchParams(newUrl.search);
  params.delete(key);
  newUrl.search = params.toString();
  return newUrl.toString();
}

// Rework from
// https://github.com/cloudflare/chanfana/blob/3d3d036c31e5e76e05721c183a6df91951655567/src/adapters/hono.ts
// Chanfana `fromHono` is coupled with its `HonoOpenAPIHandler`,
// so here copy the whole file while only modify `getRequest` below:
export class HonoOpenAPIHandler extends OpenAPIHandler {
  getRequest(args: any[]) {
    const raw = args[0].req.raw;

    const dirty = new Proxy(raw, {
      get: (target: any, prop: string, ...args: any[]) => {
        if (prop === "url") {
          const url = Reflect.get(target, prop, ...args);
          return removeQuery(workaroundRouteKey, url);
        }

        return Reflect.get(target, prop, ...args);
      }
    })

    return dirty;
  }

  getUrlParams(args: any[]): Record<string, any> {
    const param = args[0].req.param();
    return param;
  }
}

// No change from upstream
export function fromHono<M>(
  router: M,
  options?: RouterOptions
): M & OpenAPIRouterType<M> & any {
  const openapiRouter = new HonoOpenAPIHandler(router, options)

  return new Proxy(router, {
    get: (target: any, prop: string, ...args: any[]) => {
      const _result = openapiRouter.handleCommonProxy(target, prop, ...args)
      if (_result !== undefined) {
        return _result
      }

      return (route: string, ...handlers: any[]) => {
        if (prop !== 'fetch') {
          if (handlers.length === 1 && handlers[0].isChanfana === true) {
            handlers = openapiRouter.registerNestedRouter({
              method: prop,
              path: route,
              nestedRouter: handlers[0],
            })
          } else if (openapiRouter.allowedMethods.includes(prop)) {
            handlers = openapiRouter.registerRoute({
              method: prop,
              path: route,
              handlers: handlers,
            })
          }
        }

        return Reflect.get(target, prop, ...args)(route, ...handlers)
      }
    },
  })
}
