import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import { purgeCache } from "@opennextjs/cloudflare/overrides/cache-purge/index";

export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
    shouldLazilyUpdateOnCacheHit: false,
    bypassTagCacheOnCacheHit: false, // default: false
  }),
  queue: doQueue,
  tagCache: doShardedTagCache({
    baseShardSize: 12,
    regionalCache: true, // default: false
    regionalCacheTtlSec: 5,
    regionalCacheDangerouslyPersistMissingTags: false, // default: false
    shardReplication: {
      numberOfSoftReplicas: 4,
      numberOfHardReplicas: 2,
      // regionalReplication: {   // omit to disable, reduce DO usage
      //   defaultRegion: "apac",
      // },
    },
  }),
  enableCacheInterception: true,
  cachePurge: purgeCache({ type: "direct" }),
});
