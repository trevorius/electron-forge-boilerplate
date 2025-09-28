// Mock ReactDOM before any imports
const mockRender = jest.fn();
const mockCreateRoot = jest.fn(() => ({ render: mockRender }));

// Mock the default export
const mockReactDOM = {
  createRoot: mockCreateRoot
};

jest.mock('react-dom/client', () => ({
  __esModule: true,
  default: mockReactDOM,
  createRoot: mockCreateRoot
}));

// Mock React
jest.mock('react', () => ({
  StrictMode: ({ children }: any) => children,
  createElement: jest.fn((type, props, ...children) => ({ type, props, children }))
}));

// Mock i18n before any imports
jest.mock('./i18n', () => ({}));

// Mock LicenseApp
jest.mock('./components/license/LicenseApp', () => {
  const React = require('react');
  return function MockLicenseApp() {
    return React.createElement('div', { 'data-testid': 'mock-license-app' }, 'License App');
  };
});

// CSS and i18n imports will be handled by jest moduleNameMapper

// Mock DOM
const mockElement = document.createElement('div');
mockElement.id = 'license-root';

describe('license-main', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock getElementById to return our mock element
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render LicenseApp to license-root element', () => {
    // Import to trigger execution (this covers the import line)
    require('./license-main');

    // Verify createRoot was called with correct element (covers line 7)
    expect(document.getElementById).toHaveBeenCalledWith('license-root');
    expect(mockCreateRoot).toHaveBeenCalledWith(mockElement);

    // Verify render was called (covers lines 8-10)
    expect(mockRender).toHaveBeenCalledTimes(1);

    // Verify the rendered content structure
    const renderCall = mockRender.mock.calls[0][0];
    expect(renderCall.type.name).toBe('StrictMode');
  });

  it('should call createRoot with the correct DOM element', () => {
    // Clear previous calls
    jest.clearAllMocks();

    // Re-import to trigger execution again
    jest.resetModules();
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

    require('./license-main');

    expect(document.getElementById).toHaveBeenCalledWith('license-root');
    expect(mockCreateRoot).toHaveBeenCalledWith(mockElement);
  });

  it('should render in StrictMode', () => {
    // Clear and re-run
    jest.clearAllMocks();
    jest.resetModules();
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

    require('./license-main');

    expect(mockRender).toHaveBeenCalledTimes(1);
    const renderCall = mockRender.mock.calls[0][0];

    // Check that StrictMode is used
    expect(renderCall.type.name).toBe('StrictMode');

    // Check that LicenseApp is wrapped in StrictMode
    expect(renderCall.props.children.type.name).toBe('MockLicenseApp');
  });
});