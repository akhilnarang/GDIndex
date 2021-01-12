# GDIndex

Forked from [maple3142/GDIndex](https://github.com/maple3142/GDIndex)

Modified for my usage - trimmed down to only support lite mode with a slightly different UI

Everything is configurable using environment variables (mostly -- need to figure out how to deal with the namespaces too)

|Configuration|Environment Varible Name|
|---|---|
|Page title|`TITLE`|
|Default root folder id |`DEFAULT_ROOT_ID`|
|Client id |`CLIENT_ID`|
|Client secret|`CLIENT_SECRET`|
|Refresh token|`REFRESH_TOKEN`|
|Folder title|`FOLDER_TITLE`|

If you're using a service account, drop `CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN`.

Instead set `USE_SERVICE_ACCOUNT` to `true`, and set `SERVICE_ACCOUNT_JSON` (should be self-explanatory)

There may be issues

(Folder title is what is prefixed to the folder name on its page)

You can set the the above as well as `CF_ACCOUNT_ID`, `CF_API_TOKEN` as secrets in the github repository, for auto deploying on a push to the repo. You will require  `CF_ZONE_ID` as well if you're deploying to your own domain and not a workers.dev domain, which will also require you to set `workers_dev` to `false` in `wrangler.toml`, and set `route` to your domain.

(Go set the encrypted secrets manually once, since the wrangler action first tries to publish the worker and then set the secrets, and the worker can't be published before the secrets exist)

Create a namespace named `sa` with `wrangler kv:namespace create sa` and update the `wrangler.toml` based on the output it gives you