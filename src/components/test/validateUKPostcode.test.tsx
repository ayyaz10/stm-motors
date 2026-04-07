import validateUKPostcode from './validateUKPostcode';

describe('validateUKPostcode function', () => {
  // ===== VALID POSTCODES =====
  test('validates standard London postcode SW1A 1AA', () => {
    expect(validateUKPostcode('SW1A 1AA')).toBe(true);
  });

  test('validates postcode without space SW1A1AA', () => {
    expect(validateUKPostcode('SW1A1AA')).toBe(true);
  });

  test('validates lowercase postcode sw1a 1aa', () => {
    expect(validateUKPostcode('sw1a 1aa')).toBe(true);
  });

  test('validates Manchester postcode M1 1AE', () => {
    expect(validateUKPostcode('M1 1AE')).toBe(true);
  });

  test('validates Birmingham postcode B33 8TH', () => {
    expect(validateUKPostcode('B33 8TH')).toBe(true);
  });

  test('validates special Girobank case GIR 0AA', () => {
    expect(validateUKPostcode('GIR 0AA')).toBe(true);
  });

  test('validates postcode with multiple spaces SW1A   1AA', () => {
    expect(validateUKPostcode('SW1A   1AA')).toBe(true);
  });

  test('validates Croydon postcode CR2 6XH', () => {
    expect(validateUKPostcode('CR2 6XH')).toBe(true);
  });

  test('validates Doncaster postcode DN55 8XT', () => {
    expect(validateUKPostcode('DN55 8XT')).toBe(true);
  });

  test('validates Belfast postcode BT1 1AA', () => {
    expect(validateUKPostcode('BT1 1AA')).toBe(true);
  });

  test('validates Cardiff postcode CF1 1AA', () => {
    expect(validateUKPostcode('CF1 1AA')).toBe(true);
  });

  test('validates Edinburgh postcode EH1 1AA', () => {
    expect(validateUKPostcode('EH1 1AA')).toBe(true);
  });

  test('validates Guernsey postcode GY1 1AA', () => {
    expect(validateUKPostcode('GY1 1AA')).toBe(true);
  });

  test('validates Jersey postcode JE1 1AA', () => {
    expect(validateUKPostcode('JE1 1AA')).toBe(true);
  });

  test('validates Isle of Man postcode IM1 1AA', () => {
    expect(validateUKPostcode('IM1 1AA')).toBe(true);
  });

  test('validates trailing space SW1A 1AA ', () => {
    expect(validateUKPostcode('SW1A 1AA ')).toBe(true);
  });

  test('validates leading space  SW1A 1AA', () => {
    expect(validateUKPostcode(' SW1A 1AA')).toBe(true);
  });

  // ===== INVALID POSTCODES =====
  test('rejects Q in first position Q1A 1AA', () => {
    expect(validateUKPostcode('Q1A 1AA')).toBe(false);
  });

  test('rejects V in first position V1A 1AA', () => {
    expect(validateUKPostcode('V1A 1AA')).toBe(false);
  });

  test('rejects X in first position X1A 1AA', () => {
    expect(validateUKPostcode('X1A 1AA')).toBe(false);
  });

  test('rejects I in last two characters SW1A 1II', () => {
    expect(validateUKPostcode('SW1A 1II')).toBe(false);
  });

  test('rejects J in last two characters SW1A 1JJ', () => {
    expect(validateUKPostcode('SW1A 1JJ')).toBe(false);
  });

  test('rejects Q in last two characters SW1A 1QQ', () => {
    expect(validateUKPostcode('SW1A 1QQ')).toBe(false);
  });

  test('rejects Z in last two characters SW1A 1ZZ', () => {
    expect(validateUKPostcode('SW1A 1ZZ')).toBe(false);
  });

  test('rejects wrong format SW1A AA1', () => {
    expect(validateUKPostcode('SW1A AA1')).toBe(false);
  });

  test('rejects completely reversed 1AA SW1A', () => {
    expect(validateUKPostcode('1AA SW1A')).toBe(false);
  });

  test('rejects too short SW1', () => {
    expect(validateUKPostcode('SW1')).toBe(false);
  });

  test('rejects too long SW1A 1AA 2BB', () => {
    expect(validateUKPostcode('SW1A 1AA 2BB')).toBe(false);
  });

  test('rejects hyphen SW1A-1AA', () => {
    expect(validateUKPostcode('SW1A-1AA')).toBe(false);
  });

  test('rejects underscore SW1A_1AA', () => {
    expect(validateUKPostcode('SW1A_1AA')).toBe(false);
  });

  test('rejects period SW1A.1AA', () => {
    expect(validateUKPostcode('SW1A.1AA')).toBe(false);
  });

  test('rejects comma SW1A,1AA', () => {
    expect(validateUKPostcode('SW1A,1AA')).toBe(false);
  });

  test('rejects just numbers 12345', () => {
    expect(validateUKPostcode('12345')).toBe(false);
  });

  test('rejects just letters ABCDE', () => {
    expect(validateUKPostcode('ABCDE')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(validateUKPostcode('')).toBe(false);
  });

  test('rejects null', () => {
    expect(validateUKPostcode(null)).toBe(false);
  });

  test('rejects undefined', () => {
    expect(validateUKPostcode(undefined)).toBe(false);
  });

  test('rejects incomplete N1 1', () => {
    expect(validateUKPostcode('N1 1')).toBe(false);
  });

  test('rejects incomplete N1 1A', () => {
    expect(validateUKPostcode('N1 1A')).toBe(false);
  });

  test('rejects invalid character ! SW1A 1A!', () => {
    expect(validateUKPostcode('SW1A 1A!')).toBe(false);
  });

  test('rejects invalid character @ SW1A 1A@', () => {
    expect(validateUKPostcode('SW1A 1A@')).toBe(false);
  });
});

// Test edge cases with describe.each for better organization
describe('validateUKPostcode edge cases', () => {
  type TestCase = [string | null | undefined, boolean, string];
  
  const testCases: TestCase[] = [
    // Format variations
    ['SW1A 1AA', true, 'Standard format with space'],
    ['SW1A1AA', true, 'No space'],
    ['sw1a 1aa', true, 'Lowercase'],
    ['SW1A   1AA', true, 'Multiple spaces'],
    [' SW1A 1AA', true, 'Leading space'],
    ['SW1A 1AA ', true, 'Trailing space'],
    
    // Invalid formats
    ['SW1A-1AA', false, 'Hyphen separator'],
    ['SW1A_1AA', false, 'Underscore separator'],
    ['SW1A.1AA', false, 'Period separator'],
    ['SW1A,1AA', false, 'Comma separator'],
    
    // Length variations
    ['SW1A 1AA 2BB', false, 'Too long'],
    ['SW1', false, 'Too short'],
    ['N1 1', false, 'Incomplete'],
    ['N1 1A', false, 'Almost complete'],
    
    // Invalid characters
    ['SW1A 1A!', false, 'Exclamation mark'],
    ['SW1A 1A@', false, 'At symbol'],
    ['SW1A 1A#', false, 'Hash'],
    ['12345', false, 'Only numbers'],
    ['ABCDE', false, 'Only letters'],
    
    // Edge cases
    ['', false, 'Empty string'],
    [null, false, 'Null'],
    [undefined, false, 'Undefined'],
  ];

  test.each(testCases)('"%s" should be %s: %s', (input, expected) => {
    expect(validateUKPostcode(input)).toBe(expected);
  });
});