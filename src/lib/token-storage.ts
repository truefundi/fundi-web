
const ACCESS_TOKEN_KEY = "fundi_access_token";
const CHALLENGE_KEY = "fundi_2fa_challenge";

const isBrowser = () => typeof window !== "undefined";

export const tokenStorage = {
  get: (): string | null =>
    isBrowser() ? localStorage.getItem(ACCESS_TOKEN_KEY) : null,

  set: (token: string) => {
    if (isBrowser()) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  clear: () => {
    if (isBrowser()) localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};

export const challengeStorage = {
  get: (): string | null =>
    isBrowser() ? sessionStorage.getItem(CHALLENGE_KEY) : null,

  set: (token: string) => {
  
    if (isBrowser()) sessionStorage.setItem(CHALLENGE_KEY, token);
  },

 
  clear: () => {
    if (isBrowser()) sessionStorage.removeItem(CHALLENGE_KEY);
  },
};
