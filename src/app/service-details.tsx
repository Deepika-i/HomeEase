
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from 'react-native';

type ServiceInfo = {
  emoji: string;
  description: string;
  services: string[];
  included: string[];
  pricing: string;
};

const serviceData: Record<string, ServiceInfo> = {
  Painting: {
    emoji: '🎨',
    description: 'Give your home a fresh look with professional painting services.',
    services: [
      'Interior wall painting',
      'Exterior house painting',
      'Wall repainting',
      'Texture and decorative painting',
    ],
    included: [
      'Wall inspection',
      'Basic surface preparation',
      'Primer application (as required)',
      'Paint application',
      'Basic cleanup',
    ],
    pricing: 'The quotation depends on wall area, paint quality, wall condition and number of coats.',
  },

  Cleaning: {
    emoji: '🧹',
    description: 'Keep your home fresh, clean and hygienic with our home cleaning services.',
    services: [
      'Full house deep cleaning',
      'Bathroom cleaning',
      'Kitchen cleaning',
      'Sofa and floor cleaning',
    ],
    included: [
      'Dust removal',
      'Floor cleaning',
      'Surface cleaning',
      'Bathroom and kitchen cleaning (as selected)',
    ],
    pricing: 'The quotation depends on house size, number of rooms and type of cleaning.',
  },

  Plumbing: {
    emoji: '🔧',
    description: 'Get help with common plumbing problems and home water fittings.',
    services: [
      'Tap repair and replacement',
      'Pipe leakage repair',
      'Washbasin installation',
      'Bathroom plumbing repairs',
    ],
    included: [
      'Problem inspection',
      'Repair work',
      'Basic fitting support',
    ],
    pricing: 'The quotation depends on the type of repair, labour and spare parts required.',
  },

  Electrical: {
    emoji: '💡',
    description: 'Get support for electrical repairs and installations at your home.',
    services: [
      'Fan installation',
      'Switch and socket repair',
      'Light installation',
      'Wiring inspection',
    ],
    included: [
      'Electrical problem inspection',
      'Repair or installation',
      'Basic testing after work',
    ],
    pricing: 'The quotation depends on the work required, labour and electrical materials.',
  },

  'AC Service': {
    emoji: '❄️',
    description: 'Keep your air conditioner working efficiently with professional servicing.',
    services: [
      'AC general service',
      'AC deep cleaning',
      'AC installation',
      'AC troubleshooting',
    ],
    included: [
      'Basic AC inspection',
      'Filter cleaning (as required)',
      'Service performance check',
    ],
    pricing: 'The quotation depends on AC type, capacity and the service required.',
  },

  'Maid / Housekeeping': {
    emoji: '🧽',
    description: 'Get regular household cleaning assistance to keep your home neat and organised.',
    services: [
      'Daily home cleaning',
      'Sweeping and mopping',
      'Bathroom cleaning',
      'Kitchen cleaning',
      'Utensil washing',
    ],
    included: [
      'Discussion of household requirements',
      'Cleaning task selection',
      'Service schedule discussion',
    ],
    pricing: 'The quotation depends on working hours, frequency and household requirements.',
  },

  Cooking: {
    emoji: '👩‍🍳',
    description: 'Find cooking assistance for your everyday household needs.',
    services: [
      'Daily meal preparation',
      'Breakfast preparation',
      'Lunch and dinner preparation',
      'Vegetarian cooking',
      'Kitchen assistance',
    ],
    included: [
      'Discussion of food preferences',
      'Meal requirements review',
      'Cooking schedule discussion',
    ],
    pricing: 'The quotation depends on meal requirements, working hours and frequency.',
  },

  Carpentry: {
    emoji: '🪚',
    description: 'Get help with furniture repairs, fittings and other carpentry work.',
    services: [
      'Door and lock repairs',
      'Furniture repairs',
      'Shelf installation',
      'Bed and table repairs',
      'Cabinet fitting',
    ],
    included: [
      'Work inspection',
      'Repair requirement assessment',
      'Fitting and installation support',
    ],
    pricing: 'The quotation depends on the repair, materials and labour required.',
  },

  Gardening: {
    emoji: '🪴',
    description: 'Keep your garden beautiful with regular plant and garden maintenance.',
    services: [
      'Plant maintenance',
      'Garden cleaning',
      'Lawn maintenance',
      'Plant trimming',
      'Home garden setup',
    ],
    included: [
      'Garden inspection',
      'Maintenance requirement review',
      'Plant care discussion',
    ],
    pricing: 'The quotation depends on garden size and the maintenance required.',
  },

  'Pest Control': {
    emoji: '🐜',
    description: 'Protect your home with pest inspection and treatment services.',
    services: [
      'Cockroach control',
      'Ant control',
      'Termite treatment',
      'Mosquito control',
      'General pest inspection',
    ],
    included: [
      'Pest problem inspection',
      'Treatment requirement assessment',
      'Safety instructions',
    ],
    pricing: 'The quotation depends on the pest type, affected area and treatment required.',
  },

  'Appliance Repair': {
    emoji: '🛠️',
    description: 'Get assistance with common household appliance problems.',
    services: [
      'Washing machine repair',
      'Refrigerator repair',
      'Microwave repair',
      'Water purifier service',
      'Other household appliance repairs',
    ],
    included: [
      'Appliance inspection',
      'Problem identification',
      'Repair requirement assessment',
    ],
    pricing: 'The quotation depends on appliance type, fault and spare parts required.',
  },
};

