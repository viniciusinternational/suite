import { defineCloudflareConfig } from "@opennextjs/cloudflare";
// Optional: R2 incremental cache for ISR/SSG/data cache
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  // Enable if you created the R2 binding in wrangler.jsonc
  incrementalCache: r2IncrementalCache,
});
