import Details from"@/components/hotels/Details";export default async function Page({params}:{params:Promise<{slug:string}>}){const{slug}=await params;return <Details slug={slug}/>}
