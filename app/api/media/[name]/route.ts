import {CMS_URL} from '../../../../lib/cms';
export async function GET(_request:Request,{params}:{params:Promise<{name:string}>}){
  const {name}=await params;
  if(!/^[a-zA-Z0-9_.-]+\.(png|jpe?g|webp)$/i.test(name))return new Response('Not found',{status:404});
  try{
    const response=await fetch(`${CMS_URL}/uploads/${name}`,{signal:AbortSignal.timeout(15000)});
    if(!response.ok)return new Response('Not found',{status:404});
    return new Response(response.body,{headers:{'Content-Type':response.headers.get('content-type')||'application/octet-stream','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
  }catch{return new Response('Unavailable',{status:503});}
}
