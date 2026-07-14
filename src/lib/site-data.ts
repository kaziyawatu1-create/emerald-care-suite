import heroPharmacist from "../assets/hero-pharmacist.jpg";
import serviceLab from "../assets/tech1.png";
import servicePharmacy from "../assets/vits.jpeg";
import servicePrescription from "../assets/tech2.png";
import homeCollection from "../assets/home.jpg";
import Hiv from "../assets/hiv.jpg";  
import BloodSugar from "../assets/blood.jpeg";
import Malaria from "../assets/malaria.jpeg";
import Hpylori from "../assets/pylori.jpg";
import mainImage from "../assets/main.png";
import deliveryImage from "../assets/Delivery.png";
import PerfumeImage from "../assets/Final-perfumes.png";
import skincareImage from "../assets/final-skincare.png";
import medicineImage from "../assets/Med-final.png";
import LabImage from "../assets/Lab-final.png";
import Vitaminz from '../assets/vitamine.png';
import Skiny from '../assets/Skinyi.png';
import office  from '../assets/Officess.png'

export const heroImage = heroPharmacist;
export const homeVisitImage = homeCollection;
export const mainHero = mainImage;
export const deliveryHero = deliveryImage;
export const perfumeHero = PerfumeImage;
export const skincareHero = skincareImage;
export const medicineHero = medicineImage;
export const labHero = LabImage;
export const officeHero = office;
export const whyChooseItems = [
  {
    title: "Genuine Medicines",
    description:
      "100% authentic medicines sourced only from recognized pharmaceutical suppliers.",
    href: "/shop",
  },
  {
    title: "Certified Laboratory",
    description: "Fast, reliable, and highly accurate diagnostic services.",
    href: "/services",
  },
  {
    title: "Qualified Pharmacists",
    description: "Professional advice and accurate prescription dispensing.",
    href: "/shop",
  },
  {
    title: "Book doctor's Appointment",
    description: "Quality healthcare solutions at prices everyone can afford.",
    href: "/book-appointment",
  },
] as const;

export const serviceCategories = [
  {
    title: "Laboratory Services",
    description: "Rapid HIV testing, blood tests, malaria testing, H. pylori testing and home sample collection.",
    image: serviceLab,
    href: "/services",
    points: [
      "Rapid HIV Testing",
      "Accurate Blood Tests",
      "Reliable Malaria Testing",
      "H. pylori Testing",
      "Home Sample Collection",
      "Office Sample Collection",
      "In-house Laboratory Testing",
      "Home Healthcare Services",
    ],
    cta: "Book Lab Test",
  },
  {
    title: "Pharmacy",
    description: "Genuine prescription and over-the-counter medicines, routine medications, vitamins and supplements.",
    image: Vitaminz,
    href: "/shop",
    points: [
      "Genuine Medicines",
      "Prescription Medicines",
      "Over-the-counter Medicines",
      "Routine Medications",
      "Vitamins",
      "Supplements",
    ],
    cta: "Shop Now",
  },
  {
    title: "Prescription Services",
    description: "Accurate prescription filling, medication counseling, affordable prescriptions and refills.",
    image: servicePrescription,
    href: "/pharmacy",
    points: [
      "Accurate Prescription Filling",
      "Affordable Prescriptions",
      "Medication Counseling",
      "Prescription Refills",
    ],
    cta: "Fill Prescription",
  },
  {
    title: "Skincare Products",
    description: "Premium skincare including serums, cleansers, moisturizers, sunscreens and acne solutions.",
    image: Skiny,
    href: "/skincare",
    points: ["Serums", "Facial Cleansers", "Moisturizers", "Sunscreens", "Acne Solutions"],
    cta: "Explore Skincare",
  },
  {
    title: "Dubai Perfumes",
    description: "Luxury fragrances, gift packages and premium collections for men, women and unisex wear.",
    image: perfumeHero,
    href: "/perfumes",
    points: ["Men's Fragrances", "Women's Fragrances", "Luxury Collections", "Gift Packages"],
    cta: "Explore Perfumes",
  },
] as const;

export const featuredProducts = [
  {
    title: "Medicine",
    description: "Trusted treatments, prescription support and daily health essentials.",
    image: medicineHero,
    href: "/shop",
  },
  {
    title: "Skincare",
    description: "Dermatology-forward skincare curated for healthy, resilient skin.",
    image: Skiny,
    href: "/shop",
  },
  {
    title: "Vitamins",
    description: "Daily wellness support with carefully selected supplements.",
    image: Vitaminz,
    href: "/shop",
  },
  {
    title: "Perfumes",
    description: "A refined fragrance collection with elegant gift-ready presentation.",
    image: perfumeHero,
    href: "/shop",
  },
] as const;

