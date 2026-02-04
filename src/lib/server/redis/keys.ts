const PREFIX = 'devcompass';

export const redisKeys = {
  codeforces: (username: string) =>
    `${PREFIX}:codeforces:${username}`,

  github: (username: string) =>
    `${PREFIX}:github:${username}`,

  leetcode: (username: string) =>
    `${PREFIX}:leetcode:${username}`,

  atcoder: (username: string) =>
    `${PREFIX}:atcoder:${username}`
};
