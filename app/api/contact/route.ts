import {NextRequest,NextResponse} from 'next/server';
import {cmsRequest} from '../../../lib/cms';
export async function POST(request:NextRequest){
  if(request.headers.get('origin')!==(process.env.APP_ORIGIN||request.nextUrl.origin))return NextResponse.json({error:'Request not allowed.'},{status:403});
  try{
    const raw=await request.text();if(raw.length>12000)return NextResponse.json({error:'Your message is too long.'},{status:413});
    const response=await cmsRequest('website/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:raw});
    const data=await response.json();
    return NextResponse.json(response.ok?{ok:true}:{error:data.error?.message||'Please check your details.'},{status:response.status});
  }catch{return NextResponse.json({error:'Your message was not sent. Please try again later.'},{status:503});}
}
