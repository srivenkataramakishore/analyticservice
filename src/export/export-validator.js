const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 90;
const VALID_FORMATS = ['csv', 'json'];

/**
 * Validate export query params.
 * Returns null on success, or an object { status, code, message } on failure.
 *
 * @param {object} query - Express req.query
 * @returns {{ status: number, code: string, message: string } | null}
 */
function validateExportParams(query) {
  const { format, startDate, endDate } = query;

  if (!format || !VALID_FORMATS.includes(format)) {
    return {
      status: 400,
      code: 'INVALID_FORMAT',
      message: 'format must be "csv" or "json"',
    };
  }

  if (!startDate || !DATE_REGEX.test(startDate) || isNaN(Date.parse(startDate))) {
    return {
      status: 400,
      code: 'INVALID_DATE',
      message: 'startDate is required and must be in YYYY-MM-DD format',
    };
  }

  if (!endDate || !DATE_REGEX.test(endDate) || isNaN(Date.parse(endDate))) {
    return {
      status: 400,
      code: 'INVALID_DATE',
      message: 'endDate is required and must be in YYYY-MM-DD format',
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return {
      status: 400,
      code: 'INVALID_DATE',
      message: 'startDate must be before or equal to endDate',
    };
  }

  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > MAX_RANGE_DAYS) {
    return {
      status: 400,
      code: 'DATE_RANGE_TOO_LARGE',
      message: `Date range must not exceed ${MAX_RANGE_DAYS} days`,
    };
  }

  return null;
}

module.exports = { validateExportParams };
