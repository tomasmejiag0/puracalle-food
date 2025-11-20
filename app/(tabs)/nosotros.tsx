import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Users, Award, Phone, Mail, MapPin } from 'lucide-react-native';

const NosotrosScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sobre Nosotros </Text>
          <Text style={styles.subtitle}>Conoce nuestra historia</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Mission Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Heart size={24} color="#dc2626" />
              <Text style={styles.cardTitle}>Nuestra Misión</Text>
            </View>
            <Text style={styles.cardText}>
              Ofrecer las papas mas chimbas de la ciudad con ingredientes frescos, 
              sabores auténticos y un servicio excepcional que haga sonreír a nuestros clientes.
            </Text>
          </View>

          {/* Team Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Users size={24} color="#2563eb" />
              <Text style={styles.cardTitle}>Nuestro Equipo</Text>
            </View>
            <Text style={styles.cardText}>
              Somos una familia de apasionados por la gastronomía callejera, innovando y revolucionando 
              en el sector papas en Santa Fe de  Antioquia.
            </Text>
          </View>

          {/* Quality Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Award size={24} color="#eab308" />
              <Text style={styles.cardTitle}>Calidad Garantizada</Text>
            </View>
            <Text style={styles.cardText}>
              • Ingredientes frescos diarios{'\n'}
              • Recetas tradicionales{'\n'}
              • Preparación artesanal{'\n'}
              • Higiene y seguridad alimentaria
            </Text>
          </View>

          {/* Contact Info */}
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>¡Contáctanos! 📞</Text>
            
            <TouchableOpacity style={styles.contactItem}>
              <Phone size={20} color="#f97316" />
              <Text style={styles.contactText}>+57 3195802973</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem}>
              <Mail size={20} color="#f97316" />
              <Text style={styles.contactText}>info@puracalle.co</Text>
            </TouchableOpacity>

            <View style={styles.contactItem}>
              <MapPin size={20} color="#f97316" />
              <View style={styles.addressContainer}>
                <Text style={styles.contactText}>Parque Central</Text>
                <Text style={styles.addressDetail}>Lunes a Domingo</Text>
                <Text style={styles.addressDetail}>6:00 PM - 2:00 AM</Text>
              </View>
            </View>
          </View>

          {/* Values */}
          <View style={styles.valuesCard}>
            <Text style={styles.valuesTitle}>Nuestros Valores ⭐</Text>
            <View style={styles.valuesList}>
              <Text style={styles.valueItem}>🤝 Servicio al cliente</Text>
              <Text style={styles.valueItem}>🍟 Calidad en cada bocado</Text>
              <Text style={styles.valueItem}>🥔 Ingredientes naturales</Text>
              <Text style={styles.valueItem}>⚡ Rapidez en la entrega</Text>
              <Text style={styles.valueItem}>💸 Precios justos</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2e7', // Orange-50
  },
  header: {
    backgroundColor: '#f97316', // Orange-500
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#fed7aa', // Orange-200
    textAlign: 'center',
    fontSize: 16,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937', // Gray-800
    flex: 1,
  },
  cardText: {
    fontSize: 16,
    color: '#6b7280', // Gray-600
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: '#fef3c7', // Yellow-100
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  addressContainer: {
    flex: 1,
  },
  addressDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  valuesCard: {
    backgroundColor: '#ecfdf5', // Green-50
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  valuesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  valuesList: {
    gap: 8,
  },
  valueItem: {
    fontSize: 16,
    color: '#374151', // Gray-700
    lineHeight: 24,
  },
});

export default NosotrosScreen;