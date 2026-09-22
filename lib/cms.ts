import 'server-only';
import {cookies} from 'next/headers';
import defaults, {type SiteContent} from '../content/types';

export const CMS_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
export const SESSION_COOKIE = 'doula_editor';
export async function cmsRequest(path:string, init:RequestInit = {}, authenticated=false) {
  const token = authenticated ? (await cookies()).get(SESSION_COOKIE)?.value : undefined;
  if(authenticated && !token) return Response.json({error:{message:'Please sign in.'}},{status:401});
  return fetch(`${CMS_URL}/api/${path}`,{...init,cache:'no-store',signal:AbortSignal.timeout(20000),headers:{...init.headers,...(token?{Authorization:`Bearer ${token}`}:{})}});
}
export async function getLiveContent():Promise<SiteContent> {
  try {
    const response=await cmsRequest('website/live');
    if(!response.ok)throw new Error('CMS unavailable');
    const data=await response.json();
    return data.content;
  } catch {
    // Initial installation remains viewable. Published content is read fresh whenever Strapi is available.
    console.error('Strapi unavailable: displaying bundled website content.');
    return defaults;
  }
}
