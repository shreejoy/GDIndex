self.props = {
  expire_time: '24000000',
  main_website: 'https://get.pixys.tools/'
};

(function() {
  'use strict';
  async function onGet(request) {
    let {
      pathname: path
    } = request;
    const rootId = request.searchParams.get('rootId') || self.props.default_root_id;

    if (path.startsWith('/q/')) {
      //return new Response(path + ' Hello at q')
      const user_agent = request.headers.get('user-agent')
      //return new Response(user_agent)
      const fromurl = request.headers.get('referer')
      //return new Response(fromurl + ' THIS')
      const clientip = request.headers.get('cf-connecting-ip')
	    //return new Response(clientip + ' THIS')
      const uuid = path.replace('/q/', '');
      //return new Response(uuid + ' THIS')
      const predl = self.props.main_website + 'utils/predownload/' + uuid
      //return new Response(predl + ' THIS')
      const response = await fetch(predl, {
        method: 'POST',
        headers: {
          'user-agent': user_agent,
          'clientip': clientip,
          'fromurl': fromurl
        }
      });
      const rtest = await response.text()
      return new Response(rtest + ' THIS')

      return new Response(response)
    } else {
      const result = await gd.getMetaByPath(path, rootId);

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
      } else {
        return Response.redirect(result.webViewLink, 302);
      }
    }
  }

  async function handleRequest(request) {
    if (request.method === 'OPTIONS') // allow preflight request
      return new Response('', {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, HEAD, OPTIONS'
        }
      });

    if (self.props.auth && !doBasicAuth(request)) {
      return unauthorized();
    }

    request = Object.assign({}, request, new URL(request.url));
    request.pathname = request.pathname.split('/').map(decodeURIComponent).map(decodeURIComponent) // for some super special cases, browser will force encode it...   eg: +αあるふぁきゅん。 - +♂.mp3
      .join('/');

    let resp;
    if (request.method === 'GET') resp = await onGet(request);
    else resp = new Response('', {
      status: 405
    });
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
      new Response(JSON.stringify(err.stack), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }));
  });

}());
