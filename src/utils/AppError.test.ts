import { AppError } from './AppError';
import { ErrorCode, ErrorStatusMap } from '../constants/ErrorCodes';

describe('AppError', () => {
  it('constructs with a code and a custom message', () => {
    const error = new AppError(ErrorCode.ERR_WALLET_NOT_CONNECTED, 'Please connect your wallet');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('AppError');
    expect(error.code).toBe(ErrorCode.ERR_WALLET_NOT_CONNECTED);
    expect(error.message).toBe('Please connect your wallet');
    expect(error.statusCode).toBe(ErrorStatusMap[ErrorCode.ERR_WALLET_NOT_CONNECTED]);
  });

  it('falls back to the error code as the message when none is provided', () => {
    const error = new AppError(ErrorCode.ERR_TRANSACTION_FAILED);

    expect(error.message).toBe(ErrorCode.ERR_TRANSACTION_FAILED);
  });

  it('maps every ErrorCode to its configured status code', () => {
    Object.values(ErrorCode).forEach((code) => {
      const error = new AppError(code as ErrorCode);
      expect(error.statusCode).toBe(ErrorStatusMap[code as ErrorCode]);
    });
  });

  it('defaults to a 500 status code for an unmapped code', () => {
    const error = new AppError('ERR_UNKNOWN' as ErrorCode);
    expect(error.statusCode).toBe(500);
  });

  it('serializes to a JSON-friendly response via toResponse()', () => {
    const error = new AppError(ErrorCode.ERR_NOT_FOUND, 'Resource missing');

    expect(error.toResponse()).toEqual({
      success: false,
      error: {
        code: ErrorCode.ERR_NOT_FOUND,
        message: 'Resource missing',
        statusCode: ErrorStatusMap[ErrorCode.ERR_NOT_FOUND],
      },
    });
  });

  describe('isAppError', () => {
    it('returns true for an AppError instance', () => {
      expect(AppError.isAppError(new AppError(ErrorCode.ERR_BAD_REQUEST))).toBe(true);
    });

    it('returns false for a plain Error', () => {
      expect(AppError.isAppError(new Error('oops'))).toBe(false);
    });

    it('returns false for non-error values', () => {
      expect(AppError.isAppError(null)).toBe(false);
      expect(AppError.isAppError(undefined)).toBe(false);
      expect(AppError.isAppError('error string')).toBe(false);
      expect(AppError.isAppError({ code: ErrorCode.ERR_BAD_REQUEST })).toBe(false);
    });
  });
});
