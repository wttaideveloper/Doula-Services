import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {cmsRequest,CMS_URL,SESSION_COOKIE} from '../../../../lib/cms';

export const dynamic='force-dynamic';
const allowed:Record<string,{target:string;methods:string[]}>={
  content:{target:'website/editor',methods:['GET']},
  draft:{target:'website/draft',methods:['PUT']},
  publish:{target:'website/publish',methods:['POST']},
  media:{target:'website/media',methods:['GET','POST']},
  inquiries:{target:'website/inquiries',methods:['GET']},
};
async function handle(request:NextRequest,{params}:{params:Promise<{path:string[]}>}) {
  const path=(await params).path.join('/');
  const mutation=request.method!=='GET';
  if(mutation&&request.headers.get('origin')!==(process.env.APP_ORIGIN||request.nextUrl.origin))return NextResponse.json({error:'Request origin not allowed.'},{status:403});
  try {
    if(path==='logout'&&request.method==='POST'){
      (await cookies()).delete(SESSION_COOKIE);return NextResponse.json({ok:true});
    }
    if(path==='login'&&request.method==='POST'){
      const {email,password}=await request.json();
      if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>256)return NextResponse.json({error:'Enter your email and password.'},{status:400});
      const response=await fetch(`${CMS_URL}/api/auth/local`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:email,password}),cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)return NextResponse.json({error:response.status===429?'Too many attempts. Please try again later.':'Email or password is incorrect.'},{status:response.status===429?429:401});
      const {jwt}=await response.json();
      const check=await fetch(`${CMS_URL}/api/website/editor`,{headers:{Authorization:`Bearer ${jwt}`},cache:'no-store'});
      if(!check.ok)return NextResponse.json({error:'This account does not have website editor access.'},{status:403});
      (await cookies()).set(SESSION_COOKIE,jwt,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:8*60*60});
      return NextResponse.json({ok:true});
    }
    const route=allowed[path];
    if(!route||!route.methods.includes(request.method))return NextResponse.json({error:'Not found'},{status:404});
    if(mutation&&!(await cookies()).get(SESSION_COOKIE))return NextResponse.json({error:'Please sign in.'},{status:401});
    let body:BodyInit|undefined;
    let headers:Record<string,string>={};
    if(path==='media'&&request.method==='POST'){
      const form=await request.formData();const file=form.get('file');
      if(!(file instanceof File)||file.size>8*1024*1024)return NextResponse.json({error:'Choose an image smaller than 8 MB.'},{status:400});
      body=new FormData();body.set('file',file);
    } else if(mutation){
      const raw=await request.text();
      if(raw.length>1500000)return NextResponse.json({error:'Content is too large.'},{status:413});
      body=raw;headers={'Content-Type':'application/json'};
    }
    const response=await cmsRequest(route.target,{method:request.method,headers,body},true);
    const data=await response.json();
    if(!response.ok)return NextResponse.json({error:data.error?.message||'Your changes could not be saved.'},{status:response.status});
    return NextResponse.json(data,{headers:{'Cache-Control':'private, no-store'}});
  }catch{return NextResponse.json({error:'The content server is unavailable. Your changes are still in this editor. Please try again.'},{status:503});}
}
export {handle as GET,handle as POST,handle as PUT};
