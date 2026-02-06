/**
 * Inventory Scanner App
 * React Native application for EDA52 barcode scanner
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Header } from './src/components/Header';
import { ToastProvider, useToast } from './src/components/Toast';
import { Modal } from './src/components/Modal';
import { Button } from './src/components/Button';

import { FileUploadScreen } from './src/screens/FileUploadScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { ItemsListScreen } from './src/screens/ItemsListScreen';

import {
  getMasterData,
  saveMasterData,
  clearMasterData,
  verifyPasswordAndUnlock,
  getScannedItems,
  addScannedItem,
  removeScannedItem,
  clearScannedItems,
  getWarehouseName,
} from './src/utils/storage';

import { Colors } from './src/constants/colors';

const AppContent = () => {
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [masterData, setMasterData] = useState(null);
  const [scannedItems, setScannedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('scan');
  const [showSettings, setShowSettings] = useState(false);
  const [warehouseName, setWarehouseName] = useState('Inventory Report');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const storedMasterData = await getMasterData();
      const storedItems = await getScannedItems();
      const storedWarehouseName = await getWarehouseName();
      
      if (storedMasterData) {
        setMasterData(storedMasterData);
      }
      setScannedItems(storedItems);
      setWarehouseName(storedWarehouseName);
    } catch (error) {
      console.error('Error initializing app:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileLoaded = useCallback(async (data, filename) => {
    // Extract warehouse name from filename (remove extension)
    const nameWithoutExt = filename.replace(/\.(xlsx|xls|csv)$/i, '');
    const extractedName = nameWithoutExt || 'Inventory Report';
    
    await saveMasterData(data, extractedName);
    setMasterData(data);
    setWarehouseName(extractedName);
    toast.success(`Loaded ${data.length} items from ${filename}`);
  }, [toast]);

  const handleUnlock = useCallback(async (password) => {
    const success = await verifyPasswordAndUnlock(password);
    if (success) {
      await clearMasterData();
      setMasterData(null);
      setWarehouseName('Inventory Report');
      toast.success('File unlocked. You can now upload a new file.');
      return true;
    }
    return false;
  }, [toast]);

  const handleSaveItem = useCallback(async (item) => {
    const updatedItems = await addScannedItem(item);
    setScannedItems(updatedItems);
  }, []);

  const handleRemoveItem = useCallback(async (id) => {
    const updatedItems = await removeScannedItem(id);
    setScannedItems(updatedItems);
  }, []);

  const handleClearAll = useCallback(async () => {
    await clearScannedItems();
    setScannedItems([]);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!masterData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <FileUploadScreen
          onFileLoaded={handleFileLoaded}
          existingData={null}
          onUnlock={handleUnlock}
          toast={toast}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <Header />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'scan' && styles.tabButtonActive]}
          onPress={() => setActiveTab('scan')}
        >
          <Text style={styles.tabIcon}>▮▮▮</Text>
          <Text style={[styles.tabText, activeTab === 'scan' && styles.tabTextActive]}>
            Scan
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'items' && styles.tabButtonActive]}
          onPress={() => setActiveTab('items')}
        >
          <Text style={styles.tabIcon}>☰</Text>
          <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>
            Items
          </Text>
          {scannedItems.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{scannedItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'scan' ? (
          <ScannerScreen
            masterData={masterData}
            onSaveItem={handleSaveItem}
            toast={toast}
          />
        ) : (
          <ItemsListScreen
            items={scannedItems}
            onRemoveItem={handleRemoveItem}
            onClearAll={handleClearAll}
            toast={toast}
            warehouseName={warehouseName}
          />
        )}
      </View>

      <Modal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        title="Settings"
      >
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Warehouse</Text>
          <View style={styles.settingsInfo}>
            <Text style={styles.settingsInfoText}>
              {warehouseName}
            </Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Master Data</Text>
          <View style={styles.settingsInfo}>
            <Text style={styles.settingsInfoText}>
              {masterData.length} items loaded
            </Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            IoW - Inventory on Wheels v1.0{'\n'}
            For EDA52 Barcode Scanner
          </Text>
        </View>

        <Button
          title="Close"
          variant="outline"
          onPress={() => setShowSettings(false)}
          style={styles.closeButton}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  settingsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  settingsSectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  settingsInfo: {
    backgroundColor: Colors.backgroundLight,
    padding: 8,
    borderRadius: 4,
  },
  settingsInfoText: {
    fontSize: 14,
    color: Colors.text,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  closeButton: {
    marginTop: 24,
  },
});
