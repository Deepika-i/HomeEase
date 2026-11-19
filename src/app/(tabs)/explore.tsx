
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';

import AnimatedButton from '@/components/animated-button';
import AnimatedCard from '@/components/animated-card';

const mainServices = [
  { name: 'Cleaning', emoji: '🧹', description: 'Home and deep cleaning' },
  { name: 'Plumbing', emoji: '🔧', description: 'Pipes, taps and leaks' },
  { name: 'Electrical', emoji: '💡', description: 'Repairs and installations' },
  { name: 'Painting', emoji: '🎨', description: 'Interior and exterior painting' },
  { name: 'AC Service', emoji: '❄️', description: 'AC cleaning and repair' },
];

const moreServices = [
  { name: 'Maid / Housekeeping', emoji: '🧽', description: 'Daily home cleaning support' },
  { name: 'Cooking', emoji: '👩‍🍳', description: 'Home cooking assistance' },
  { name: 'Carpentry', emoji: '🪚', description: 'Furniture repair and fitting' },
  { name: 'Gardening', emoji: '🪴', description: 'Garden and plant maintenance' },
  { name: 'Pest Control', emoji: '🐜', description: 'Home pest treatment' },
  { name: 'Appliance Repair', emoji: '🛠️', description: 'Home appliance repairs' },
];

type ServiceItem = {
  name: string;
  emoji: string;
  description: string;
};

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filteredMain = useMemo(
    () =>
      mainServices.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase().trim())
      ),
    [search]
  );

  const filteredMore = useMemo(
    () =>
      moreServices.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase().trim())
      ),
    [search]
  );

  const openService = (serviceName: string) => {
    router.push({
      pathname: '/service-details',
      params: { service: serviceName },
    });
  };

  const openReviews = (serviceName: string) => {
    router.push({
      pathname: '/service-reviews',
      params: { service: serviceName },
    });
  };

  const renderService = (item: ServiceItem, index: number) => (
    <AnimatedCard
      key={item.name}
      style={styles.cardWrapper}
      delay={index * 70}
    >
      <View style={styles.serviceCard}>
        <AnimatedButton
          onPress={() => openService(item.name)}
          style={styles.serviceAction}
        >
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceEmoji}>{item.emoji}</Text>

            <Text style={styles.serviceName} numberOfLines={2}>
              {item.name}
            </Text>

            <Text style={styles.serviceDescription} numberOfLines={2}>
              {item.description}
            </Text>

            <Text style={styles.viewText}>View details →</Text>
          </View>
        </AnimatedButton>

        <View style={styles.cardDivider} />

        <Pressable
          onPress={() => openReviews(item.name)}
          style={styles.reviewButton}
        >
          <Text style={styles.reviewText}>⭐ Reviews</Text>
        </Pressable>
      </View>
    </AnimatedCard>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <AnimatedCard>
        <Text style={styles.heading}>Explore Services</Text>

        <Text style={styles.subtitle}>
          Find the right help for your home.
        </Text>
      </AnimatedCard>

      <AnimatedCard delay={100}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a service..."
          placeholderTextColor="#A9978D"
          value={search}
          onChangeText={setSearch}
        />
      </AnimatedCard>

      <AnimatedCard delay={150}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Services</Text>

          <Text style={styles.sectionSubtitle}>
            Services for your everyday needs
          </Text>
        </View>
      </AnimatedCard>

      {filteredMain.length > 0 ? (
        <View style={styles.servicesGrid}>
          {filteredMain.map((item, index) =>
            renderService(item, index)
          )}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          No popular services found.
        </Text>
      )}

      <AnimatedCard>
        <View style={styles.moreHeader}>
          <Text style={styles.sectionTitle}>More Services</Text>

          <Text style={styles.sectionSubtitle}>
            More ways to take care of your home
          </Text>
        </View>
      </AnimatedCard>

      {filteredMore.length > 0 ? (
        <View style={styles.servicesGrid}>
          {filteredMore.map((item, index) =>
            renderService(item, index + 5)
          )}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          No additional services found.
        </Text>
      )}

      <AnimatedCard delay={150}>
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>HomeEase</Text>

          <Text style={styles.footerText}>
            Your Home, Our Care.
          </Text>
        </View>
      </AnimatedCard>
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
    paddingTop: 55,
    paddingBottom: 110,
  },

  heading: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#392D28',
  },

  subtitle: {
    fontSize: 15,
    color: '#8C756A',
    marginTop: 7,
  },

  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: '#392D28',
    marginTop: 24,
  },

  sectionHeader: {
    marginTop: 30,
    marginBottom: 15,
  },

  moreHeader: {
    marginTop: 30,
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#392D28',
  },

  sectionSubtitle: {
    fontSize: 13,
    color: '#8C756A',
    marginTop: 5,
  },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },

  cardWrapper: {
    width: '48%',
  },

  serviceCard: {
    width: '100%',
    height: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAD8C9',
    justifyContent: 'space-between',
  },

  serviceAction: {
    height: 160,
  },

  serviceDetails: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  serviceEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },

  serviceName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#392D28',
    minHeight: 20,
  },

  serviceDescription: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 6,
    lineHeight: 18,
    minHeight: 36,
  },

  viewText: {
    color: '#B85D32',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#EAD8C9',
    marginTop: 8,
  },

  reviewButton: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reviewText: {
    color: '#B85D32',
    fontSize: 12,
    fontWeight: 'bold',
  },

  emptyText: {
    color: '#8C756A',
    fontSize: 14,
    paddingVertical: 15,
  },

  footer: {
    alignItems: 'center',
    marginTop: 35,
  },

  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B85D32',
  },

  footerText: {
    color: '#8C756A',
    marginTop: 5,
  },
});
