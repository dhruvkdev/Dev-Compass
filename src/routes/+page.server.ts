import { incrementVisitors } from '$lib/server/redis/visitor';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async () => {
  const visitorCount = await incrementVisitors();
  
  return {
    visitorCount
  };
};
