/**
 * TransactionValidationService - Validates transactions before signing
 * 
 * Features:
 * - Validate all transaction parameters
 * - Check for malicious transaction patterns
 * - Verify recipient addresses
 * - Validate asset codes and issuers
 * - Implement transaction amount limits
 */

export interface TransactionParams {
    destination: string;
    amount: string;
    asset?: {
        code: string;
        issuer: string;
    };
    memo?: string;
    source?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ValidationConfig {
    maxTransactionAmount: number; // XLM
    maxDailyAmount: number; // XLM
    trustedIssuers: string[];
    blockedAddresses: string[];
    allowedAssetCodes: string[];
    requireMemoForExchanges: boolean;
}

interface DailyTransactionTracker {
    date: string;
    totalAmount: number;
    transactionCount: number;
}

const DEFAULT_CONFIG: ValidationConfig = {
    maxTransactionAmount: 10000, // 10,000 XLM per transaction
    maxDailyAmount: 50000, // 50,000 XLM per day
    trustedIssuers: [
        'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH', // Stellar.org
        'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', // USDC
    ],
    blockedAddresses: [],
    allowedAssetCodes: ['XLM', 'USDC', 'USDT', 'BTC', 'ETH'],
    requireMemoForExchanges: true,
};

// Known exchange addresses that require memos
const EXCHANGE_ADDRESSES = [
    'GCGNWKCJ3KHRLPM3TM6N7D3W5YKDJFL6A2YCXFXNMRTZ4Q66MEMZ6FI2', // Binance
    'GB6YPGW5JFMMP2QB2USQ33EUWTXVL4ZT5ITUNCY3YKVWOJPP57CANOF3', // Kraken
    // Add more exchange addresses as needed
];

class TransactionValidationService {
    private config: ValidationConfig;
    private dailyTracker: DailyTransactionTracker;

    constructor(config: Partial<ValidationConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.dailyTracker = this.loadDailyTracker();
    }

    /**
     * Validate transaction before signing
     */
    async validateTransaction(params: TransactionParams): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];
        let riskLevel: ValidationResult['riskLevel'] = 'LOW';

        // 1. Validate destination address
        const destValidation = this.validateDestination(params.destination);
        if (!destValidation.isValid) {
            errors.push(...destValidation.errors);
            riskLevel = this.escalateRisk(riskLevel, 'CRITICAL');
        }
        warnings.push(...destValidation.warnings);

        // 2. Validate amount
        const amountValidation = this.validateAmount(params.amount);
        if (!amountValidation.isValid) {
            errors.push(...amountValidation.errors);
            riskLevel = this.escalateRisk(riskLevel, amountValidation.riskLevel);
        }
        warnings.push(...amountValidation.warnings);

        // 3. Validate asset (if not XLM)
        if (params.asset) {
            const assetValidation = this.validateAsset(params.asset);
            if (!assetValidation.isValid) {
                errors.push(...assetValidation.errors);
                riskLevel = this.escalateRisk(riskLevel, assetValidation.riskLevel);
            }
            warnings.push(...assetValidation.warnings);
        }

        // 4. Check for malicious patterns
        const patternValidation = this.checkMaliciousPatterns(params);
        if (!patternValidation.isValid) {
            errors.push(...patternValidation.errors);
            riskLevel = this.escalateRisk(riskLevel, 'HIGH');
        }
        warnings.push(...patternValidation.warnings);

        // 5. Validate memo requirements
        const memoValidation = this.validateMemo(params);
        if (!memoValidation.isValid) {
            errors.push(...memoValidation.errors);
            riskLevel = this.escalateRisk(riskLevel, 'MEDIUM');
        }
        warnings.push(...memoValidation.warnings);

