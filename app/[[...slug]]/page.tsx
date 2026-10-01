import DoulaSite from '../cms-site';
import {notFound} from 'next/navigation';
import {getLiveContent} from '../../lib/cms';
export const dynamic='force-dynamic';
const FIXED=['home','about','why-a-doula','services','contact'];
export async function generateMetadata({params}:{params:Promise<{slug?:string[]}>}){
  const {slug}=await params;const page=slug?.join('/')||'home';
  const c=await getLiveContent();
  const custom=!FIXED.includes(page)?c.pages?.find(p=>p.slug===page):undefined;
  return {title:custom?.seoTitle||c.brand.seoTitle,description:custom?.seoDescription||c.brand.seoDescription};
}
export default async function Page({params}:{params:Promise<{slug?:string[]}>}) {
  const {slug}=await params;const page=slug?.join('/')||'home';
  const content=await getLiveContent();
  if(!FIXED.includes(page)&&!content.pages?.some(p=>p.slug===page))notFound();
  return <DoulaSite page={page} content={content}/>;
}
