import DoulaSite from '../cms-site';
import {notFound} from 'next/navigation';
import {getLiveContent} from '../../lib/cms';
export const dynamic='force-dynamic';
export async function generateMetadata(){const c=await getLiveContent();return {title:c.brand.seoTitle,description:c.brand.seoDescription};}
export default async function Page({params}:{params:Promise<{slug?:string[]}>}) {const {slug}=await params;const page=slug?.join('/')||'home';if(!['home','about','why-a-doula','services','contact'].includes(page))notFound();return <DoulaSite page={page} content={await getLiveContent()}/>}
