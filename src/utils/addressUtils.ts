import { toUserFriendlyAddress } from '@tonconnect/sdk';

// Enhanced interfaces for address handling
interface AddressFormat {
  type: 'user-friendly' | 'raw-with-workchain' | 'raw-without-workchain' | 'invalid';
  isBounceable?: boolean;
  workchain?: number;
  originalFormat: string;
}

/**
 * Detects the format of a TON address
 */
function detectAddressFormat(address: string): AddressFormat {
  if (!address) {
    return { type: 'invalid', originalFormat: address };
  }

  // User-friendly format detection (UQ/EQ/UK/EK prefix)
  // UQ/EQ = bounceable, UK/EK = non-bounceable
  if (/^[UE][QK][A-Za-z0-9_-]{46}$/.test(address)) {
    return {
      type: 'user-friendly',
      isBounceable: address.startsWith('EQ') || address.startsWith('UQ'),
      originalFormat: address
    };
  }
  
  // Raw format with workchain (workchain:64-char-hex)
  if (/^-?[01]:[a-fA-F0-9]{64}$/.test(address)) {
    const [workchain] = address.split(':');
    return {
      type: 'raw-with-workchain',
      workchain: parseInt(workchain),
      originalFormat: address
    };
  }
  
  // Raw format without workchain (64 hex chars)
  if (/^[a-fA-F0-9]{64}$/.test(address)) {
    return {
      type: 'raw-without-workchain',
      workchain: 0, // Default to workchain 0
      originalFormat: address
    };
  }
  
  return { type: 'invalid', originalFormat: address };
}

/**
 * Ensures a TON address is properly formatted with the ":" separator
 * TON Connect SDK requires addresses to include the ":" separator between workchain and address
 */
export function formatTonAddress(address: string): string {
  if (!address) return '';
  
  const format = detectAddressFormat(address);
  
  switch (format.type) {
    case 'user-friendly':
      // User-friendly addresses should not be modified
      return address;
      
    case 'raw-with-workchain':
      // Already has proper format
      return address;
      
    case 'raw-without-workchain':
      // Add workchain prefix
      return `${format.workchain}:${address}`;
      
    case 'invalid':
      // Return as-is for invalid addresses
      return address;
  }
}

/**
 * Validates if a TON address is in a valid format
 */
export function isValidTonAddress(address: string): boolean {
  if (!address) return false;
  
  const format = detectAddressFormat(address);
  return format.type !== 'invalid';
}

/**
 * Safely converts an address to user-friendly format with proper error handling
 */
export function safeToUserFriendlyAddress(address: string): string {
  try {
    if (!address) return '';

    const format = detectAddressFormat(address);
    
    switch (format.type) {
      case 'user-friendly':
        // Already in user-friendly format, return as-is
        // This fixes the main error where UQ/EQ addresses were being converted again
        return address;
        
      case 'raw-with-workchain':
        // Convert raw address to user-friendly using TON Connect SDK
        return toUserFriendlyAddress(address);
        
      case 'raw-without-workchain':
        // Add workchain prefix and convert
        const rawWithWorkchain = `${format.workchain}:${address}`;
        return toUserFriendlyAddress(rawWithWorkchain);
        
      case 'invalid':
        console.warn('Invalid address format detected:', address);
        return address; // Return original address as fallback
    }
  } catch (error) {
    console.error('Error converting address to user-friendly format:', error);
    // Return original address if conversion fails
    return address;
  }
}

/**
 * Truncates address for display purposes
 */
export function truncateAddress(address: string, start = 4, end = 4): string {
  if (!address) return '';
  
  const formattedAddress = formatTonAddress(address);
  const userFriendly = safeToUserFriendlyAddress(formattedAddress);
  
  if (userFriendly.length <= start + end + 3) {
    return userFriendly;
  }
  
  return `${userFriendly.slice(0, start)}...${userFriendly.slice(-end)}`;
}