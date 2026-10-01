import type { Metadata } from 'next';
import './globals.css';
import './modern.css';
import './theme.css';
import './typography.css';
import {getLiveContent} from '../lib/cms';
export const metadata: Metadata = {title:'Compassion Doula Services | Yuba City',description:'Warm, personalized birth doula support in Yuba City and surrounding communities. Feel informed, supported, and confident as you welcome your baby.'};
export default async function RootLayout({children}:{children:React.ReactNode}) {
  const content=await getLiveContent();
  return <html lang="en"><body data-theme={content.brand.theme||'lavender-sage'}>{children}</body></html>;
}