        // 6. Check daily limits
        const dailyLimitValidation = this.checkDailyLimits(params.amount);
        if (!dailyLimitValidation.isValid) {
            errors.push(...dailyLimitValidation.errors);
            riskLevel = this.escalateRisk(riskLevel, 'MEDIUM');
        }
        warnings.push(...dailyLimitValidation.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            riskLevel,
        };
    }

    /**
     * Validate destination address
     */
    private validateDestination(destination: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        let riskLevel: ValidationResult['riskLevel'] = 'LOW';

        // Check if address is valid Stellar format
        if (!this.isValidStellarAddress(destination)) {
            errors.push('Invalid Stellar address format');
            riskLevel = 'CRITICAL';
        }

        // Check if address is blocked
        if (this.config.blockedAddresses.includes(destination)) {
            errors.push('Destination address is blocked');
            riskLevel = 'CRITICAL';
        }

        // Check if address is known malicious
        if (this.isKnownMaliciousAddress(destination)) {
            errors.push('Destination address is flagged as malicious');
            riskLevel = 'CRITICAL';
        }

        // Warn if sending to self
        if (this.isSelfTransfer(destination)) {
            warnings.push('Sending to your own address');
        }

        return { isValid: errors.length === 0, errors, warnings, riskLevel };
    }

    /**
     * Validate transaction amount
     */
    private validateAmount(amount: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        let riskLevel: ValidationResult['riskLevel'] = 'LOW';

        const numAmount = parseFloat(amount);

        // Check if amount is valid number
        if (isNaN(numAmount) || numAmount <= 0) {
            errors.push('Invalid transaction amount');
            riskLevel = 'CRITICAL';
            return { isValid: false, errors, warnings, riskLevel };
        }

        // Check maximum transaction amount
        if (numAmount > this.config.maxTransactionAmount) {
            errors.push(
                `Transaction amount exceeds maximum limit of ${this.config.maxTransactionAmount} XLM`
            );
            riskLevel = 'HIGH';
        }

        // Warn for large transactions
        if (numAmount > this.config.maxTransactionAmount * 0.5) {
            warnings.push('Large transaction amount - please verify carefully');
            riskLevel = this.escalateRisk(riskLevel, 'MEDIUM');
        }

        // Check for suspiciously round numbers (potential typo)
        if (this.isSuspiciouslyRoundNumber(numAmount)) {
            warnings.push('Unusually round number - please verify amount');
        }

        return { isValid: errors.length === 0, errors, warnings, riskLevel };
    }

    /**
     * Validate asset code and issuer
     */
    private validateAsset(asset: { code: string; issuer: string }): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        let riskLevel: ValidationResult['riskLevel'] = 'LOW';

        // Validate asset code format
        if (!this.isValidAssetCode(asset.code)) {
            errors.push('Invalid asset code format');
            riskLevel = 'HIGH';
        }

        // Check if asset code is allowed
        if (!this.config.allowedAssetCodes.includes(asset.code)) {
            warnings.push(`Asset code ${asset.code} is not in the allowed list`);
            riskLevel = this.escalateRisk(riskLevel, 'MEDIUM');
        }

        // Validate issuer address
        if (!this.isValidStellarAddress(asset.issuer)) {
            errors.push('Invalid asset issuer address');
            riskLevel = 'HIGH';
        }

        // Check if issuer is trusted
        if (!this.config.trustedIssuers.includes(asset.issuer)) {
            warnings.push('Asset issuer is not in the trusted list - verify carefully');
            riskLevel = this.escalateRisk(riskLevel, 'MEDIUM');
        }

        // Check for fake asset codes (e.g., "USDC" from untrusted issuer)
        if (this.isPotentiallyFakeAsset(asset)) {
            warnings.push('Potential fake asset - verify issuer carefully');
            riskLevel = this.escalateRisk(riskLevel, 'HIGH');
        }

        return { isValid: errors.length === 0, errors, warnings, riskLevel };
    }

    /**
     * Check for malicious transaction patterns
     */
    private checkMaliciousPatterns(params: TransactionParams): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        let riskLevel: ValidationResult['riskLevel'] = 'LOW';

        // Check for address similarity attacks (typosquatting)
        if (this.hasAddressSimilarityAttack(params.destination)) {
            warnings.push('Destination address is similar to a known address - verify carefully');
            riskLevel = 'HIGH';
        }

        // Check for suspicious memo patterns
        if (params.memo && this.hasSuspiciousMemo(params.memo)) {
            warnings.push('Memo contains suspicious patterns');
            riskLevel = this.escalateRisk(riskLevel, 'MEDIUM');
        }

        // Check for rapid transaction pattern (potential compromise)
        if (this.hasRapidTransactionPattern()) {
            warnings.push('Rapid transaction pattern detected - verify this is intentional');
            riskLevel = this.escalateRisk(riskLevel, 'MEDIUM');
        }

        return { isValid: errors.length === 0, errors, warnings, riskLevel };
    }

    /**
     * Validate memo requirements
     */
    private validateMemo(params: TransactionParams): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        let riskLevel: ValidationResult['riskLevel'] = 'LOW';

        // Check if destination is an exchange that requires memo
        if (this.isExchangeAddress(params.destination)) {
            if (!params.memo || params.memo.trim() === '') {
                errors.push('Memo is required for exchange deposits - funds may be lost without it');
                riskLevel = 'HIGH';
            }
        }

        // Validate memo length
        if (params.memo && params.memo.length > 28) {
            warnings.push('Memo exceeds recommended length of 28 characters');
        }

        return { isValid: errors.length === 0, errors, warnings, riskLevel };
    }

    /**
     * Check daily transaction limits
     */
    private checkDailyLimits(amount: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        let riskLevel: ValidationResult['riskLevel'] = 'LOW';

        const numAmount = parseFloat(amount);
        const today = new Date().toISOString().split('T')[0];

        // Reset tracker if new day
        if (this.dailyTracker.date !== today) {
            this.dailyTracker = {
                date: today,
                totalAmount: 0,
                transactionCount: 0,
            };
        }

        const projectedTotal = this.dailyTracker.totalAmount + numAmount;

        // Check daily limit
        if (projectedTotal > this.config.maxDailyAmount) {
            errors.push(
                `Transaction would exceed daily limit of ${this.config.maxDailyAmount} XLM (current: ${this.dailyTracker.totalAmount.toFixed(2)} XLM)`
            );
            riskLevel = 'HIGH';
        }

        // Warn if approaching daily limit
        if (projectedTotal > this.config.maxDailyAmount * 0.8) {
            warnings.push('Approaching daily transaction limit');
            riskLevel = this.escalateRisk(riskLevel, 'MEDIUM');
        }

        return { isValid: errors.length === 0, errors, warnings, riskLevel };
    }

    /**
     * Record successful transaction
     */
    recordTransaction(amount: string): void {
        const numAmount = parseFloat(amount);
        const today = new Date().toISOString().split('T')[0];

        if (this.dailyTracker.date !== today) {
            this.dailyTracker = {
                date: today,
                totalAmount: 0,
                transactionCount: 0,
            };
        }

        this.dailyTracker.totalAmount += numAmount;
        this.dailyTracker.transactionCount += 1;
        this.saveDailyTracker();
    }

    /**
     * Get daily transaction summary
     */
    getDailySummary(): DailyTransactionTracker {
        const today = new Date().toISOString().split('T')[0];
        if (this.dailyTracker.date !== today) {
            return {
                date: today,
                totalAmount: 0,
                transactionCount: 0,
            };
        }
        return { ...this.dailyTracker };
    }

    /**
     * Helper: Check if address is valid Stellar format
     */
    private isValidStellarAddress(address: string): boolean {
        // Stellar addresses start with G and are 56 characters
        return /^G[A-Z2-7]{55}$/.test(address);
    }

    /**
     * Helper: Check if address is known malicious
     */
    private isKnownMaliciousAddress(address: string): boolean {
        // In production, check against a database of known malicious addresses
        // For now, return false
        return false;
    }

    /**
     * Helper: Check if sending to self
     */
    private isSelfTransfer(destination: string): boolean {
        // In production, compare with user's own addresses
        // For now, return false
        return false;
    }

    /**
     * Helper: Check if number is suspiciously round
     */
    private isSuspiciouslyRoundNumber(amount: number): boolean {
        // Check for numbers like 1000, 10000, 100000 (potential typos)
        return amount >= 1000 && amount % 1000 === 0;
    }

    /**
     * Helper: Check if asset code is valid
     */
    private isValidAssetCode(code: string): boolean {
        // Asset codes are 1-12 alphanumeric characters
        return /^[A-Za-z0-9]{1,12}$/.test(code);
    }

    /**
     * Helper: Check if asset is potentially fake
     */
    private isPotentiallyFakeAsset(asset: { code: string; issuer: string }): boolean {
        // Check if using common asset code but untrusted issuer
        const commonAssets = ['USDC', 'USDT', 'BTC', 'ETH'];
        return (
            commonAssets.includes(asset.code) &&
            !this.config.trustedIssuers.includes(asset.issuer)
        );
    }

    /**
     * Helper: Check for address similarity attacks
     */
    private hasAddressSimilarityAttack(address: string): boolean {
        // In production, check against user's known addresses
        // Look for addresses that differ by only a few characters
        return false;
    }

    /**
     * Helper: Check for suspicious memo
     */
    private hasSuspiciousMemo(memo: string): boolean {
        // Check for suspicious patterns in memo
        const suspiciousPatterns = [
            /phishing/i,
            /verify.*account/i,
            /urgent.*action/i,
            /click.*here/i,
        ];
        return suspiciousPatterns.some((pattern) => pattern.test(memo));
    }

    /**
     * Helper: Check for rapid transaction pattern
     */
    private hasRapidTransactionPattern(): boolean {
        // In production, check transaction history for rapid patterns
        // Multiple transactions in short time could indicate compromise
        return false;
    }

    /**
     * Helper: Check if address is an exchange
     */
    private isExchangeAddress(address: string): boolean {
        return EXCHANGE_ADDRESSES.includes(address);
    }

    /**
     * Helper: Escalate risk level
     */
    private escalateRisk(
        current: ValidationResult['riskLevel'],
        newLevel: ValidationResult['riskLevel']
    ): ValidationResult['riskLevel'] {
        const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const currentIndex = levels.indexOf(current);
        const newIndex = levels.indexOf(newLevel);
        return levels[Math.max(currentIndex, newIndex)] as ValidationResult['riskLevel'];
    }

    /**
     * Load daily tracker from storage
     */
    private loadDailyTracker(): DailyTransactionTracker {
        try {
            const stored = localStorage.getItem('daily_transaction_tracker');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load daily tracker:', error);
        }

        return {
            date: new Date().toISOString().split('T')[0],
            totalAmount: 0,
            transactionCount: 0,
        };
    }

    /**
     * Save daily tracker to storage
     */
    private saveDailyTracker(): void {
        try {
            localStorage.setItem('daily_transaction_tracker', JSON.stringify(this.dailyTracker));
        } catch (error) {
            console.error('Failed to save daily tracker:', error);
        }
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<ValidationConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): ValidationConfig {
        return { ...this.config };
    }

    /**
     * Add trusted issuer
     */
    addTrustedIssuer(issuer: string): void {
        if (!this.config.trustedIssuers.includes(issuer)) {
            this.config.trustedIssuers.push(issuer);
        }
    }

    /**
     * Remove trusted issuer
     */
    removeTrustedIssuer(issuer: string): void {
        this.config.trustedIssuers = this.config.trustedIssuers.filter((i) => i !== issuer);
    }

    /**
     * Add blocked address
     */
    addBlockedAddress(address: string): void {
        if (!this.config.blockedAddresses.includes(address)) {
            this.config.blockedAddresses.push(address);
        }
    }

    /**
     * Remove blocked address
     */
    removeBlockedAddress(address: string): void {
        this.config.blockedAddresses = this.config.blockedAddresses.filter((a) => a !== address);
    }
}

// Export singleton instance
export const transactionValidationService = new TransactionValidationService();

// Export class for custom instances
export { TransactionValidationService };
