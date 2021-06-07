// By default assume no SA
let properties = { use_sa: false, error: false }

// Try to detect SA, default to false again
try {
  properties['use_sa'] = USE_SERVICE_ACCOUNT == 'true'
} catch (e) {
  console.log('USE_SERVICE_ACCOUNT not defined, assuming false')
}

// Set properties to access without SA
if (!properties['use_sa']) {
  try {
    properties['client_id'] = CLIENT_ID
    properties['client_secret'] = CLIENT_SECRET
    properties['refresh_token'] = REFRESH_TOKEN
  } catch (e) {
    properties['error'] = true
    console.log("CLIENT_ID, CLIENT_SECRET, or REFRESH_TOKEN not defined. Ignoring for now")
  }
}
// Set default properties
try {
  properties['title'] = TITLE
  properties['folder_title'] = FOLDER_TITLE
  properties['default_root_id'] = DEFAULT_ROOT_ID
} catch (err) {
  properties['error'] = true
  console.log("TITLE, FOLDER_TITLE, or DEFAULT_ROOT_ID not defined. Ignoring for now")
}
import GoogleDrive from './gdrive'
const gd = new GoogleDrive(properties);

async function onGet(request) {
  let {
    pathname: path
  } = request;
  const rootId = request.searchParams.get('rootId') || properties.default_root_id;

  const result = await gd.getMetaByPath(decodeURIComponent(path), rootId);

  if (!result) {
    return new Response('null', {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 404
    });
  }

  const isGoogleApps = result.mimeType.includes('vnd.google-apps');

  if (!isGoogleApps) {
    const r = await gd.download(result.id, request.headers.get('Range'));
    const h = new Headers(r.headers);
    h.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(result.name)}`);
    return new Response(r.body, {
      status: r.status,
      headers: h
    });
  }
  return Response.redirect(`${request.url}/`, 302);
}

function encodePathComponent(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function handleRequest(request) {
  // Only allow GET requests
  if (request.method != 'GET') {
    return new Response('', { status: 405 });
  }

  // Allow first time startup without properties
  if (properties.error) {
    return new Response("Some properties aren't configured, allowed startup so that wrangler can set them", { status: 200 });
  }

  request = Object.assign({}, request, new URL(request.url));

  let path = request.pathname.split('/').map(decodeURIComponent).map(decodeURIComponent).join('/');
  if (path.endsWith('/')) {
    let parent = encodePathComponent(path.split('/').slice(0, -2).join('/') + '/');
    const {
      files
    } = await gd.listFolderByPath(path, properties.default_root_id);
    let fileht = `<table class="table">
      <tr>
      <th>Sr. No.</th>
      <th>File Name</th>
      <th>Size</th>
      </tr>
      `;

    let folderht = `<table class="table">
        <tr>
        <th>Sr. No.</th>
        <th>Folder Name</th>
        </tr>
        `;

    let filecount = 0;

    let foldercount = 0;

    for (const f of files) {
      const isf = f.mimeType === 'application/vnd.google-apps.folder';
      const p = encodePathComponent(path + f.name);
      if (isf) {
        if (f.name == '_h5ai') continue;
        foldercount++;
        folderht += `<tr><td>${foldercount}</td><td><a href="${p}">${f.name}</a></td></tr>`
        continue;
      }
      filecount++;
      let x = f.size;
      let s = '';
      if (x < 1024) {
        s = `${x} B`
      } else if (x < 1024 * 1024) {
        s = `${(x / 1024).toFixed(2)} KB (${x} bytes)`
      } else if (x < 1024 * 1024 * 1024) {
        s = `${(x / (1024 * 1024)).toFixed(2)} MB (${x} bytes)`
      } else {
        s = `${(x / (1024 * 1024 * 1024)).toFixed(2)} GB (${x} bytes)`
      }
      fileht += `<tr><td>${filecount}</td><td><a href="${p}">${f.name}</a></td><td>${s}</td></tr>`
    }
    fileht += `</table>`
    folderht += `</table>`

    let title = properties.title;
    if (filecount == 0) fileht = "";
    if (foldercount == 0) folderht = "";
    if (path != '/') {
      folderht = `← <a href="${parent}">Parent Directory</a><br>` + folderht
      title = `${properties.folder_title} ${path}`
    }
    const ht = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<html>
<head>
<title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/akhilnarang/GDIndex@master/styles.css">
</head>
<body>
<div class="container">
<h1 id="title">${title}</h1>
${folderht}
${fileht}
</div>
</body>
</html>`;
    return new Response(ht, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }

  let resp = await onGet(request);
  const obj = Object.create(null);

  for (const [k, v] of resp.headers.entries()) {
    obj[k] = v;
  }

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: Object.assign(obj, {
      'Access-Control-Allow-Origin': '*'
    })
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request).catch(err => {
    console.error(err);
    return new Response(JSON.stringify(err.stack), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }));
});
