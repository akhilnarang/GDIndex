if (USE_SERVICE_ACCOUNT) {
  self.props = {
    title: TITLE,
    folder_title: FOLDER_TITLE,
    default_root_id: DEFAULT_ROOT_ID
  };
} else {
  self.props = {
    title: TITLE,
    default_root_id: DEFAULT_ROOT_ID,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    folder_title: FOLDER_TITLE
  };
}

import GoogleDrive from './gdrive'
const gd = new GoogleDrive(self.props);

async function onGet(request) {
  let {
    pathname: path
  } = request;
  const rootId = request.searchParams.get('rootId') || self.props.default_root_id;

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
  request = Object.assign({}, request, new URL(request.url));

  let path = request.pathname.split('/').map(decodeURIComponent).map(decodeURIComponent).join('/');
  if (path.endsWith('/')) {
    let parent = encodePathComponent(path.split('/').slice(0, -2).join('/') + '/');
    const {
      files
    } = await gd.listFolderByPath(path, self.props.default_root_id);
    let fileht = `<table>
      <tr>
      <th>Sr. No.</th>
      <th>Filename</th>
      <th>Size</th>
      </tr>
      `;

    let filecount = 0;

    let folderht = '';

    for (const f of files) {
      const isf = f.mimeType === 'application/vnd.google-apps.folder';
      const p = encodePathComponent(path + f.name);
      if (isf) {
        if (f.name == '_h5ai') continue;
        folderht += `→ <a href="${p}">${f.name}</a><br>`
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

    let title = self.props.title;
    if (path != '/') {
      folderht = `← <a href="${parent}">Parent Directory</a><br>` + folderht
      title = `${self.props.folder_title} ${path.replace(/\//g, '')}`
    }
    if (filecount == 0) fileht = "";
    const ht = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<html>
<head>
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Open Sans', sans-serif;">
<h1 style="color: #009668;">${title}</h1>
${folderht}
${fileht}
</body>
</html>`;
    return new Response(ht, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }

  if (request.method != 'GET') {
    return new Response('', { status: 405 });
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
