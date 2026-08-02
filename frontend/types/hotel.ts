export interface Hotel {
  id: string; ownerId: string; name: string; description: string; location: string; city: string;
  state: string; country: string; images: string[]; rating: number; reviewCount: number;
  facilities: string[]; startingPrice: number; discountedPrice: number; featured: boolean; verified: boolean;
}

export interface Room {
  id: string; hotelId: string; roomName: string; roomType: string; description: string; price: number;
  discountedPrice: number; capacity: number; availableRooms: number; facilities: string[]; images: string[];
}
