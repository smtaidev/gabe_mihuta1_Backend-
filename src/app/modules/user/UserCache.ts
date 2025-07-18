// utils/UserCache.ts
const userCache = new Map<string, any>();

export const setUserToCache = (userId: string, data: any) => {
  userCache.set(userId, data);
};

export const getUserFromCache = (userId: string) => {
  return userCache.get(userId);
};

export const deleteUserFromCache = (userId: string) => {
  userCache.delete(userId);
};

let lastCreatedUserId: string | null = null;

export const setLastCreatedUserId = (id: string) => {
  lastCreatedUserId = id;
};

export const getLastCreatedUserId = () => lastCreatedUserId;
