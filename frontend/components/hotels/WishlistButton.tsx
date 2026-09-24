"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

type WishlistRow={hotel?:{_id?:string}|string};

export function useWishlist(){
  const router=useRouter();
  const[ids,setIds]=useState<Set<string>>(new Set());
  const[busy,setBusy]=useState<Set<string>>(new Set());
  useEffect(()=>{let user:AuthUser|null=null;try{user=JSON.parse(localStorage.getItem("travelmagnet-user")||"null")}catch{}if(user?.role!=="user")return;apiRequest<WishlistRow[]>("/wishlist").then(rows=>setIds(new Set(rows.map(row=>typeof row.hotel==="string"?row.hotel:row.hotel?._id).filter((id):id is string=>Boolean(id))))).catch(()=>{});},[]);
  const toggle=useCallback(async(hotelId:string)=>{let user:AuthUser|null=null;try{user=JSON.parse(localStorage.getItem("travelmagnet-user")||"null")}catch{}if(!user){router.push("/login");return}if(user.role!=="user"){router.push("/customer/wishlist");return}if(busy.has(hotelId))return;const removing=ids.has(hotelId);setBusy(current=>new Set(current).add(hotelId));setIds(current=>{const next=new Set(current);removing?next.delete(hotelId):next.add(hotelId);return next});try{await apiRequest(`/wishlist/${hotelId}`,{method:removing?"DELETE":"POST"})}catch{setIds(current=>{const next=new Set(current);removing?next.add(hotelId):next.delete(hotelId);return next})}finally{setBusy(current=>{const next=new Set(current);next.delete(hotelId);return next})}},[busy,ids,router]);
  return{ids,busy,toggle};
}

export default function WishlistButton({hotelId,active,busy,onToggle,className=""}:{hotelId:string;active:boolean;busy?:boolean;onToggle:(hotelId:string)=>void;className?:string}){return <button type="button" disabled={busy} onClick={event=>{event.preventDefault();event.stopPropagation();onToggle(hotelId)}} aria-label={active?"Remove from wishlist":"Add to wishlist"} title={active?"Remove from wishlist":"Add to wishlist"} className={`grid size-11 place-items-center rounded-full border border-white/70 bg-white/90 text-rose-500 shadow-md backdrop-blur hover:scale-105 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/90 ${className}`}><Heart size={21} fill={active?"currentColor":"none"}/></button>}
