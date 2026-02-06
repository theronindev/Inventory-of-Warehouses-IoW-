/**
 * Items List Screen
 * Export to PDF (Print) or XLSX (Export)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal as RNModal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { formatDate, exportToPDF, exportToXLSX, shareFile } from '../utils/fileUtils';

export const ItemsListScreen = ({
  items,
  onRemoveItem,
  onClearAll,
  toast,
  warehouseName = 'Inventory Report',
}) => {
  const [expandedItem, setExpandedItem] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' or 'xlsx'
  const [editableWarehouse, setEditableWarehouse] = useState(warehouseName);
  const [cvCode, setCvCode] = useState('');

  // Reset editable values when modal opens
  const openExportModal = () => {
    setEditableWarehouse(warehouseName);
    setCvCode('');
    setShowExportModal(true);
  };

  const handleCvCodeChange = (text) => {
    // Only allow numbers
    const numbersOnly = text.replace(/[^0-9]/g, '');
    setCvCode(numbersOnly);
  };

  const handleExport = async () => {
    if (items.length === 0) {
      toast?.warning('No items to export');
      return;
    }

    setShowExportModal(false);
    setIsExporting(true);

    try {
      let fileUri;
      let mimeType;
      
      // Create filename from warehouse name
      const safeFilename = editableWarehouse.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      
      // Combine warehouse and CV code for display
      const displayTitle = cvCode ? `${editableWarehouse} - ${cvCode}` : editableWarehouse;
      
      if (exportFormat === 'xlsx') {
        fileUri = await exportToXLSX(items, safeFilename, displayTitle, cvCode);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        fileUri = await exportToPDF(items, safeFilename, displayTitle, cvCode);
        mimeType = 'application/pdf';
      }
      
      const shared = await shareFile(fileUri, mimeType);
      
      if (shared) {
        const action = exportFormat === 'pdf' ? 'Printed' : 'Exported';
        toast?.success(`${action} ${items.length} items to ${exportFormat.toUpperCase()}`);
      } else {
        toast?.info(`${exportFormat.toUpperCase()} file saved successfully`);
      }

    } catch (error) {
      console.error('Export error:', error);
      toast?.error(`Failed to export ${exportFormat.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const confirmRemove = (id) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            onRemoveItem(id);
            toast?.success('Item removed');
          },
        },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No items scanned yet</Text>
        <Text style={styles.emptySubtitle}>
          Start scanning items to see them here
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const isExpanded = expandedItem === item.id;

    return (
      <View style={styles.itemCard}>
        <TouchableOpacity
          style={styles.itemHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemCode}>{item.itemCode}</Text>
            <Text style={styles.itemBrand} numberOfLines={1}>
              {item.brandName || 'No brand'}
            </Text>
          </View>
          <View style={styles.itemMeta}>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>
                {item.quantities?.length || 0} qty
              </Text>
            </View>
            <View style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
              <Text style={styles.expandIconText}>▼</Text>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.itemDetails}>
            <View style={styles.itemDescription}>
              <Text style={styles.descriptionText}>
                {item.itemDescription || 'No description'}
              </Text>
            </View>
            
            <Text style={styles.itemUom}>
              UOM: <Text style={styles.itemUomValue}>{item.uom || '-'}</Text>
            </Text>

            {item.barcode && (
              <Text style={styles.itemBarcode}>
                Barcode: <Text style={styles.itemBarcodeValue}>{item.barcode}</Text>
              </Text>
            )}

            <View style={styles.quantitiesSection}>
              <Text style={styles.quantitiesTitle}>Quantities & Expiry:</Text>
              <View style={styles.qtyGrid}>
                {item.quantities?.map((qty, qIndex) => (
                  <View key={qIndex} style={styles.qtyItem}>
                    <Text style={styles.qtyNumber}>#{qIndex + 1}</Text>
                    <Text style={styles.qtyValue}>{qty.quantity}</Text>
                    <Text style={styles.qtyExpiry}>{formatDate(qty.expiry)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.itemActions}>
              <Button
                title="Remove"
                variant="danger"
                size="small"
                onPress={() => confirmRemove(item.id)}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  // Get button text based on format
  const getExportButtonText = () => {
    return exportFormat === 'pdf' ? 'Print' : 'Export XLSX';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.itemCount}>
          <Text style={styles.countNumber}>{items.length}</Text>
          <Text style={styles.countLabel}>Items Scanned</Text>
        </View>
        <View style={styles.headerActions}>
          <Button
            title="Clear All"
            variant="outline"
            size="small"
            onPress={() => setShowClearConfirm(true)}
          />
          <Button
            title="Export"
            variant="primary"
            size="small"
            onPress={openExportModal}
            loading={isExporting}
          />
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Export Format Selection Modal */}
      <RNModal
        visible={showExportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exportModalContainer}>
            {/* Header */}
            <View style={styles.exportModalHeader}>
              <Text style={styles.exportModalTitle}>Export Report</Text>
              <TouchableOpacity 
                onPress={() => setShowExportModal(false)}
                style={styles.closeIconButton}
              >
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.exportModalBody} showsVerticalScrollIndicator={false}>
              {/* Editable Warehouse/Department and CV Code */}
              <View style={styles.editableFieldsRow}>
                <View style={styles.warehouseFieldContainer}>
                  <Text style={styles.fieldLabel}>Warehouse / Department</Text>
                  <TextInput
                    style={styles.editableInput}
                    value={editableWarehouse}
                    onChangeText={setEditableWarehouse}
                    placeholder="Enter warehouse name"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.cvCodeFieldContainer}>
                  <Text style={styles.fieldLabel}>CV Code</Text>
                  <TextInput
                    style={styles.editableInput}
                    value={cvCode}
                    onChangeText={handleCvCodeChange}
                    placeholder="000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Preview */}
              {(editableWarehouse || cvCode) && (
                <View style={styles.previewBox}>
                  <Text style={styles.previewLabel}>Preview:</Text>
                  <Text style={styles.previewText}>
                    {cvCode ? `${editableWarehouse} - ${cvCode}` : editableWarehouse}
                  </Text>
                </View>
              )}

              {/* Format Selection */}
              <Text style={styles.formatTitle}>Select Format:</Text>
              
              {/* PDF Option */}
              <TouchableOpacity
                style={[
                  styles.formatOption,
                  exportFormat === 'pdf' && styles.formatOptionActive
                ]}
                onPress={() => setExportFormat('pdf')}
                activeOpacity={0.7}
              >
                <View style={styles.formatIconBox}>
                  <Text style={styles.formatIcon}>📄</Text>
                </View>
                <View style={styles.formatInfo}>
                  <Text style={[
                    styles.formatLabel,
                    exportFormat === 'pdf' && styles.formatLabelActive
                  ]}>PDF Document</Text>
                  <Text style={styles.formatDesc}>Best for printing</Text>
                </View>
                {exportFormat === 'pdf' && (
                  <View style={styles.formatCheck}>
                    <Text style={styles.formatCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* XLSX Option */}
              <TouchableOpacity
                style={[
                  styles.formatOption,
                  exportFormat === 'xlsx' && styles.formatOptionActive
                ]}
                onPress={() => setExportFormat('xlsx')}
                activeOpacity={0.7}
              >
                <View style={styles.formatIconBox}>
                  <Text style={styles.formatIcon}>📊</Text>
                </View>
                <View style={styles.formatInfo}>
                  <Text style={[
                    styles.formatLabel,
                    exportFormat === 'xlsx' && styles.formatLabelActive
                  ]}>Excel Spreadsheet</Text>
                  <Text style={styles.formatDesc}>Best for editing</Text>
                </View>
                {exportFormat === 'xlsx' && (
                  <View style={styles.formatCheck}>
                    <Text style={styles.formatCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.exportModalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={handleExport}
              >
                <Text style={styles.exportButtonText}>{getExportButtonText()}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>

      {/* Clear Confirmation Modal */}
      <Modal
        visible={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Items?"
      >
        <Text style={styles.clearModalText}>
          This will remove all {items.length} scanned items. This action cannot be undone.
        </Text>
        <View style={styles.clearModalButtons}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => setShowClearConfirm(false)}
            style={styles.clearModalButton}
          />
          <Button
            title="Clear All"
            variant="danger"
            onPress={() => {
              onClearAll();
              setShowClearConfirm(false);
              toast?.success('All items cleared');
            }}
            style={styles.clearModalButton}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  countNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  countLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemCode: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  itemBrand: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qtyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  expandIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  expandIconText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  itemDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight,
  },
  itemDescription: {
    backgroundColor: Colors.backgroundLight,
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  itemUom: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  itemUomValue: {
    color: Colors.text,
    fontWeight: '500',
  },
  itemBarcode: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  itemBarcodeValue: {
    color: Colors.text,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  quantitiesSection: {
    marginBottom: 16,
  },
  quantitiesTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  qtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qtyItem: {
    backgroundColor: Colors.backgroundLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: 8,
    borderRadius: 4,
    minWidth: 100,
  },
  qtyNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.accent,
  },
  qtyExpiry: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight,
  },
  // Export Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exportModalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  exportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  exportModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.accent,
  },
  closeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  exportModalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  editableFieldsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  warehouseFieldContainer: {
    flex: 2,
  },
  cvCodeFieldContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  editableInput: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  previewBox: {
    backgroundColor: Colors.accent,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  exportItemCount: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  formatTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.white,
    marginBottom: 10,
  },
  formatOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#f0f7f6',
  },
  formatIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  formatIcon: {
    fontSize: 20,
  },
  formatInfo: {
    flex: 1,
  },
  formatLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  formatLabelActive: {
    color: Colors.primary,
  },
  formatDesc: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  formatCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatCheckText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  exportModalFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  exportButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  // Clear Modal Styles
  clearModalText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
    lineHeight: 22,
  },
  clearModalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  clearModalButton: {
    flex: 1,
  },
});

export default ItemsListScreen;
