export const EXPRESSION_PARAMETER = "q";

export function expressionFromUrl(urlLike) {
  const url = urlLike instanceof URL ? urlLike : new URL(urlLike);
  return url.searchParams.has(EXPRESSION_PARAMETER)
    ? url.searchParams.get(EXPRESSION_PARAMETER)
    : null;
}

export function urlWithExpression(urlLike, expression) {
  const url = new URL(urlLike instanceof URL ? urlLike.href : urlLike);
  url.searchParams.set(EXPRESSION_PARAMETER, expression);
  return url;
}

export function relativeUrl(url) {
  return `${url.pathname}${url.search}${url.hash}`;
}
