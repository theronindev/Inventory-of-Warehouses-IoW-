/**
 * Storage Utility Functions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  MASTER_DATA: '@inventory_master_data',
  SCANNED_ITEMS: '@inventory_scanned_items',
  FILE_LOCKED: '@inventory_file_locked',
  WAREHOUSE_NAME: '@inventory_warehouse_name',
};

const FILE_PASSWORD = 'IoWP@ssw0rd';

export const saveMasterData = async (data, warehouseName = '') => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.MASTER_DATA, JSON.stringify(data));
    await AsyncStorage.setItem(STORAGE_KEYS.FILE_LOCKED, 'true');
    if (warehouseName) {
      await AsyncStorage.setItem(STORAGE_KEYS.WAREHOUSE_NAME, warehouseName);
    }
    return true;
  } catch (error) {
    console.error('Error saving master data:', error);
    return false;
  }
};

export const getMasterData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MASTER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting master data:', error);
    return null;
  }
};

export const getWarehouseName = async () => {
  try {
    const name = await AsyncStorage.getItem(STORAGE_KEYS.WAREHOUSE_NAME);
    return name || 'Inventory Report';
  } catch (error) {
    console.error('Error getting warehouse name:', error);
    return 'Inventory Report';
  }
};

export const isFileLocked = async () => {
  try {
    const locked = await AsyncStorage.getItem(STORAGE_KEYS.FILE_LOCKED);
    return locked === 'true';
  } catch (error) {
    return false;
  }
};

export const verifyPasswordAndUnlock = async (password) => {
  if (password === FILE_PASSWORD) {
    await AsyncStorage.setItem(STORAGE_KEYS.FILE_LOCKED, 'false');
    return true;
  }
  return false;
};

export const clearMasterData = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.MASTER_DATA);
    await AsyncStorage.removeItem(STORAGE_KEYS.FILE_LOCKED);
    await AsyncStorage.removeItem(STORAGE_KEYS.WAREHOUSE_NAME);
    return true;
  } catch (error) {
    console.error('Error clearing master data:', error);
    return false;
  }
};

export const saveScannedItems = async (items) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SCANNED_ITEMS, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error('Error saving scanned items:', error);
    return false;
  }
};

export const getScannedItems = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SCANNED_ITEMS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting scanned items:', error);
    return [];
  }
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const addScannedItem = async (item) => {
  const items = await getScannedItems();
  const newItem = {
    ...item,
    id: generateId(),
    scanDate: new Date().toISOString(),
  };
  items.push(newItem);
  await saveScannedItems(items);
  return items;
};

export const removeScannedItem = async (id) => {
  const items = await getScannedItems();
  const filtered = items.filter(item => item.id !== id);
  await saveScannedItems(filtered);
  return filtered;
};

export const clearScannedItems = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SCANNED_ITEMS);
    return true;
  } catch (error) {
    console.error('Error clearing scanned items:', error);
    return false;
  }
};