export const laboratoryTests = [
  {
    name: "Rapid HIV Testing",
    description: "Confidential screening with fast turnaround and professional counseling.",
    price: "$12",
    image: Hiv,
  },
  {
    name: "Blood Sugar Test",
    description: "Quick glucose checks for routine monitoring and clinical assessments.",
    price: "$8",
    image: BloodSugar,
  },
  {
    name: "Malaria Testing",
    description: "Reliable malaria diagnostics performed by trained laboratory staff.",
    price: "$10",
    image: Malaria,
  },
  {
    name: "H. pylori Test",
    description: "Digestive health screening with clear reporting and interpretation support.",
    price: "$18",
    image: Hpylori,
  },
  {
    name: "Blood Grouping",
    description: "Accurate blood group identification for clinical and family needs.",
    price: "$7",
    image: medicineHero,
  },
  {
    name: "Home Sample Collection",
    description: "Professional home visits for safe and convenient sample collection.",
    price: "$20",
    image: homeCollection,
  },
  {
    name: "Office Sample Collection",
    description: "Scheduled workplace sample collection for teams and organizations.",
    price: "$25",
    image: homeCollection,
  },
  {
    name: "Home Healthcare",
    description: "Supportive at-home health services coordinated by trained professionals.",
    price: "$30",
    image: homeCollection,
  },
] as const;

export const pharmacyCategories = [
  {
    name: "Prescription",
    description: "Safe dispensing of doctor-prescribed medicines with pharmacist guidance.",
    tag: "Clinical",
  },
  {
    name: "Pain Relief",
    description: "Reliable relief options for headaches, fever, inflammation and body aches.",
    tag: "Wellness",
  },
  {
    name: "Diabetes",
    description: "Routine diabetic care items, monitoring essentials and support medicines.",
    tag: "Chronic Care",
  },
  {
    name: "Heart",
    description: "Essential cardiovascular medicines and wellness support products.",
    tag: "Cardio",
  },
  {
    name: "Children",
    description: "Age-appropriate products for babies, toddlers and growing children.",
    tag: "Family",
  },
  {
    name: "Women's Health",
    description: "Daily and specialist wellness products designed for women's health needs.",
    tag: "Care",
  },
  {
    name: "Supplements",
    description: "Immune, energy and nutritional support for everyday wellbeing.",
    tag: "Nutrition",
  },
] as const;

export const skincareCollections = [
  {
    name: "Serums",
    description: "Targeted serums for hydration, brightening and repair to support your routine.",
    image: skincareHero,
  },
  {
    name: "Sensitive Care",
    description: "Gentle, barrier-supporting options formulated for sensitive and reactive skin.",
    image: skincareHero,
  },
  {
    name: "Face Care",
    description: "Targeted serums, cleansers and toners for clear, refreshed skin.",
    image: skincareHero,
  },
  {
    name: "Body Care",
    description: "Hydrating lotions and restorative care for smooth, nourished skin.",
    image: skincareHero,
  },
  {
    name: "Sunscreens",
    description: "Daily UV protection with lightweight textures and skincare benefits.",
    image: skincareHero,
  },
  {
    name: "Acne Solutions",
    description: "Problem-solving treatments for blemishes, excess oil and post-acne care.",
    image: skincareHero,
  },
] as const;

export const perfumeProducts = [
  {
    name: "Royal Oud Reserve",
    category: "Men",
    description: "A deep woody fragrance with warm spice and polished amber notes.",
    image: perfumeHero,
  },
  {
    name: "Velvet Bloom",
    category: "Women",
    description: "A luminous floral composition with soft musk and elegant sweetness.",
    image: perfumeHero,
  },
  {
    name: "Desert Gold",
    category: "Unisex",
    description: "An opulent signature scent blending saffron, oud and clean musk.",
    image: perfumeHero,
  },
  {
    name: "Midnight Cedar",
    category: "Men",
    description: "Crisp cedar, smoky incense and velvet spice for evening wear.",
    image: perfumeHero,
  },
  {
    name: "Rose Mirage",
    category: "Women",
    description: "A modern rose profile enriched with pear and warm vanilla.",
    image: perfumeHero,
  },
  {
    name: "Amber Silk",
    category: "Unisex",
    description: "Smooth amber and resins in a luxurious everyday fragrance.",
    image: perfumeHero,
  },
] as const;

export const homeServices = [
  {
    title: "Home Sample Collection",
    description: "Safe, discreet and timely sample collection by trained personnel.",
  },
  {
    title: "Medicine Delivery",
    description: "Prompt delivery of routine medicines and wellness essentials.",
  },
  {
    title: "Home Consultation",
    description: "Convenient support and guidance for ongoing healthcare needs.",
  },
] as const;

export const testimonials = [
  "The laboratory results were fast and accurate.",
  "The staff are very professional.",
  "I always get genuine medicines.",
  "Excellent customer service.",
] as const;

export const partners = [
  "Cipla",
  "GSK",
  "Pfizer",
  "Roche Diagnostics",
  "Abbott",
  "CeraVe",
  "Yusra",
  "Health Partners Uganda",
] as const;

export const marketingVideos = [
  { src: "/assets/videos/clip1.mp4", title: "Our Pharmacy Tour" },
  { src: "/assets/videos/clip2.mp4", title: "Laboratory Services" },
  { src: "/assets/videos/clip3.mp4", title: "Home Sample Collection" },
] as const;

export const team = [
  {
    name: "Dr. Naomi Lule",
    role: "Lead Pharmacist",
    description: "Oversees clinical dispensing standards, supplier quality and patient counseling.",
  },
  {
    name: "Brian Ssemanda",
    role: "Laboratory Scientist",
    description: "Leads diagnostic workflows and quality assurance across routine testing services.",
  },
  {
    name: "Aisha Nankya",
    role: "Skincare & Wellness Advisor",
    description: "Guides customers to suitable skincare routines and wellness products.",
  },
] as const;
