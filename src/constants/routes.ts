export const ROUTES = Object.freeze({
  splash: "/",
  home: "/home",
  rides: "/rides",
  wallet: "/wallet",
  profile: "/profile",
});

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];