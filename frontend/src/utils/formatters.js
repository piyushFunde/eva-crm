/**
 * Format a number as Indian Rupee currency
 * @param {number} amount
 * @returns {string} e.g. "₹3,000"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/**
 * Format a date string to readable format
 * @param {string|Date} date
 * @returns {string} e.g. "12 May 2026"
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time from date
 * @param {string|Date} date
 * @returns {string} e.g. "10:30 AM"
 */
export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get greeting based on time of day
 * @returns {string}
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Check if a date is today
 * @param {string|Date} date
 * @returns {boolean}
 */
export function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Check if a date is overdue (before today)
 * @param {string|Date} date
 * @returns {boolean}
 */
export function isOverdue(date) {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}
