const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

const Admin = require('../models/Admin');
const Homepage = require('../models/Homepage');
const AboutPage = require('../models/AboutPage');
const ContactPage = require('../models/ContactPage');
const Settings = require('../models/Settings');
const Service = require('../models/Service');
const Portfolio = require('../models/Portfolio');
const Testimonial = require('../models/Testimonial');
const FAQ = require('../models/FAQ');

const BCRYPT_COST = 12;

/** Seeds the single admin account from env vars if the admins collection is empty. */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn('ADMIN_EMAIL/ADMIN_PASSWORD not set - skipping admin auto-seed.');
    return;
  }

  const hashed = await bcrypt.hash(password, BCRYPT_COST);

  const admin = await Admin.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        password: hashed,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  logger.info(`Admin account configured: ${admin.email}`);
}

const defaultHomepage = {
  hero: {
    backgroundImage: '',
    sideImage: '',
    eyebrow: 'Professional Painting Specialists',
    badgeText: 'Quality You Can Trust',
    title: 'Professional Painting & Renovation Services You Can Trust',
    subtitle:
      'From interior refreshes to full exterior transformations, Crystal Coat Painting & Renovation delivers flawless finishes backed by years of combined experience.',
    buttons: [
      { text: 'Get Free Quote', link: '#contact', type: 'primary' },
      { text: 'WhatsApp Us', link: 'https://wa.me/', type: 'whatsapp' },
      { text: 'Call Now', link: 'tel:+10000000000', type: 'call' },
    ],
    highlightTags: ['Interior Painting', 'Exterior Painting', 'Waterproofing', 'Wood Finishing'],
    floatingBadgeText: 'Free Site Visit',
    sideCaption: {
      title: 'Quality in Every Coat',
      text: 'Meticulous prep, premium paints, and craftsmanship that lasts.',
    },
  },
  heroStats: [
    { label: 'Projects Completed', value: '500+', icon: 'Trophy' },
    { label: 'Years Experience', value: '15+', icon: 'Clock' },
    { label: 'Happy Clients', value: '450+', icon: 'Smile' },
    { label: 'Expert Painters', value: '30+', icon: 'Users' },
  ],
  stats: [
    { label: 'Projects Completed', value: '500', suffix: '+' },
    { label: 'Years of Experience', value: '15', suffix: '+' },
    { label: 'Happy Clients', value: '450', suffix: '+' },
    { label: 'Team Members', value: '30', suffix: '+' },
  ],
  servicesIntro: {
    eyebrow: 'What We Offer',
    title: 'Our Painting & Renovation Services',
    text: 'Comprehensive solutions for every surface, inside and out.',
    note:
      'Painting remains our primary service; secondary services are available as part of complete home improvement packages.',
  },
  whyChooseIntro: {
    eyebrow: 'Why Choose Us',
    title: 'The Crystal Coat Difference',
    text: 'Reliable, skilled, and committed to lasting quality.',
  },
  whyChoose: [
    { title: 'Skilled Craftsmen', text: 'Trained painters with an eye for detail.', icon: 'UserCheck' },
    { title: 'Premium Materials', text: 'We use only trusted, high-quality paints and coatings.', icon: 'ShieldCheck' },
    { title: 'On-Time Delivery', text: 'Projects completed within the agreed timeline.', icon: 'Clock' },
    { title: 'Transparent Pricing', text: 'No hidden costs, clear quotes upfront.', icon: 'Wallet' },
    { title: 'Clean Work Sites', text: 'We leave your property spotless after every job.', icon: 'Sparkles' },
    { title: 'Warranty Backed', text: 'Workmanship warranty on every project.', icon: 'BadgeCheck' },
  ],
  premiumPromise: {
    eyebrow: 'Our Promise',
    title: 'The Premium Promise',
    text: 'We stand behind every coat with a satisfaction guarantee and dedicated after-service support.',
  },
  projectsIntro: {
    eyebrow: 'Our Work',
    title: 'Featured Projects',
    text: 'A showcase of recent transformations across homes and businesses.',
  },
  beforeAfter: [
    { title: 'Exterior Wall Refresh', beforeLabel: 'Before', afterLabel: 'After', beforeImage: '', afterImage: '' },
    { title: 'Interior Living Room', beforeLabel: 'Before', afterLabel: 'After', beforeImage: '', afterImage: '' },
  ],
  testimonialsIntro: {
    eyebrow: 'Testimonials',
    title: 'What Our Clients Say',
    text: 'Real feedback from real homeowners and businesses.',
  },
  footer: {
    description:
      'Crystal Coat Painting & Renovation delivers professional painting and renovation services with a commitment to quality and customer satisfaction.',
    phone: '+91 00000 00000',
    whatsapp: '+91 00000 00000',
    email: 'info@crystalcoat.example',
    address: 'Your City, State, Country',
    hours: 'Mon - Sat: 9:00 AM - 6:00 PM',
    socials: [
      { label: 'Facebook', href: 'https://facebook.com' },
      { label: 'Instagram', href: 'https://instagram.com' },
    ],
  },
};

