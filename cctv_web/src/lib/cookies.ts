/** Set a cookie accessible by the middleware */
export function setTokenCookie(token: string) {
  document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

export function removeTokenCookie() {
  document.cookie = "access_token=; path=/; max-age=0";
}
