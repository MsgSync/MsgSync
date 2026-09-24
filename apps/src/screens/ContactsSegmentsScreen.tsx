import React from 'react';
import { ContactsScreen } from './ContactsScreen';

export const ContactsSegmentsScreen: React.FC<{ onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void }> = ({ onShowToast }) => {
  return <ContactsScreen onShowToast={onShowToast} />;
};
