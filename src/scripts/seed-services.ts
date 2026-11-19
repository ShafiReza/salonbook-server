/** Inserts starter services when the collection is empty. Run with `npm run seed:services`. */
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { Service } from "../models/service.model.js";

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const services = [
  { serviceName: "Signature Cut & Blow-dry", category: "Haircut & Styling", price: 45, duration: 60, image: img("photo-1560066984-138dadb4c035"), description: "A tailored haircut shaped to your face and lifestyle, finished with a smooth professional blow-dry. Includes a relaxing shampoo and scalp massage." },
  { serviceName: "Bridal & Event Styling", category: "Haircut & Styling", price: 85, duration: 90, image: img("photo-1522337360788-8b13dee7a37e"), description: "Elegant updos, soft waves or sleek finishes for weddings and special occasions. Includes a trial consultation on the day." },
  { serviceName: "Balayage Colour", category: "Hair Coloring", price: 140, duration: 180, image: img("photo-1562322140-8baeececf3df"), description: "Hand-painted highlights for a natural, sun-kissed finish that grows out softly. Includes toner and a gloss treatment." },
  { serviceName: "Full Root Colour", category: "Hair Coloring", price: 70, duration: 120, image: img("photo-1521590832167-7bcbfaa6381f"), description: "Rich, even colour from root to tip using gentle professional formulas. Perfect for grey coverage or a fresh shade." },
  { serviceName: "Keratin Smoothing Treatment", category: "Hair Treatment", price: 120, duration: 150, image: img("photo-1560869713-7d0a29430803"), description: "Reduces frizz and adds long-lasting shine for smoother, more manageable hair. Results last up to three months." },
  { serviceName: "Deep Repair Hair Spa", category: "Hair Treatment", price: 55, duration: 60, image: img("photo-1600948836101-f9ffda59d250"), description: "An intensive conditioning ritual with steam and a scalp massage that restores moisture to dry or damaged hair." },
  { serviceName: "Radiance Facial", category: "Facial & Skincare", price: 65, duration: 60, image: img("photo-1570172619644-dfd03ed5d881"), description: "Deep cleansing, gentle exfoliation and a hydrating mask tailored to your skin type for a visible glow." },
  { serviceName: "Glam Makeup Application", category: "Makeup", price: 60, duration: 60, image: img("photo-1487412947147-5cebf100ffc2"), description: "Professional makeup for parties, photoshoots or date nights, using long-wear products matched to your skin tone." },
  { serviceName: "Gel Manicure & Pedicure", category: "Manicure & Pedicure", price: 50, duration: 90, image: img("photo-1604654894610-df63bc536371"), description: "Nail shaping, cuticle care and a chip-resistant gel finish for hands and feet, with a soothing massage." },
  { serviceName: "Aromatherapy Relaxation Massage", category: "Spa & Massage", price: 75, duration: 60, image: img("photo-1544161515-4ab6ce6db874"), description: "A calming full-body massage with warm aromatic oils to ease tension and restore balance." },
] as const;

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const count = await Service.countDocuments();
  if (count > 0) {
    console.log(`Services collection already has ${count} documents. Nothing inserted.`);
    return;
  }
  await Service.insertMany(services.map((s) => ({ ...s, status: "active" })));
  console.log(`✔ Inserted ${services.length} services`);
}

main()
  .catch((err) => {
    console.error("Seeding services failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
