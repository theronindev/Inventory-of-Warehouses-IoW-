/**
 * App Header Component
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import { Colors } from '../constants/colors';

export const Header = () => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.accent} barStyle="light-content" />
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Inventory of Warehouse</Text>
          <Text style={styles.subtitle}>(IoW)</Text>
        </View>
        
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.accent,
    paddingTop: StatusBar.currentHeight || 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginRight: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  logo: {
    width: 100,
    height: 36,
  },
});

export default Header;
