import { ServiceCategory } from '../models/serviceCategory.model';
import { logger } from './logger';

export const seedServiceCategories = async () => {
  try {
    const existingCategories = await ServiceCategory.countDocuments();
    
    if (existingCategories > 0) {
      logger.info('Service categories already exist, skipping seed');
      return;
    }

    const categories = [
      {
        name: 'Home Services',
        description: 'Plumbing, electrical, carpentry, and home repairs',
        icon: 'home',
        slug: 'home-services',
        sortOrder: 1,
      },
      {
        name: 'Beauty & Wellness',
        description: 'Salon services, spa treatments, and wellness care',
        icon: 'sparkles',
        slug: 'beauty-wellness',
        sortOrder: 2,
      },
      {
        name: 'Housekeeping & Daily Help',
        description: 'Cleaning, cooking, and household maintenance',
        icon: 'broom',
        slug: 'housekeeping-daily-help',
        sortOrder: 3,
      },
      {
        name: 'Repair & Maintenance',
        description: 'Appliance repair, AC service, and maintenance',
        icon: 'wrench',
        slug: 'repair-maintenance',
        sortOrder: 4,
      },
      {
        name: 'Pet Services',
        description: 'Pet grooming, training, and veterinary care',
        icon: 'heart',
        slug: 'pet-services',
        sortOrder: 5,
      },
      {
        name: 'Grocery & Essentials',
        description: 'Grocery delivery and essential items',
        icon: 'shopping-cart',
        slug: 'grocery-essentials',
        sortOrder: 6,
      },
      {
        name: 'Education & Coaching',
        description: 'Tutoring, skill development, and coaching',
        icon: 'book',
        slug: 'education-coaching',
        sortOrder: 7,
      },
      {
        name: 'Events & Photography',
        description: 'Event planning, photography, and videography',
        icon: 'camera',
        slug: 'events-photography',
        sortOrder: 8,
      },
      {
        name: 'Automobile',
        description: 'Car cleaning, repair, and maintenance services',
        icon: 'car',
        slug: 'automobile',
        sortOrder: 9,
      },
      {
        name: 'Shifting & Logistics',
        description: 'Moving, packing, and logistics services',
        icon: 'truck',
        slug: 'shifting-logistics',
        sortOrder: 10,
      },
      {
        name: 'Professional Services',
        description: 'Legal, financial, and business consulting',
        icon: 'briefcase',
        slug: 'professional-services',
        sortOrder: 11,
      },
    ];

    await ServiceCategory.insertMany(categories);
    logger.info('✅ Service categories seeded successfully');
  } catch (error) {
    logger.error('❌ Error seeding service categories:', error);
  }
};
