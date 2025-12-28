import { useState, useEffect } from 'react';

interface TonPriceData {
  price: number;
  change24h: number;
  lastUpdated: number;
}

export const useTonPrice = () => {
  // Load last known price from localStorage or use fallback
  const getInitialPrice = (): TonPriceData => {
    try {
      const stored = localStorage.getItem('lastTonPrice');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the stored data
        if (parsed.price && typeof parsed.price === 'number') {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load stored TON price:', error);
    }
    
    // Fallback if no stored price or invalid data
    return {
      price: 6.5,
      change24h: 0,
      lastUpdated: Date.now()
    };
  };

  const [tonPrice, setTonPrice] = useState<TonPriceData>(getInitialPrice());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTonPrice = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try multiple APIs for reliability
      const apis = [
        // CoinGecko API (free tier)
        'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd&include_24hr_change=true',
        // CoinMarketCap alternative (if you have API key)
        // 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=TON',
        // Fallback to a simple price API
        'https://api.coinbase.com/v2/exchange-rates?currency=TON'
      ];

      let priceData = null;

      // Try CoinGecko first
      try {
        const response = await fetch(apis[0]);
        if (response.ok) {
          const data = await response.json();
          if (data['the-open-network']) {
            priceData = {
              price: data['the-open-network'].usd,
              change24h: data['the-open-network'].usd_24h_change || 0,
              lastUpdated: Date.now()
            };
          }
        }
      } catch (err) {
        console.warn('CoinGecko API failed, trying fallback...');
      }

      // If CoinGecko fails, try Coinbase
      if (!priceData) {
        try {
          const response = await fetch(apis[1]);
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.rates && data.data.rates.USD) {
              priceData = {
                price: parseFloat(data.data.rates.USD),
                change24h: 0, // Coinbase doesn't provide 24h change in this endpoint
                lastUpdated: Date.now()
              };
            }
          }
        } catch (err) {
          console.warn('Coinbase API failed');
        }
      }

      if (priceData) {
        setTonPrice(priceData);
        // Store the successful price data for future use
        try {
          localStorage.setItem('lastTonPrice', JSON.stringify(priceData));
        } catch (error) {
          console.warn('Failed to store TON price:', error);
        }
      } else {
        throw new Error('All price APIs failed');
      }

    } catch (err) {
      console.error('Error fetching TON price:', err);
      setError('Failed to fetch TON price');
      // Keep using the last known price or fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch price immediately
    fetchTonPrice();

    // Set up interval to fetch price every 5 minutes
    const interval = setInterval(fetchTonPrice, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const refreshPrice = () => {
    fetchTonPrice();
  };

  return {
    tonPrice: tonPrice.price,
    change24h: tonPrice.change24h,
    lastUpdated: tonPrice.lastUpdated,
    isLoading,
    error,
    refreshPrice
  };
};