const defaultAboutPage = {
  banner: '',
  companyImage: '',
  experienceCaption: { label: '15+ Years', text: 'of trusted painting & renovation experience' },
  intro: {
    eyebrow: 'About Us',
    title: 'Crystal Coat Painting & Renovation',
    description:
      'A dedicated team of painting professionals committed to transforming spaces with quality craftsmanship and reliable service.',
  },
  blocks: [
    {
      title: 'Company Story',
      text: 'Founded with a passion for craftsmanship, Crystal Coat has grown into a trusted name in painting and renovation.',
      icon: 'BookOpen',
    },
    {
      title: 'Mission',
      text: 'To deliver flawless finishes and dependable service on every project, big or small.',
      icon: 'Target',
    },
    { title: 'Vision', text: 'To be the most trusted painting and renovation partner in the region.', icon: 'Eye' },
    {
      title: 'Quality Commitment',
      text: 'We use premium materials and proven techniques to ensure lasting results.',
      icon: 'ShieldCheck',
    },
  ],
  qualityChips: [
    'Licensed & Insured',
    'Premium Paints Only',
    'Skilled Craftsmen',
    'On-Time Completion',
    'Clean Work Sites',
    'Workmanship Warranty',
  ],
  teamImages: [],
  certificates: [],
};

const defaultContactPage = {
  banner: '',
  intro: {
    eyebrow: 'Get In Touch',
    title: 'Contact Us',
    text: 'Ready to start your project? Reach out for a free consultation and quote.',
  },
  phone: '+91 00000 00000',
  phoneHref: 'tel:+910000000000',
  whatsapp: '+91 00000 00000',
  whatsappHref: 'https://wa.me/910000000000',
  email: 'info@crystalcoat.example',
  address: 'Your City, State, Country',
  hours: 'Mon - Sat: 9:00 AM - 6:00 PM',
  mapQuery: 'Crystal Coat Painting & Renovation',
  mapEmbedUrl: '',
  socials: [
    { label: 'Facebook', href: 'https://facebook.com' },
    { label: 'Instagram', href: 'https://instagram.com' },
  ],
};

const defaultSettings = {
  siteName: 'Crystal Coat Painting & Renovation',
  logo: '',
  logoWhite: '',
  favicon: '',
  footerText: `Crystal Coat Painting & Renovation. All rights reserved.`,
  themeColors: { primary: '#1E3A8A', secondary: '#F59E0B', accent: '#0EA5E9' },
  seo: {
    defaultTitle: 'Crystal Coat Painting & Renovation',
    defaultDescription: 'Professional painting and renovation services you can trust.',
    defaultKeywords: 'painting, renovation, interior painting, exterior painting',
    ogImage: '',
  },
};

const defaultMainServices = [
  {
    title: 'Interior Painting',
    description: 'Flawless, long-lasting interior finishes for every room in your home or office.',
    icon: 'PaintRoller',
    accent: 'from-blue-500 to-blue-700',
    category: 'main',
    isFeatured: true,
    features: ['Wall preparation', 'Premium emulsions', 'Two-coat finish'],
    order: 0,
  },
  {
    title: 'Exterior Painting',
    description: 'Weather-resistant exterior coatings that protect and beautify your property.',
    icon: 'Home',
    accent: 'from-amber-500 to-orange-600',
    category: 'main',
    isFeatured: true,
    features: ['Surface cleaning', 'Crack filling', 'Weatherproof paints'],
    order: 1,
  },
  {
    title: 'Waterproofing',
    description: 'Protect your walls and roofs from leaks and dampness with proven waterproofing systems.',
    icon: 'Droplets',
    accent: 'from-cyan-500 to-blue-600',
    category: 'main',
    isFeatured: true,
    features: ['Roof waterproofing', 'Wall waterproofing', 'Bathroom waterproofing'],
    order: 2,
  },
  {
    title: 'Wood Finishing & Polishing',
    description: 'Restore and protect wooden surfaces with expert polishing and finishing.',
    icon: 'Layers',
    accent: 'from-yellow-600 to-amber-700',
    category: 'main',
    isFeatured: true,
    features: ['Door & window polish', 'Furniture finishing', 'Melamine & PU coatings'],
    order: 3,
  },
];

