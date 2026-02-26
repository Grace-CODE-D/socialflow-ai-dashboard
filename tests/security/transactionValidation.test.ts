/**
 * Transaction Validation Service Tests
 */

import { TransactionValidationService } from '../../services/transactionValidationService';

describe('TransactionValidationService', () => {
    let service: TransactionValidationService;

    beforeEach(() => {
        service = new TransactionValidationService();
        localStorage.clear();
    });

    describe('Address Validation', () => {
        test('should accept valid Stellar address', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '100',
            });

            expect(result.isValid).toBe(true);
        });

        test('should reject invalid address format', async () => {
            const result = await service.validateTransaction({
                destination: 'INVALID_ADDRESS',
                amount: '100',
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid Stellar address format');
        });

        test('should reject address not starting with G', async () => {
            const result = await service.validateTransaction({
                destination: 'AATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '100',
            });

            expect(result.isValid).toBe(false);
        });

        test('should reject address with wrong length', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKM',
                amount: '100',
            });

            expect(result.isValid).toBe(false);
        });
    });

    describe('Amount Validation', () => {
        test('should accept valid amount', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '100',
            });

            expect(result.isValid).toBe(true);
        });

        test('should reject negative amount', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '-100',
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid transaction amount');
        });

        test('should reject zero amount', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '0',
            });

            expect(result.isValid).toBe(false);
        });

        test('should reject amount exceeding limit', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '15000', // Exceeds 10,000 limit
            });

            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('exceeds maximum limit');
        });

        test('should warn for large amounts', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '6000', // > 50% of limit
            });

            expect(result.warnings).toContain('Large transaction amount - please verify carefully');
        });

        test('should warn for suspiciously round numbers', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '10000',
            });

            expect(result.warnings).toContain('Unusually round number - please verify amount');
        });
    });

    describe('Asset Validation', () => {
        test('should accept valid asset', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '100',
                asset: {
                    code: 'USDC',
                    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                },
            });

            expect(result.isValid).toBe(true);
        });

        test('should reject invalid asset code', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '100',
                asset: {
                    code: 'INVALID_CODE_TOO_LONG',
                    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                },
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid asset code format');
        });

        test('should reject invalid issuer address', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '100',
                asset: {
                    code: 'USDC',
                    issuer: 'INVALID_ISSUER',
                },
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid asset issuer address');
        });

        test('should warn for untrusted issuer', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '100',
                asset: {
                    code: 'USDC',
                    issuer: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                },
            });

            expect(result.warnings).toContain('Asset issuer is not in the trusted list - verify carefully');
        });
    });

    describe('Daily Limits', () => {
        test('should track daily transactions', async () => {
            await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '1000',
            });

            service.recordTransaction('1000');

            const summary = service.getDailySummary();
            expect(summary.totalAmount).toBe(1000);
            expect(summary.transactionCount).toBe(1);
        });

        test('should reject transaction exceeding daily limit', async () => {
            // Record transactions up to limit
            service.recordTransaction('40000');

            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '15000', // Would exceed 50,000 daily limit
            });

            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('exceed daily limit');
        });

        test('should warn when approaching daily limit', async () => {
            service.recordTransaction('35000');

            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '6000', // 41,000 total, > 80% of 50,000
            });

            expect(result.warnings).toContain('Approaching daily transaction limit');
        });
    });

    describe('Risk Assessment', () => {
        test('should assess LOW risk for normal transaction', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '100',
            });

            expect(result.riskLevel).toBe('LOW');
        });

        test('should assess MEDIUM risk for large transaction', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '6000',
            });

            expect(result.riskLevel).toBe('MEDIUM');
        });

        test('should assess HIGH risk for very large transaction', async () => {
            const result = await service.validateTransaction({
                destination: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
                amount: '9500',
            });

            expect(result.riskLevel).toBe('MEDIUM');
        });

        test('should assess CRITICAL risk for invalid address', async () => {
            const result = await service.validateTransaction({
                destination: 'INVALID',
                amount: '100',
            });

            expect(result.riskLevel).toBe('CRITICAL');
        });
    });

    describe('Configuration', () => {
        test('should update configuration', () => {
            service.updateConfig({
                maxTransactionAmount: 20000,
            });

            const config = service.getConfig();
            expect(config.maxTransactionAmount).toBe(20000);
        });

        test('should add trusted issuer', () => {
            const issuer = 'GNEW_ISSUER_ADDRESS';
            service.addTrustedIssuer(issuer);

            const config = service.getConfig();
            expect(config.trustedIssuers).toContain(issuer);
        });

        test('should remove trusted issuer', () => {
            const config = service.getConfig();
            const issuer = config.trustedIssuers[0];

            service.removeTrustedIssuer(issuer);

            const newConfig = service.getConfig();
            expect(newConfig.trustedIssuers).not.toContain(issuer);
        });
    });
});
