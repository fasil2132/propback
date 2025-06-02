// // src/models/property.model.ts
// import mongoose from 'mongoose';

// const propertySchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   price: { type: Number, required: true },
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
// });

// export default mongoose.model('Property', propertySchema);
import { Amenity } from "./amenity.model";
export interface Property {
  id: number;
  title: string;
  type: 'rent' | 'sale';
  category?: 'residential' | 'commercial' | 'industrial';
  description?: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  status: string;
  image: string;
  location: string;
  ownerId: number;
  createdAt?: Date;
  amenities?: Amenity[];
}
