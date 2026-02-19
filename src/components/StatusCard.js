import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';

export default function StatusCard({ title, value, status = 'normal' }) {
  const statusColor = status === 'success' ? COLORS.success :
                      status === 'error' ? COLORS.error :
                      status === 'warning' ? COLORS.warning : COLORS.primary;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: statusColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});