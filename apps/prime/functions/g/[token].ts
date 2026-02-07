/**
 * CF Pages Function: /g/:token
 *
 * Redirects tokenized links to the static /g page with a query param.
 */

export const onRequest: PagesFunction = async ({ params, request }) => {
  const token = params.token as string;
  const url = new URL(request.url);
  url.pathname = '/g/';
  url.searchParams.set('token', token);
  return Response.redirect(url.toString(), 302);
};
