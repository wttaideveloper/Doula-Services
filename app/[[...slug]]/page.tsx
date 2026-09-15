import DoulaSite from '../site';
import {notFound} from 'next/navigation';
export function generateStaticParams(){return [{slug:[]},{slug:['about']},{slug:['why-a-doula']},{slug:['services']},{slug:['contact']}]}
export default async function Page({params}:{params:Promise<{slug?:string[]}>}) {const {slug}=await params;const page=slug?.join('/')||'home';if(!['home','about','why-a-doula','services','contact'].includes(page))notFound();return <DoulaSite page={page}/>}