export default function ServiceDetailsScreen() {
  const router = useRouter();

  const { service } = useLocalSearchParams<{
    service: string;
  }>();

  const serviceName =
    typeof service === 'string' ? service : 'Home Service';

  const details =
    serviceData[serviceName] || {
      emoji: '🏠',
      description: 'Explore professional home maintenance services.',
      services: ['Home maintenance assistance'],
      included: ['Requirement review', 'Service inspection'],
      pricing: 'The quotation depends on the selected work.',
    };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Back Button */}
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {/* Service Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.emoji}>{details.emoji}</Text>

        <Text style={styles.title}>{serviceName}</Text>

        <Text style={styles.subtitle}>
          Your Home, Our Care.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>
          About This Service
        </Text>

        <Text style={styles.description}>
          {details.description}
        </Text>

        <Text style={styles.sectionTitle}>
          Services We Offer
        </Text>

        {details.services.map((item, index) => (
          <Text style={styles.listItem} key={index}>
            ✓ {item}
          </Text>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>
          What's Included?
        </Text>

        {details.included.map((item, index) => (
          <Text style={styles.listItem} key={index}>
            ✓ {item}
          </Text>
        ))}

        {/* Estimated Budget */}
        <View style={styles.priceBox}>
          <Text style={styles.priceHeading}>
            Pricing Information
          </Text>

          <Text style={styles.price}>
            Free Inspection & Custom Quotation
          </Text>

          <Text style={styles.priceDescription}>
            {details.pricing}
            {'\n\n'}
            Our service team will inspect your requirements and
            provide a quotation. Work starts only after your approval.
          </Text>
        </View>

        {/* Book Service Button */}
        <Pressable
          style={styles.bookButton}
          onPress={() =>
            router.push({
              pathname: '/booking',
              params: { service: serviceName },
            })
          }
        >
          <Text style={styles.bookButtonText}>
            Book This Service →
          </Text>
        </Pressable>

        {/* Service Benefits */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ✓ Trusted service professionals
          </Text>

          <Text style={styles.infoText}>
            ✓ Convenient booking
          </Text>

          <Text style={styles.infoText}>
            ✓ Free initial inspection
          </Text>

          <Text style={styles.infoText}>
            ✓ Customer approval before work
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E5',
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },

  backText: {
    fontSize: 16,
    color: '#B85D32',
    fontWeight: 'bold',
  },

  detailsCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 18,
    marginTop: 25,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  emoji: {
    fontSize: 55,
    textAlign: 'center',
    marginBottom: 15,
  },

  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#B85D32',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#8C756A',
    textAlign: 'center',
    marginTop: 8,
  },

  divider: {
    height: 1,
    backgroundColor: '#EAD8C9',
    marginVertical: 22,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#392D28',
    marginTop: 20,
  },

  description: {
    fontSize: 15,
    color: '#8C756A',
    lineHeight: 24,
    marginTop: 12,
  },

  listItem: {
    fontSize: 15,
    color: '#392D28',
    marginTop: 13,
    lineHeight: 22,
  },

  priceBox: {
    backgroundColor: '#FFF1E5',
    padding: 18,
    borderRadius: 12,
    marginTop: 25,
  },

  priceHeading: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#392D28',
  },

  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B85D32',
    marginTop: 10,
  },

  priceDescription: {
    fontSize: 14,
    color: '#8C756A',
    lineHeight: 22,
    marginTop: 8,
  },

  bookButton: {
    backgroundColor: '#B85D32',
    padding: 16,
    borderRadius: 12,
    marginTop: 22,
    alignItems: 'center',
  },

  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  infoBox: {
    backgroundColor: '#FFF1E5',
    padding: 15,
    borderRadius: 12,
    marginTop: 22,
  },

  infoText: {
    fontSize: 14,
    color: '#392D28',
    marginVertical: 7,
  },
});
