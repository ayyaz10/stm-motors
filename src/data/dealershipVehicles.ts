export type VehicleStatus = "Available" | "Reserved" | "Sold";

export interface DealershipVehicle {
  slug: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: "Petrol" | "Diesel" | "Hybrid";
  transmission: "Manual" | "Automatic";
  engineSize: string;
  price: number;
  status: VehicleStatus;
  image: string;
  description: string;
  features: string[];
}

export const dealershipVehicles: DealershipVehicle[] = [
  {
    slug: "2018-bmw-3-series",
    make: "BMW",
    model: "3 Series 320d Sport",
    year: 2018,
    mileage: 54200,
    fuelType: "Diesel",
    transmission: "Automatic",
    engineSize: "2.0L",
    price: 14750,
    status: "Available",
    image: "/images/cars/bmw-3-series.jpg",
    description:
      "A refined, comfortable executive saloon with a strong specification and an efficient diesel engine.",
    features: [
      "Satellite navigation",
      "Front and rear parking sensors",
      "Dual-zone climate control",
      "Bluetooth connectivity",
      "Cruise control",
      "17-inch alloy wheels",
    ],
  },
  {
    slug: "2019-audi-a4-sport",
    make: "Audi",
    model: "A4 35 TFSI Sport",
    year: 2019,
    mileage: 41900,
    fuelType: "Petrol",
    transmission: "Automatic",
    engineSize: "2.0L",
    price: 17995,
    status: "Reserved",
    image: "/images/cars/audi-a4.jpg",
    description:
      "A well-presented premium saloon offering a smooth drive, smart cabin and useful everyday technology.",
    features: [
      "Virtual cockpit",
      "Apple CarPlay and Android Auto",
      "Rear parking sensors",
      "Automatic LED headlights",
      "Cruise control",
      "18-inch alloy wheels",
    ],
  },
  {
    slug: "2018-mercedes-c-class",
    make: "Mercedes-Benz",
    model: "C-Class C200 Sport",
    year: 2018,
    mileage: 48750,
    fuelType: "Petrol",
    transmission: "Automatic",
    engineSize: "2.0L",
    price: 16495,
    status: "Available",
    image: "/images/cars/mercedes-c-class.jpg",
    description:
      "A comfortable C-Class with elegant styling, a quiet cabin and the convenience of an automatic gearbox.",
    features: [
      "Heated front seats",
      "Satellite navigation",
      "Reversing camera",
      "Keyless start",
      "Climate control",
      "Automatic headlights",
    ],
  },
  {
    slug: "2020-volkswagen-golf",
    make: "Volkswagen",
    model: "Golf 1.5 TSI Match",
    year: 2020,
    mileage: 36200,
    fuelType: "Petrol",
    transmission: "Manual",
    engineSize: "1.5L",
    price: 15250,
    status: "Available",
    image: "/images/cars/volkswagen-golf.jpg",
    description:
      "A versatile family hatchback with useful driver assistance, a comfortable ride and practical five-door access.",
    features: [
      "Adaptive cruise control",
      "Front and rear parking sensors",
      "Smartphone integration",
      "Lane assist",
      "Automatic lights and wipers",
      "Dual-zone climate control",
    ],
  },
  {
    slug: "2021-toyota-c-hr-hybrid",
    make: "Toyota",
    model: "C-HR 1.8 Hybrid Design",
    year: 2021,
    mileage: 28700,
    fuelType: "Hybrid",
    transmission: "Automatic",
    engineSize: "1.8L",
    price: 19495,
    status: "Available",
    image: "/images/cars/toyota-c-hr.jpg",
    description:
      "A distinctive compact crossover with an efficient hybrid drivetrain and a comprehensive safety specification.",
    features: [
      "Reversing camera",
      "Adaptive cruise control",
      "Apple CarPlay and Android Auto",
      "Lane departure alert",
      "Automatic climate control",
      "Keyless entry",
    ],
  },
  {
    slug: "2019-ford-kuga-titanium",
    make: "Ford",
    model: "Kuga 1.5 EcoBoost Titanium",
    year: 2019,
    mileage: 51600,
    fuelType: "Petrol",
    transmission: "Manual",
    engineSize: "1.5L",
    price: 12995,
    status: "Sold",
    image: "/images/cars/ford-kuga.jpg",
    description:
      "A spacious and practical family SUV with a raised driving position and a flexible, well-equipped cabin.",
    features: [
      "Heated windscreen",
      "Satellite navigation",
      "Rear parking sensors",
      "Cruise control",
      "Dual-zone climate control",
      "Electric folding mirrors",
    ],
  },
];

export const findDealershipVehicle = (slug: string) =>
  dealershipVehicles.find((vehicle) => vehicle.slug === slug);

export const formatVehiclePrice = (price: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(price);

export const formatVehicleMileage = (mileage: number) =>
  `${new Intl.NumberFormat("en-GB").format(mileage)} miles`;

export const buildPurchaseEnquiryUrl = (vehicle: DealershipVehicle) => {
  const params = new URLSearchParams({
    enquiry: "buy-car",
    vehicle: vehicle.slug,
  });

  return `/contact?${params.toString()}`;
};
