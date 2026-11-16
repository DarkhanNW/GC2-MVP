/* API fetcher function */
/*
 How to load the fetch helper function: api.js is an ES module. Import it at the top of your screen's module script:
    import { api } from "./api.js";
 Your screen's script tag must be a module: <script type="module" src="js/<screen>.js"></script>
 Do NOT load api.js with a plain <script> tag (export throws a SyntaxError there).

 GET and POST examples:
    GET: No options
    const <variable> = await api('/api/<route>');

    GET: w/ query string
    const <variable> = await api('/api/products?category=<category>&sort=<variable>');

    POST: pass the body as a plain object (do NOT stringify it), the function will stringify it and set the content type.
    const <variable> = await api('/api/<route>', {
    method: 'POST',
    body: {
      <key> : value,
      <key> : {object},
    },
    });

    CANCELLING A REQUEST (e.g. a newer search replaces an older one):
    const controller = new AbortController();
    const <variable> = await api('/api/<route>', { signal: controller.signal });
    controller.abort();   // the pending call rejects with the original AbortError

    USAGE WITH STATES:
    status.textContent = 'Loading…';
    try {
      const data = await api('/api/<route>');
      if (!data || data.length === 0) {  empty state  }
      else {  render data  }
    } catch (err) {
      if (err.name === 'AbortError') return;   // cancelled on purpose, not an error state
      status.textContent = err.error;
    }

    Returns a value parsed from JSON or null if there's no body.

    Throws an object showing { status, error, field }, a status of 0 means a network error. Show err.error, check err.status for special cases (0 = network, 409 = sold out).
    Aborted requests are the exception: they reject with the original AbortError (check err.name), not { status, error, field }.

    Warning: Always await this function inside an async function.
*/

export async function api(path, options={}) {
    const config = { 
        ...options, 
        headers : { ...options.headers, 'Content-Type' : 'application/json'},
     };

    if (config.body) {
        config.body = JSON.stringify(config.body);
    }

    let response;

    try {
        response = await fetch(path, config);
    } catch (err) {
        if (err?.name === "AbortError") throw err;
        throw { status: 0, error: "Network Error."};
    }

    const text = await response.text();

    let value = null;
    if (text) {
    try {
        value = JSON.parse(text);
    } catch {
        value = null;
        }
    }

    if (!response.ok) {
        throw {
            status: response.status,
            error: value?.error ?? `Something went wrong ${response.status}. Please try again.`,
            field: value?.field,
        };
    }
    return value;
}