const defaultSecondaryServices = [
  'Texture Painting',
  'Wallpaper Installation',
  'POP & False Ceiling',
  'Tile & Stone Work',
  'Plumbing',
  'Electrical Work',
  'Carpentry',
  'Deep Cleaning',
].map((title, idx) => ({
  title,
  description: 'Available as part of complete home improvement packages.',
  icon: 'Wrench',
  category: 'secondary',
  isFeatured: false,
  order: idx,
}));

const defaultTestimonials = [
  {
    name: 'Ananya Rao',
    location: 'Bengaluru',
    initials: 'AR',
    review: 'Exceptional work and very professional team. Our home looks brand new!',
    rating: 5,
    isFeatured: true,
    order: 0,
  },
  {
    name: 'Vikram Shetty',
    location: 'Mangaluru',
    initials: 'VS',
    review: 'On time, on budget, and the finish quality exceeded our expectations.',
    rating: 5,
    isFeatured: true,
    order: 1,
  },
  {
    name: 'Priya Nair',
    location: 'Kochi',
    initials: 'PN',
    review: 'Great communication throughout the project and a spotless clean-up afterward.',
    rating: 4,
    isFeatured: true,
    order: 2,
  },
];

const defaultFAQs = [
  {
    question: 'How long does a typical painting project take?',
    answer: 'Most interior projects take 3-5 days, while full exterior jobs typically take 5-10 days depending on size.',
    order: 0,
  },
  {
    question: 'Do you provide a free site visit and quote?',
    answer: 'Yes, we offer a free, no-obligation site visit and detailed quote for every project.',
    order: 1,
  },
  {
    question: 'What kind of paints and materials do you use?',
    answer: 'We use only premium, branded paints and waterproofing materials suited to your surface and climate.',
    order: 2,
  },
];

const defaultPortfolio = [
  {
    title: 'Modern Villa Exterior Makeover',
    category: 'Exterior Painting',
    location: 'Bengaluru',
    completionDate: '2025-03-15',
    duration: '7 days',
    description: 'Complete exterior repaint with weatherproof coatings and accent texture work.',
    materials: ['Weatherproof emulsion', 'Exterior putty', 'Texture paint'],
    services: ['Exterior Painting', 'Waterproofing'],
    isFeatured: true,
    order: 0,
  },
  {
    title: 'Contemporary Living Room Refresh',
    category: 'Interior Painting',
    location: 'Kochi',
    completionDate: '2025-05-02',
    duration: '3 days',
    description: 'Full interior repaint with a feature accent wall and ceiling touch-up.',
    materials: ['Premium emulsion', 'Accent wall paint'],
    services: ['Interior Painting'],
    isFeatured: true,
    order: 1,
  },
];

/** Ensures every singleton doc exists with sensible defaults (upsert pattern). */
async function seedSingleton(Model, defaults) {
  const existing = await Model.findOne();
  if (existing) return existing;
  return Model.findOneAndUpdate({}, { $setOnInsert: defaults }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function seedCollectionIfEmpty(Model, docs, label) {
  const count = await Model.countDocuments();
  if (count > 0) return;
  await Model.insertMany(docs);
  logger.info(`Seeded ${docs.length} default ${label} document(s).`);
}

/** Seeds all singleton pages + starter content so the public site is never blank. */
async function seedDefaultContent() {
  await seedSingleton(Homepage, defaultHomepage);
  await seedSingleton(AboutPage, defaultAboutPage);
  await seedSingleton(ContactPage, defaultContactPage);
  await seedSingleton(Settings, defaultSettings);

  await seedCollectionIfEmpty(Service, [...defaultMainServices, ...defaultSecondaryServices], 'service');
  await seedCollectionIfEmpty(Portfolio, defaultPortfolio, 'portfolio');
  await seedCollectionIfEmpty(Testimonial, defaultTestimonials, 'testimonial');
  await seedCollectionIfEmpty(FAQ, defaultFAQs, 'FAQ');
}

async function runSeeds() {
  await seedAdmin();
  await seedDefaultContent();
}

module.exports = { runSeeds, seedAdmin, seedDefaultContent };
