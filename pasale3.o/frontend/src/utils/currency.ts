import { useSettingsStore } from '../store/settingsStore';

/**
 * Formats a number as currency based on user settings.
 * @param amount The amount to format.
 * @returns Formatted string (e.g., "Rs. 1,500")
 */
export const formatCurrency = (amount: number): string => {
    const { general } = useSettingsStore.getState();
    const formattedAmount = amount.toLocaleString(
        general.numberFormat === 'indian' ? 'en-IN' : 'en-US'
    );

    const currencySymbols: Record<string, string> = {
        'NPR': 'Rs.',
        'INR': '₹',
        'USD': '$'
    };

    const symbol = currencySymbols[general.currency] || 'Rs.';

    return general.currencyPosition === 'start'
        ? `${symbol} ${formattedAmount}`
        : `${formattedAmount} ${symbol}`;
};
