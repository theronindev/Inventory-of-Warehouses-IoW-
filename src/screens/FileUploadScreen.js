/**
 * File Upload Screen
 * Supports XLSX, XLS, and CSV files
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../constants/colors';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { parseExcelFile } from '../utils/fileUtils';

export const FileUploadScreen = ({ 
  onFileLoaded, 
  existingData, 
  onUnlock,
  toast,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleFilePick = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
          'application/vnd.ms-excel', // xls
          'text/csv',
          'text/comma-separated-values',
          'application/csv',
          '*/*'
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];
      const fileName = file.name.toLowerCase();
      
      // Check file extension
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidExtension) {
        setError('Please select an Excel (.xlsx, .xls) or CSV file');
        setIsLoading(false);
        return;
      }

      // Parse the file
      const data = await parseExcelFile(file.uri, file.name);

      if (!data || data.length === 0) {
        setError('The file appears to be empty or invalid');
        setIsLoading(false);
        return;
      }

      // Validate required columns
      const firstRow = data[0];
      const keys = Object.keys(firstRow).map(k => k.toLowerCase());
      const hasItemCode = keys.some(k => k.includes('item') && k.includes('code'));

      if (!hasItemCode) {
        setError('File must contain an "Item Code" column');
        setIsLoading(false);
        return;
      }

      onFileLoaded(data, file.name);
      toast?.success(`Loaded ${data.length} items from ${file.name}`);

    } catch (err) {
      console.error('File pick error:', err);
      setError(err.message || 'Failed to read file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async () => {
    const success = await onUnlock(password);
    if (success) {
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>📁</Text>
          <Text style={styles.title}>Upload Master Data</Text>
          <Text style={styles.subtitle}>
            Import your Excel or CSV file containing item codes, descriptions, barcodes, and UOM
          </Text>
        </View>

        {existingData ? (
          <View style={styles.existingDataNotice}>
            <View style={styles.noticeIcon}>
              <Text style={styles.noticeIconText}>✓</Text>
            </View>
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Master Data Loaded</Text>
              <Text style={styles.noticeSubtitle}>
                {existingData.length} items available
              </Text>
            </View>
            <Button
              title="Change"
              variant="outline"
              size="small"
              onPress={() => setShowPasswordModal(true)}
            />
          </View>
        ) : (
          <View style={styles.uploadArea}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Processing file...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.uploadIcon}>📤</Text>
                <Text style={styles.uploadText}>Select your Excel file</Text>
                <Text style={styles.uploadSubtext}>Supports .xlsx, .xls, .csv</Text>
                <Button
                  title="Select File"
                  variant="primary"
                  size="large"
                  onPress={handleFilePick}
                  style={styles.uploadButton}
                />
              </>
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>File Requirements:</Text>
          <Text style={styles.requirementItem}>• Excel (.xlsx, .xls) or CSV format</Text>
          <Text style={styles.requirementItem}>• Must include "Item Code" column</Text>
          <Text style={styles.requirementItem}>• Recommended: Item Description, Item Barcode, Warehouse UOM, Brand Name</Text>
          <Text style={styles.requirementItem}>• UTF-8 encoding for Arabic text support</Text>
          <Text style={styles.requirementsTitle}>File Naming:</Text>
          <Text style={styles.requirementItem}>• Name your file as: Warehouse - Department</Text>
          <Text style={styles.requirementItem}>• Examples: "Shaab - Food.xlsx", "Tajiyat - HPCII.xlsx"</Text>
        </View>
      </View>

      <Modal
        visible={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPassword('');
          setPasswordError('');
        }}
        title="Enter Password"
      >
        <Text style={styles.modalText}>
          Enter the password to change or delete the master data file.
        </Text>
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
          error={passwordError}
        />
        <View style={styles.modalButtons}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => {
              setShowPasswordModal(false);
              setPassword('');
              setPasswordError('');
            }}
            style={styles.modalButton}
          />
          <Button
            title="Unlock"
            variant="primary"
            onPress={handleUnlock}
            style={styles.modalButton}
          />
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  existingDataNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7f6',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  noticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  noticeIconText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
  },
  noticeSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  uploadButton: {
    minWidth: 200,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '700',
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
  },
  requirements: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingVertical: 2,
  },
  modalText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
});

export default FileUploadScreen;
