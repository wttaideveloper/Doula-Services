import defaults from './defaults.json';
export type SiteContent = typeof defaults;
export type ImageValue = {src:string;alt:string};
export type LinkValue = {label:string;href:string};
export type IntroValue = {eyebrow:string;title:string;accent:string;description:string};
export default defaults;
