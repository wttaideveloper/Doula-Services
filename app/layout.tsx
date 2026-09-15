import type { Metadata } from 'next';
import './globals.css';
import './modern.css';
import './theme.css';
export const metadata: Metadata = {title:'Compassion Doula Services | Yuba City',description:'Warm, personalized birth doula support in Yuba City and surrounding communities. Feel informed, supported, and confident as you welcome your baby.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
