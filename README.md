# GDIndex

Forked from [maple3142/GDIndex](https://github.com/maple3142/GDIndex)

Modified for my usage - trimmed down to only support lite mode with a slightly different UI

Everything is configurable using environment variables

|Configuration|Environment Varible Name|
|---|---|
|Page title|`TITLE`|
|Default root folder id |`DEFAULT_ROOT_ID`|
|Client id |`CLIENT_ID`|
|Client secret|`CLIENT_SECRET`|
|Refresh token|`REFRESH_TOKEN`|
|Folder title|`FOLDER_TITLE`|

(Folder title is what is prefixed to the folder name on its page)

You can set the the above as well as `CF_ACCOUNT_ID`, `CF_ZONE_ID`, `CF_API_TOKEN` as secrets in the github repository, for auto deploying on a push to the repo

(Go set the encrypted secrets manually once, since the wrangler action first tries to publish the worker and then set the secrets, and the worker can't be published before the secrets exist)