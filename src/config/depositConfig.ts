import TonWeb from 'tonweb';

// Network configuration
export const NETWORK_CONFIG = {
  MAINNET: {
    DEPOSIT_ADDRESS: 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi',
    API_KEY: '26197ebc36a041a5546d69739da830635ed339c0d8274bdd72027ccbff4f4234',
    API_ENDPOINT: 'https://toncenter.com/api/v2/jsonRPC',
    NAME: 'Mainnet'
  },
  TESTNET: {
    DEPOSIT_ADDRESS: 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi',
    API_KEY: 'd682d9b65115976e52f63713d6dd59567e47eaaa1dc6067fe8a89d537dd29c2c',
    API_ENDPOINT: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    NAME: 'Testnet'
  }
};

// Toggle this for testing - can be moved to environment variable
export const IS_MAINNET = false;

// Current network configuration
export const CURRENT_NETWORK = IS_MAINNET ? NETWORK_CONFIG.MAINNET : NETWORK_CONFIG.TESTNET;

// TonWeb instance
export const tonweb = new TonWeb(
  new TonWeb.HttpProvider(CURRENT_NETWORK.API_ENDPOINT, {
    apiKey: CURRENT_NETWORK.API_KEY
  })
);

// Deposit configuration
export const DEPOSIT_CONFIG = {
  ADDRESS: CURRENT_NETWORK.DEPOSIT_ADDRESS,
  MIN_AMOUNT: 1, // Minimum 1 TON
  TRANSACTION_TIMEOUT: 20 * 60, // 20 minutes
  NETWORK_NAME: CURRENT_NETWORK.NAME
};

// Helper function to generate unique deposit ID
export const generateUniqueDepositId = (): number => {
  return Math.floor(Math.random() * 999999) + 1;
};

// Helper function to validate TON address
export const isValidTonAddress = (address: string): boolean => {
  try {
    // Basic TON address validation
    return address.length > 40 && (address.startsWith('UQ') || address.startsWith('EQ'));
  } catch {
    return false;
  }
};

// Helper function to format TON amount
export const formatTonAmount = (amount: number): string => {
  return amount.toFixed(2);
};

// Helper function to convert TON to nanoTON
export const toNanoTon = (amount: number): string => {
  return TonWeb.utils.toNano(amount.toString()).toString();
};