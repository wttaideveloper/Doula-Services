import defaults from './defaults.json';
import blockTemplates from './blocks.json';
export type ImageValue = {src:string;alt:string};
export type LinkValue = {label:string;href:string};
export type IntroValue = {eyebrow:string;title:string;accent:string;description:string};

export type BlockType = keyof typeof blockTemplates;
type BlockOf<T extends BlockType> = {id:string;type:T} & (typeof blockTemplates)[T];
export type Block = {[T in BlockType]: BlockOf<T>}[BlockType];
export type PageValue = {id:string;slug:string;title:string;showInNav:boolean;seoTitle:string;seoDescription:string;blocks:Block[]};

export type SiteContent = Omit<typeof defaults,'pages'> & {pages:PageValue[]};
const content: SiteContent = defaults as SiteContent;
export default content;
