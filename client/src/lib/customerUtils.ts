/**
 * Generates a unique access code for customer portal
 * Format: CUST-XXXX-XXXX where XXXX are alphanumeric characters
 */
export function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = () => {
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  return `CUST-${randomPart()}-${randomPart()}`;
}

