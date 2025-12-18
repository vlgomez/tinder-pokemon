import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function LoadingMoreIndicator({ visible }) {
  if (!visible) return null;
  return (
    <View testID="loading-more" style={styles.loadingMore}>
      <ActivityIndicator size="small" color="#e0e7ff" />
      <Text style={styles.loadingMoreText}>Cargando más…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingMore: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  loadingMoreText: { color: '#94a3b8', marginLeft: 8 },
});