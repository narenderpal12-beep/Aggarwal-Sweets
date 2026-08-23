---
name: Admin logo uploads
description: Requirements for reliably persisting logos uploaded from the admin settings page.
---

Logo images are converted to Base64 data URLs in the browser and saved through the settings API. Keep the API JSON body limit large enough for normal image uploads, and update the preview only after the save response succeeds.

**Why:** Express defaults to a 100 KB JSON limit. Normal JPEG uploads exceeded that limit, returned HTTP 413, and the UI previously showed a temporary preview despite the failed save.

**How to apply:** Any setting that persists inline media must use a suitable request-body limit and surface a save error in the UI. Verify persistence by reloading after an upload.