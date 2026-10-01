'use client';
import {useEffect,useState} from 'react';
import Site from '../../cms-site';
import type {SiteContent} from '../../../content/types';
export default function Preview({initial}:{initial:SiteContent}){
  const [content,setContent]=useState(initial);const [page,setPage]=useState('home');
  useEffect(()=>{document.body.dataset.theme=content.brand.theme||'lavender-sage'},[content]);
  useEffect(()=>{const listener=(e:MessageEvent)=>{if(e.origin!==location.origin||e.source!==window.parent||e.data?.type!=='doula-preview')return;setContent(e.data.content);setPage(e.data.page||'home')};window.addEventListener('message',listener);window.parent.postMessage({type:'doula-preview-ready'},location.origin);return()=>window.removeEventListener('message',listener)},[]);
  return <div onSubmitCapture={e=>{e.preventDefault();e.stopPropagation()}} onClickCapture={e=>{const anchor=(e.target as HTMLElement).closest('a');if(!anchor)return;e.preventDefault();const url=new URL(anchor.href);const next=url.pathname==='/'?'home':url.pathname.slice(1);if(['home','about','why-a-doula','services','contact'].includes(next)||content.pages?.some(p=>p.slug===next))setPage(next)}}><Site key={page} page={page} content={content}/></div>
}
