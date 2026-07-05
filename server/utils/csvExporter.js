const { createObjectCsvStringifier } = require('csv-writer');

/**
 * Exports data objects to a CSV string
 * @param {Array<Object>} headers - Array of { id: 'keyName', title: 'Header Title' }
 * @param {Array<Object>} records - Array of data records
 * @returns {String} CSV content
 */
const exportToCsvString = (headers, records) => {
  const csvStringifier = createObjectCsvStringifier({
    header: headers,
  });

  const headerString = csvStringifier.getHeaderString();
  const recordsString = csvStringifier.stringifyRecords(records);

  return headerString + recordsString;
};

module.exports = {
  exportToCsvString,
};
