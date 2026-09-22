import {cmsRequest} from '../../../lib/cms';
import {redirect} from 'next/navigation';
import Preview from './preview';
export const dynamic='force-dynamic';
export default async function PreviewPage(){let data;try{const r=await cmsRequest('website/editor',{},true);if(r.ok)data=await r.json();}catch{}if(!data)redirect('/admin');return <Preview initial={data.content}/>}
