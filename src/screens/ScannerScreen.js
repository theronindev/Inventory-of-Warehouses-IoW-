/**
 * Scanner Screen
 * - Camera barcode scanning
 * - Manual barcode/item code entry
 * - Duplicate scan detection
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../constants/colors';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { findItemByBarcode, findItemByCode, extractItemDetails, formatDate } from '../utils/fileUtils';

const { width: screenWidth } = Dimensions.get('window');

// Month options
const MONTHS = [
  { label: 'Jan', value: '0' },
  { label: 'Feb', value: '1' },
  { label: 'Mar', value: '2' },
  { label: 'Apr', value: '3' },
  { label: 'May', value: '4' },
  { label: 'Jun', value: '5' },
  { label: 'Jul', value: '6' },
  { label: 'Aug', value: '7' },
  { label: 'Sep', value: '8' },
  { label: 'Oct', value: '9' },
  { label: 'Nov', value: '10' },
  { label: 'Dec', value: '11' },
];

// Generate day options (1-31)
const generateDays = () => {
  const days = [];
  for (let i = 1; i <= 31; i++) {
    days.push({ label: String(i).padStart(2, '0'), value: String(i) });
  }
  return days;
};

// Generate year options (current year to +10 years)
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i <= currentYear + 10; i++) {
    years.push({ label: String(i), value: String(i) });
  }
  return years;
};

const DAYS = generateDays();
const YEARS = generateYears();

// Custom Dropdown Component
const CustomDropdown = ({ label, value, options, onSelect, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <View style={dropdownStyles.container}>
      <Text style={dropdownStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          dropdownStyles.button,
          value ? dropdownStyles.buttonSelected : null
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          dropdownStyles.buttonText,
          value ? dropdownStyles.buttonTextSelected : dropdownStyles.buttonTextPlaceholder
        ]}>
          {displayText}
        </Text>
        <Text style={dropdownStyles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={dropdownStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={dropdownStyles.modalContent}>
            <View style={dropdownStyles.modalHeader}>
              <Text style={dropdownStyles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={dropdownStyles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    dropdownStyles.option,
                    value === item.value && dropdownStyles.optionSelected
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    dropdownStyles.optionText,
                    value === item.value && dropdownStyles.optionTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {value === item.value && (
                    <Text style={dropdownStyles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              style={dropdownStyles.optionsList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const dropdownStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  buttonSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#f0f7f6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  buttonTextSelected: {
    color: Colors.primary,
  },
  buttonTextPlaceholder: {
    color: Colors.textMuted,
  },
  arrow: {
    fontSize: 10,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
  },
  closeButton: {
    fontSize: 18,
    color: Colors.textMuted,
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  optionSelected: {
    backgroundColor: '#f0f7f6',
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
});

export const ScannerScreen = ({
  masterData,
  onSaveItem,
  toast,
}) => {
  const [barcodeValue, setBarcodeValue] = useState('');
  const [itemCodeValue, setItemCodeValue] = useState('');
  const [activeInput, setActiveInput] = useState(null);
  const [foundItem, setFoundItem] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [quantities, setQuantities] = useState([
    { quantity: '', day: '', month: '', year: '' },
    { quantity: '', day: '', month: '', year: '' },
    { quantity: '', day: '', month: '', year: '' },
  ]);
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  
  const barcodeInputRef = useRef(null);
  const lastBarcodeRef = useRef('');
  const lastInputTimeRef = useRef(0);

  /**
   * Extract new barcode if scanner appends to existing value
   */
  const extractNewBarcode = (newValue, oldValue) => {
    if (!newValue) return '';
    if (!oldValue) return newValue;
    
    const trimmedNew = newValue.trim();
    const trimmedOld = oldValue.trim();
    
    if (trimmedNew.startsWith(trimmedOld) && trimmedNew.length > trimmedOld.length) {
      const extracted = trimmedNew.substring(trimmedOld.length).trim();
      if (extracted.length >= 4) {
        return extracted;
      }
    }
    
    const halfLength = Math.floor(trimmedNew.length / 2);
    if (halfLength >= 4) {
      const firstHalf = trimmedNew.substring(0, halfLength);
      const secondHalf = trimmedNew.substring(halfLength);
      if (firstHalf === secondHalf) {
        return firstHalf;
      }
    }
    
    const commonLengths = [8, 12, 13, 14];
    for (const len of commonLengths) {
      if (trimmedNew.length === len * 2) {
        const first = trimmedNew.substring(0, len);
        const second = trimmedNew.substring(len);
        if (first === second) {
          return first;
        }
      }
    }
    
    return trimmedNew;
  };

  const handleBarcodeChange = (text) => {
    const now = Date.now();
    const timeDiff = now - lastInputTimeRef.current;
    lastInputTimeRef.current = now;
    
    let processedText = text;
    
    if (barcodeValue && text.length > barcodeValue.length && timeDiff < 500) {
      processedText = extractNewBarcode(text, barcodeValue);
    } else if (text.length > 20) {
      processedText = extractNewBarcode(text, '');
    }
    
    setBarcodeValue(processedText);
    lastBarcodeRef.current = processedText;
    
    if (processedText) {
      setActiveInput('barcode');
      setItemCodeValue('');
    } else if (!itemCodeValue) {
      setActiveInput(null);
    }
  };

  const handleItemCodeChange = (text) => {
    setItemCodeValue(text);
    if (text) {
      setActiveInput('itemCode');
      setBarcodeValue('');
      lastBarcodeRef.current = '';
    } else if (!barcodeValue) {
      setActiveInput(null);
    }
  };

  // Camera barcode scanned handler
  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    setShowCamera(false);
    setBarcodeValue(data);
    setActiveInput('barcode');
    setItemCodeValue('');
    lastBarcodeRef.current = data;
    
    toast?.success(`Barcode scanned: ${data}`);
    
    // Auto-search after scan
    setTimeout(() => {
      performSearch(data, 'barcode');
    }, 300);
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        toast?.error('Camera permission is required to scan barcodes');
        return;
      }
    }
    setScanned(false);
    setShowCamera(true);
  };

  const performSearch = (searchValue, searchType) => {
    if (!searchValue?.trim()) {
      toast?.warning('Please enter a barcode or item code');
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      let found = null;
      
      if (searchType === 'barcode') {
        found = findItemByBarcode(masterData, searchValue);
        if (!found) {
          toast?.error('Barcode not found in master data');
        }
      } else {
        found = findItemByCode(masterData, searchValue);
        if (!found) {
          toast?.error('Item code not found in master data');
        }
      }
      
      if (found) {
        const itemDetails = extractItemDetails(found);
        setFoundItem(itemDetails);
        setQuantities([
          { quantity: '', day: '', month: '', year: '' },
          { quantity: '', day: '', month: '', year: '' },
          { quantity: '', day: '', month: '', year: '' },
        ]);
        toast?.success('Item found!');
      } else {
        setFoundItem(null);
      }
      
      setIsSearching(false);
    }, 300);
  };

  const handleSearch = () => {
    const searchByBarcode = activeInput === 'barcode' && barcodeValue.trim();
    const searchByItemCode = activeInput === 'itemCode' && itemCodeValue.trim();
    
    if (searchByBarcode) {
      performSearch(barcodeValue, 'barcode');
    } else if (searchByItemCode) {
      performSearch(itemCodeValue, 'itemCode');
    } else {
      toast?.warning('Please enter a barcode or item code');
    }
  };

  const handleQuantityChange = (index, field, value) => {
    setQuantities(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const isDateValid = (day, month, year) => {
    if (!day || month === '' || !year) return false;
    
    const selectedDate = new Date(parseInt(year), parseInt(month), parseInt(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate.getMonth() !== parseInt(month)) return false;
    return selectedDate >= today;
  };

  const isDateComplete = (qty) => {
    return qty.day && qty.month !== '' && qty.year;
  };

  const getDateFromFields = (qty) => {
    if (!isDateComplete(qty)) return null;
    return new Date(parseInt(qty.year), parseInt(qty.month), parseInt(qty.day));
  };

  const getMonthLabel = (monthValue) => {
    const month = MONTHS.find(m => m.value === monthValue);
    return month ? month.label : '';
  };

  const handleAddQuantity = () => {
    setQuantities(prev => [...prev, { quantity: '', day: '', month: '', year: '' }]);
  };

  const handleRemoveQuantity = (index) => {
    if (quantities.length > 3) {
      setQuantities(prev => prev.filter((_, i) => i !== index));
    }
  };

  const isAtLeastOneFilled = () => {
    return quantities.some(q => q.quantity && isDateComplete(q) && isDateValid(q.day, q.month, q.year));
  };

  const canSave = () => {
    if (!foundItem) return false;
    return quantities.some(q => {
      if (!q.quantity || !isDateComplete(q)) return false;
      return isDateValid(q.day, q.month, q.year);
    });
  };

  const handleSave = () => {
    for (const qty of quantities) {
      if (qty.quantity && isDateComplete(qty)) {
        if (!isDateValid(qty.day, qty.month, qty.year)) {
          toast?.error('Please select valid future dates for all expiry fields');
          return;
        }
      }
    }

    if (!canSave()) {
      toast?.warning('Please fill at least one quantity with a valid future expiry date');
      return;
    }

    const validQuantities = quantities
      .filter(q => q.quantity && isDateComplete(q) && isDateValid(q.day, q.month, q.year))
      .map(q => ({
        quantity: q.quantity,
        expiry: getDateFromFields(q).toISOString(),
      }));

    const itemToSave = {
      ...foundItem,
      quantities: validQuantities,
      scannedBarcode: barcodeValue || itemCodeValue,
    };

    onSaveItem(itemToSave);
    toast?.success('Item saved successfully!');
    handleClear();
    barcodeInputRef.current?.focus();
  };

  const handleClear = () => {
    setBarcodeValue('');
    setItemCodeValue('');
    lastBarcodeRef.current = '';
    setActiveInput(null);
    setFoundItem(null);
    setQuantities([
      { quantity: '', day: '', month: '', year: '' },
      { quantity: '', day: '', month: '', year: '' },
      { quantity: '', day: '', month: '', year: '' },
    ]);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Camera Scanner Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.cameraContainer}>
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraTitle}>Scan Barcode</Text>
            <TouchableOpacity 
              style={styles.cameraCloseBtn}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.cameraCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                'ean13', 'ean8', 'upc_a', 'upc_e',
                'code39', 'code93', 'code128',
                'itf14', 'codabar', 'qr', 'pdf417',
              ],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.scanArea}>
                <View style={[styles.scanCorner, styles.topLeft]} />
                <View style={[styles.scanCorner, styles.topRight]} />
                <View style={[styles.scanCorner, styles.bottomLeft]} />
                <View style={[styles.scanCorner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanHint}>Position barcode within the frame</Text>
            </View>
          </CameraView>
          
          <TouchableOpacity 
            style={styles.cameraCancelBtn}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.cameraCancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Scan or Enter Item</Text>
        
        {/* Camera Scan Button */}
        <TouchableOpacity 
          style={styles.cameraScanBtn}
          onPress={openCamera}
          activeOpacity={0.8}
        >
          <Text style={styles.cameraScanIcon}>📷</Text>
          <Text style={styles.cameraScanText}>Scan with Camera</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <Input
          ref={barcodeInputRef}
          label="Scan Barcode (EDA52 / Manual)"
          value={barcodeValue}
          onChangeText={handleBarcodeChange}
          placeholder="Scan or enter barcode..."
          editable={activeInput !== 'itemCode'}
          leftIcon={<Text style={styles.inputIcon}>▮▮▮</Text>}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Input
          label="Enter Item Code"
          value={itemCodeValue}
          onChangeText={handleItemCodeChange}
          placeholder="Enter item code..."
          editable={activeInput !== 'barcode'}
          leftIcon={<Text style={styles.inputIcon}>⊞</Text>}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />

        <Button
          title={isSearching ? "Searching..." : "Search"}
          variant="primary"
          size="large"
          onPress={handleSearch}
          disabled={!barcodeValue && !itemCodeValue}
          loading={isSearching}
          style={styles.searchButton}
        />
      </View>

      {foundItem && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Brand Name</Text>
            <Text style={styles.detailValue}>
              {foundItem.brandName || '-'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Item Code</Text>
            <Text style={[styles.detailValue, styles.detailCode]}>
              {foundItem.itemCode || '-'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Item Description</Text>
            <Text style={styles.detailValue}>
              {foundItem.itemDescription || '-'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Item Barcode</Text>
            <Text style={[styles.detailValue, styles.detailCode]}>
              {foundItem.barcode || '-'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Warehouse UOM</Text>
            <Text style={styles.detailValue}>{foundItem.uom || '-'}</Text>
          </View>
        </View>
      )}

      {foundItem && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quantities & Expiry Dates</Text>
          <Text style={styles.dateHint}>Select Day, Month, Year (future dates only)</Text>
          
          {quantities.map((qty, index) => (
            <View key={index} style={styles.quantityRow}>
              <View style={styles.quantityHeader}>
                <Text style={styles.quantityLabel}>QTY {index + 1}</Text>
                {index >= 3 && (
                  <TouchableOpacity onPress={() => handleRemoveQuantity(index)}>
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.quantityInputRow}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={qty.quantity}
                  onChangeText={(text) => handleQuantityChange(index, 'quantity', text)}
                  placeholder="Enter qty"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <Text style={styles.inputLabel}>Expiry Date</Text>
              
              {isDateComplete(qty) && (
                <View style={[
                  styles.selectedDateDisplay,
                  isDateValid(qty.day, qty.month, qty.year) ? styles.dateValid : styles.dateInvalid
                ]}>
                  <Text style={styles.selectedDateText}>
                    {qty.day}/{getMonthLabel(qty.month)}/{qty.year}
                  </Text>
                  {isDateValid(qty.day, qty.month, qty.year) ? (
                    <Text style={styles.dateValidIcon}>✓</Text>
                  ) : (
                    <Text style={styles.dateInvalidIcon}>✕</Text>
                  )}
                </View>
              )}

              <View style={styles.dateFieldsRow}>
                <CustomDropdown
                  label="Day"
                  value={qty.day}
                  options={DAYS}
                  onSelect={(value) => handleQuantityChange(index, 'day', value)}
                  placeholder="DD"
                />
                <CustomDropdown
                  label="Month"
                  value={qty.month}
                  options={MONTHS}
                  onSelect={(value) => handleQuantityChange(index, 'month', value)}
                  placeholder="MMM"
                />
                <CustomDropdown
                  label="Year"
                  value={qty.year}
                  options={YEARS}
                  onSelect={(value) => handleQuantityChange(index, 'year', value)}
                  placeholder="YYYY"
                />
              </View>

              {isDateComplete(qty) && !isDateValid(qty.day, qty.month, qty.year) && (
                <Text style={styles.dateError}>Invalid or past date. Please select a valid future date.</Text>
              )}
            </View>
          ))}

          <Button
            title="Add New QTY & Expire"
            variant="outline"
            onPress={handleAddQuantity}
            disabled={!isAtLeastOneFilled()}
            style={styles.addButton}
          />
          
          {!isAtLeastOneFilled() && (
            <Text style={styles.addHint}>
              Fill at least 1 quantity/expiry pair to add more
            </Text>
          )}
        </View>
      )}

      {foundItem && (
        <View style={styles.actionButtons}>
          <Button
            title="Clear"
            variant="outline"
            size="large"
            onPress={handleClear}
            style={styles.clearButton}
          />
          <Button
            title="Save"
            variant="success"
            size="large"
            onPress={handleSave}
            disabled={!canSave()}
            style={styles.saveButton}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.backgroundLight,
  },
  // Camera Scan Button
  cameraScanBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraScanIcon: {
    fontSize: 28,
  },
  cameraScanText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  // Camera Modal
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cameraCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCloseBtnText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: screenWidth * 0.75,
    height: 200,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanHint: {
    marginTop: 24,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  cameraCancelBtn: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  cameraCancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dateHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  inputIcon: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchButton: {
    marginTop: 8,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    backgroundColor: Colors.backgroundLight,
    padding: 8,
    borderRadius: 4,
  },
  detailCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.primary,
    fontWeight: '600',
  },
  quantityRow: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  removeButton: {
    fontSize: 10,
    color: Colors.error,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  quantityInputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  quantityInput: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  selectedDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateValid: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: Colors.success,
  },
  dateInvalid: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.accent,
    marginRight: 8,
  },
  dateValidIcon: {
    fontSize: 18,
    color: Colors.success,
    fontWeight: '700',
  },
  dateInvalidIcon: {
    fontSize: 18,
    color: Colors.error,
    fontWeight: '700',
  },
  dateFieldsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateError: {
    color: Colors.error,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 8,
  },
  addHint: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});

export default ScannerScreen;
